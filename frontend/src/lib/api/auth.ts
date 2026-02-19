import { User, AuthTokens, CreateUserDto } from '@mindelta/shared';
import { apiClient } from './client';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

interface BackendLoginResponse {
  access_token: string;
  user: User;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    // Backend returns { access_token, user }
    const tokenRes = await apiClient.post<BackendLoginResponse>('/api/auth/login', { email, password });
    const accessToken = tokenRes.access_token;
    const user = tokenRes.user;
    
    // If user is already in response, use it; otherwise fetch it
    if (user) {
      return { user, tokens: { accessToken, refreshToken: '' } };
    }
    
    // Fallback: Fetch profile using the token
    const userRes = await apiClient.get<ApiEnvelope<User>>('/api/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { user: userRes.data, tokens: { accessToken, refreshToken: '' } };
  } catch (error: any) {
    // Improve error message for 404
    if (error.response?.status === 404) {
      throw new Error('Login endpoint not found. Please check if the backend server is running.');
    }
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Failed to login. Please try again.');
  }
}

export async function register(userData: CreateUserDto): Promise<RegisterResponse> {
  try {
    // Backend returns { access_token, user }
    const tokenRes = await apiClient.post<BackendLoginResponse>('/api/auth/register', userData);
    const accessToken = tokenRes.access_token;
    const user = tokenRes.user;
    
    // If user is already in response, use it; otherwise fetch it
    if (user) {
      return { user, tokens: { accessToken, refreshToken: '' } };
    }
    
    // Fallback: Fetch profile using the token
    const userRes = await apiClient.get<ApiEnvelope<User>>('/api/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { user: userRes.data, tokens: { accessToken, refreshToken: '' } };
  } catch (error: any) {
    // Improve error message for 404
    if (error.response?.status === 404) {
      throw new Error('Registration endpoint not found. Please check if the backend server is running.');
    }
    if (error.response?.status === 401 || error.response?.status === 409) {
      throw new Error(error.response?.data?.message || 'User already exists or invalid data');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Failed to register. Please try again.');
  }
}

export async function getProfile(): Promise<User> {
  const res = await apiClient.get<ApiEnvelope<User>>('/api/users/me');
  return res.data;
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  // If/when backend supports refresh, adapt here. Placeholder keeps shape.
  const res = await apiClient.post<{ access_token: string }>('/api/auth/refresh', { refreshToken });
  return { accessToken: res.access_token, refreshToken };
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/api/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/api/auth/verify-email', { token });
}
