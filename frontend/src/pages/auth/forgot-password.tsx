import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { forgotPassword } from '@/lib/api/auth';
import { withBasePath } from '@/lib/basePath';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset your password — Chitepo School of Ideology</title>
        <meta
          name="description"
          content="Reset your Chitepo School of Ideology account password."
        />
      </Head>

      <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
        <AuthBrandPanel
          headline="We will get you back to your learning."
          body="Enter your email address and we will send you a secure link to reset your password."
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
                Reset your password
              </h1>
              <p className="text-stone mb-8">
                Enter the email address linked to your account.
              </p>

              {error && (
                <div className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100 rounded-r-md" role="alert">
                  <p className="text-sm text-terracotta-700">{error}</p>
                </div>
              )}

              {submitted ? (
                <div className="bg-paper border border-border/60 rounded-md p-6">
                  <p className="text-charcoal mb-3">
                    If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                  </p>
                  <p className="text-sm text-stone mb-6">
                    Please check your inbox (and spam folder) for the next steps.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                  >
                    Back to sign in
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-4 py-3 bg-white border border-border/60 rounded-md text-charcoal placeholder:text-pewter focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-colors"
                      placeholder="you@example.com"
                    />
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
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending link...
                      </>
                    ) : (
                      <>
                        Send reset link
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <Link
                      href="/auth/login"
                      className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
