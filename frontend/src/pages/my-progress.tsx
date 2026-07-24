import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import StudentProgressDashboard from '../components/learner/StudentProgressDashboard';
import { useAuth } from '../contexts/AuthContext';
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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>My Progress - Chitepo</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Learning Progress</h1>
          <p className="text-gray-600 mt-2">Track your progress and see personalized recommendations</p>
        </div>
        <StudentProgressDashboard />
      </div>
    </Layout>
  );
}

