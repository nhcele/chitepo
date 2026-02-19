import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import MessagingInterface from '../components/messaging/MessagingInterface';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const router = useRouter();
  const { courseId, userId } = router.query;
  const { user, isAuthenticated, isLoading } = useAuth();
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin' || user?.role === 'super_admin';

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
        <title>Messages - Mindelta</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center">
            <EnvelopeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">
                {isInstructor ? 'Communicate with your students' : 'Chat with your instructors'}
              </p>
            </div>
          </div>
        </div>
        <MessagingInterface
          courseId={courseId as string | undefined}
          otherUserId={userId as string | undefined}
          isInstructor={isInstructor}
        />
      </div>
    </Layout>
  );
}

