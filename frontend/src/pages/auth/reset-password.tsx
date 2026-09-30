import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { resetPassword } from '@/lib/api/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is invalid or has expired. Please request a new one.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Set a New Password - Chitepo School of Ideology</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
            <h2 className="text-3xl font-bold text-charcoal">Set a new password</h2>
            <p className="mt-2 text-sm text-stone">
              Choose a strong password with upper &amp; lower case, a number and a symbol.
            </p>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-md sm:px-10">
              {done ? (
                <div className="text-center">
                  <p className="text-forest-700 font-medium">Your password has been reset.</p>
                  <p className="mt-2 text-sm text-stone">Redirecting you to sign in…</p>
                  <Link href="/auth/login" className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-500">
                    Sign in now
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && <div className="rounded-md bg-terracotta-50 p-3 text-sm text-terracotta-700">{error}</div>}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-charcoal">New password</label>
                    <div className="mt-1 relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <LockClosedIcon className="h-5 w-5 text-pewter" />
                      </div>
                      <input id="password" name="password" type="password" required value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-border/60 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="New password" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-charcoal">Confirm password</label>
                    <div className="mt-1 relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <LockClosedIcon className="h-5 w-5 text-pewter" />
                      </div>
                      <input id="confirm" name="confirm" type="password" required value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-border/60 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Confirm new password" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                    {isLoading ? 'Resetting…' : 'Reset password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
