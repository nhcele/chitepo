import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import RecommendationsDisplay from '../components/learner/RecommendationsDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function RecommendationsPage() {
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
        <title>Course Recommendations - Mindelta</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecommendationsDisplay />
      </div>
    </Layout>
  );
}

