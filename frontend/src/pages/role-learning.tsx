import { useEffect } from 'react';
import { useRouter } from 'next/router';
import RoleBasedLearningDashboard from '@/components/learner/RoleBasedLearningDashboard';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

export default function RoleLearningPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <RoleBasedLearningDashboard />
      </div>
    </Layout>
  );
}
