import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';

interface CourseAnalytics {
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  totalRatings: number;
  engagementMetrics: {
    averageTimeSpent: number;
    lessonCompletionRate: number;
    quizCompletionRate: number;
  };
}

export default function CourseAnalyticsPage() {
  const router = useRouter();
  const { courseId } = router.query as { courseId?: string };
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const data = await apiClient.get<CourseAnalytics>(`/instructor/analytics/${courseId}`);
        setAnalytics(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Layout>
      </RoleGuard>
    );
  }

  if (error || !analytics) {
    return (
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h2>
              <p className="text-gray-600">{error || 'Unable to fetch course analytics'}</p>
            </div>
          </div>
        </Layout>
      </RoleGuard>
    );
  }

  return (
    <>
      <Head>
        <title>Course Analytics | Instructor Dashboard</title>
      </Head>

      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={() => router.back()}
                  className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center"
                >
                  ← Back to Courses
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Course Analytics</h1>
                <p className="text-gray-600 mt-2">Track your course performance and student engagement</p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Enrollments */}
                <button
                  onClick={() => router.push(`/instructor/courses/${courseId}/students`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all text-left w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {analytics.totalEnrollments || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Enrollments</div>
                  <div className="mt-2 text-xs text-green-600 flex items-center">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {analytics.activeStudents || 0} active
                  </div>
                  <div className="mt-2 text-xs text-primary-600 font-medium">
                    Click to view students →
                  </div>
                </button>

                {/* Completion Rate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrophyIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {(analytics.completionRate || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${analytics.completionRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Average Rating */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <StarIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {(Number(analytics.averageRating) || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {Number(analytics.totalRatings) || 0} ratings
                  </div>
                </div>

                {/* Average Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {(analytics.averageProgress || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Progress</div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${analytics.averageProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Metrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border-l-4 border-primary-600 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Average Time Spent</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTime(analytics.engagementMetrics?.averageTimeSpent || 0)}
                    </div>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ChartBarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Lesson Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(analytics.engagementMetrics?.lessonCompletionRate || 0).toFixed(1)}%
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrophyIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Quiz Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(analytics.engagementMetrics?.quizCompletionRate || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Layout>
      </RoleGuard>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
