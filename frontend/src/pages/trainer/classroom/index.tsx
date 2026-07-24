import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TrainerDashboard from '@/components/trainer/TrainerDashboard';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

export default function TrainerClassroomPage() {
  const { user } = useAuth();
  const router = useRouter();

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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            You must be an instructor to access this page.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TrainerDashboard trainerId={user.id} />
    </Layout>
  );
}

