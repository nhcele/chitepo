import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ClassroomSessionView from '@/components/trainer/ClassroomSessionView';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

export default function TrainerSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { sessionId } = router.query;

  React.useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Check if user is instructor
  if (user.role !== 'instructor' && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-700 px-4 py-3 rounded-md">
            You must be an instructor to access this page.
          </div>
        </div>
      </Layout>
    );
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-700 px-4 py-3 rounded-md">
            Invalid session ID
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ClassroomSessionView sessionId={sessionId} />
    </Layout>
  );
}

