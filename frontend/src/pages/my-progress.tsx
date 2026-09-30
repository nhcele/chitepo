import React from 'react';
import Head from 'next/head';
import AppLayout from '@/components/layouts/AppLayout';
import StudentProgressDashboard from '@/components/learner/StudentProgressDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

export default function MyProgressPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My progress — Chitepo</title>
      </Head>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-2">
              My learning progress
            </h1>
            <p className="text-lg text-stone">
              Track your progress and see personalized recommendations
            </p>
          </div>
          <StudentProgressDashboard />
        </div>
      </AppLayout>
    </>
  );
}
