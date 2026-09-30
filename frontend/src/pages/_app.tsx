import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';

declare global {
  interface Window {
    __chitepoFetchPatched?: boolean;
    __chitepoDevServiceWorkerCleaned?: boolean;
  }
}

// Sub-path support: Next prefixes <Link>/router/next-image automatically, but
// NOT raw fetch('/api/...'). Rewrite those to include basePath. No-op at root.
if (typeof window !== 'undefined' && !window.__chitepoFetchPatched) {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (bp) {
    const orig = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && input.startsWith('/api') && !input.startsWith(bp + '/api')) {
        input = bp + input;
      }
      return orig(input, init);
    };
  }
  window.__chitepoFetchPatched = true;
}

if (
  typeof window !== 'undefined'
  && process.env.NODE_ENV === 'development'
  && 'serviceWorker' in navigator
  && !window.__chitepoDevServiceWorkerCleaned
) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => undefined);

  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined);
  }

  window.__chitepoDevServiceWorkerCleaned = true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <div>
              <Component {...pageProps} />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </AuthProvider>
        </MotionConfig>
      </ThemeProvider>
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
