import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { withBasePath } from '@/lib/basePath';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <Head>
        <title>Welcome back — Chitepo School of Ideology</title>
        <meta
          name="description"
          content="Sign in to your Chitepo School of Ideology account to continue your learning journey."
        />
      </Head>

      <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
        <AuthBrandPanel
          headline="Continue your journey in African political education."
          body="Access your courses, track your progress, and connect with a community of learners across the continent and diaspora."
        />

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 py-12 lg:py-0">
          <div className="max-w-md w-full mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Mobile logo */}
              <div className="flex items-center gap-3 mb-8 lg:hidden">
                <span className="relative block h-10 w-10 flex-shrink-0">
                  <Image
                    src={withBasePath('/chitepo-logo.jpg')}
                    alt="Chitepo School of Ideology"
                    fill
                    className="object-contain"
                    sizes="2.5rem"
                    loading="eager"
                    fetchPriority="high"
                  />
                </span>
                <div>
                  <span className="font-serif text-base font-semibold text-charcoal leading-tight block">
                    Chitepo
                  </span>
                  <span className="text-xs text-stone leading-tight block">School of Ideology</span>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-3">
                Welcome back
              </h1>
              <p className="text-stone mb-8">Sign in to continue your learning.</p>

              {error && (
                <div
                  className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100 rounded-r-md"
                  role="alert"
                >
                  <p className="text-sm text-terracotta-700">{error}</p>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 bg-white border border-border/60 rounded-md text-charcoal placeholder:text-pewter focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-charcoal">
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-forest-600 hover:text-forest-500 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 bg-white border border-border/60 rounded-md text-charcoal placeholder:text-pewter focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-colors"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-pewter hover:text-stone transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-forest-600 border-border/60 rounded focus:ring-forest-600"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-stone">
                    Keep me signed in
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-border/60 text-center">
                <p className="text-sm text-stone">
                  New to Chitepo?{' '}
                  <Link
                    href="/auth/register"
                    className="font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
