import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { verifyEmail } from '@/lib/api/auth';

type Status = 'pending' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const token = typeof router.query.token === 'string' ? router.query.token : '';
    if (!token) {
      setStatus('error');
      setMessage('No verification token was provided.');
      return;
    }
    setStatus('verifying');
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. You can now sign in.');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || err?.message || 'Verification failed.');
      });
  }, [router.isReady, router.query.token]);

  return (
    <>
      <Head>
        <title>Verify Email - Chitepo School of Ideology</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-md sm:px-10 text-center">
              <h2 className="text-2xl font-bold text-charcoal">Email verification</h2>
              <p className={`mt-4 text-sm ${status === 'success' ? 'text-forest-700' : status === 'error' ? 'text-terracotta-700' : 'text-stone'}`}>
                {status === 'verifying' || status === 'pending' ? 'Verifying your email…' : message}
              </p>
              {(status === 'success' || status === 'error') && (
                <Link href="/auth/login" className="mt-6 inline-block font-medium text-primary-600 hover:text-primary-500">
                  Go to sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
