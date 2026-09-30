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
              <h2 className="text-2xl font-bold text-charcoal mb-2">Failed to Load Analytics</h2>
              <p className="text-stone">{error || 'Unable to fetch course analytics'}</p>
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
          <div className="min-h-screen bg-paper">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={() => router.back()}
                  className="text-sm text-stone hover:text-charcoal mb-4 flex items-center"
                >
                  ← Back to Courses
                </button>
                <h1 className="text-3xl font-bold text-charcoal">Course Analytics</h1>
                <p className="text-stone mt-2">Track your course performance and student engagement</p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Enrollments */}
                <button
                  onClick={() => router.push(`/instructor/courses/${courseId}/students`)}
                  className="bg-white rounded-md shadow-sm border border-border/60 p-6 hover:shadow-sm hover:border-primary-300 transition-all text-left w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary-100 rounded-md">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-pewter" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal mb-1">
                    {analytics.totalEnrollments || 0}
                  </div>
                  <div className="text-sm text-stone">Total Enrollments</div>
                  <div className="mt-2 text-xs text-forest-600 flex items-center">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {analytics.activeStudents || 0} active
                  </div>
                  <div className="mt-2 text-xs text-primary-600 font-medium">
                    Click to view students →
                  </div>
                </button>

                {/* Completion Rate */}
                <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-forest-100 rounded-md">
                      <TrophyIcon className="h-6 w-6 text-forest-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-charcoal mb-1">
                    {(analytics.completionRate || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-stone">Completion Rate</div>
                  <div className="mt-2">
                    <div className="w-full bg-forest-100 rounded-full h-2">
                      <div
                        className="bg-forest-600 h-2 rounded-full transition-all"
                        style={{ width: `${analytics.completionRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Average Rating */}
                <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-ochre-100 rounded-md">
                      <StarIcon className="h-6 w-6 text-ochre-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-charcoal mb-1">
                    {(Number(analytics.averageRating) || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-stone">Average Rating</div>
                  <div className="mt-2 text-xs text-stone">
                    {Number(analytics.totalRatings) || 0} ratings
                  </div>
                </div>

                {/* Average Progress */}
                <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-terracotta-100 rounded-md">
                      <ChartBarIcon className="h-6 w-6 text-terracotta-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-charcoal mb-1">
                    {(analytics.averageProgress || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-stone">Average Progress</div>
                  <div className="mt-2">
                    <div className="w-full bg-forest-100 rounded-full h-2">
                      <div
                        className="bg-terracotta-600 h-2 rounded-full transition-all"
                        style={{ width: `${analytics.averageProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="bg-white rounded-md shadow-sm border border-border/60 p-6 mb-8">
                <h2 className="text-xl font-bold text-charcoal mb-6">Engagement Metrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border-l-4 border-primary-600 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ClockIcon className="h-5 w-5 text-pewter" />
                      <span className="text-sm text-stone">Average Time Spent</span>
                    </div>
                    <div className="text-2xl font-bold text-charcoal">
                      {formatTime(analytics.engagementMetrics?.averageTimeSpent || 0)}
                    </div>
                  </div>

                  <div className="border-l-4 border-forest-600 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ChartBarIcon className="h-5 w-5 text-pewter" />
                      <span className="text-sm text-stone">Lesson Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-charcoal">
                      {(analytics.engagementMetrics?.lessonCompletionRate || 0).toFixed(1)}%
                    </div>
                  </div>

                  <div className="border-l-4 border-terracotta-600 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrophyIcon className="h-5 w-5 text-pewter" />
                      <span className="text-sm text-stone">Quiz Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-charcoal">
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
