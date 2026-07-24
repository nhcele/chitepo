import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { forgotPassword } from '@/lib/api/auth';

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
      // Backend intentionally returns a generic response; only surface transport errors.
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Chitepo School of Ideology</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
            <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {submitted ? (
                <div className="text-center">
                  <p className="text-gray-800">
                    If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                    Please check your inbox (and spam folder).
                  </p>
                  <Link href="/auth/login" className="mt-6 inline-block font-medium text-primary-600 hover:text-primary-500">
                    Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <div className="mt-1 relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email" name="email" type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                    {isLoading ? 'Sending…' : 'Send reset link'}
                  </button>
                  <div className="text-center">
                    <Link href="/auth/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">Back to sign in</Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
