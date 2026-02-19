import React from 'react';
import Head from 'next/head';
import Layout from '../../../../components/Layout';
import StudentManagement from '../../../../components/instructor/StudentManagement';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/router';
import RoleGuard from '../../../../components/RoleGuard';
import { UserRole } from '@mindelta/shared';

export default function CourseStudentsPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!courseId || typeof courseId !== 'string') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Invalid course ID</p>
        </div>
      </Layout>
    );
  }

  return (
    <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <Head>
          <title>Student Management - Mindelta</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StudentManagement courseId={courseId} />
        </div>
      </Layout>
    </RoleGuard>
  );
}

