import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { User, UserRole } from '@mindelta/shared';
import * as authApi from '@/lib/api/auth';
import { setAuthToken, removeAuthToken, getStoredToken } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getPostAuthRedirect(user: User) {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return '/admin';
  }

  if (user.role === UserRole.INSTRUCTOR) {
    return '/instructor/courses';
  }

  return '/dashboard';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        // Retry a few times on network/5xx errors (e.g. backend restarting) and
        // only sign out on a genuine auth failure (401/403). A transient backend
        // outage must NOT clear the session and log the user out.
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const userData = await authApi.getProfile();
            setUser(userData);
            break;
          } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
              removeAuthToken();
              break;
            }
            console.error('Failed to get user profile (attempt ' + (attempt + 1) + '):', error?.message || error);
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
            // On persistent network failure keep the token so the session
            // recovers on the next load once the backend is reachable again.
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: userData, tokens } = await authApi.login(email, password);
      setAuthToken(tokens.accessToken);
      setUser(userData);
      router.push(getPostAuthRedirect(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const { user: newUser, tokens } = await authApi.register(userData);
      setAuthToken(tokens.accessToken);
      setUser(newUser);
      router.push(getPostAuthRedirect(newUser));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push('/');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
