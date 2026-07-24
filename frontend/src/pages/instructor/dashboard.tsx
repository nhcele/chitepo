import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import { UserRole } from '@mindelta/shared';
import { instructorGetMetrics, type InstructorMetricsDTO } from '@/lib/api/instructor';
import InstructorStatsCard from '@/components/instructor/InstructorStatsCard';
import CoursePerformanceChart from '@/components/instructor/CoursePerformanceChart';
import RecentActivity from '@/components/instructor/RecentActivity';
import QuickActions from '@/components/instructor/QuickActions';
import {
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function InstructorDashboard() {
  const [metrics, setMetrics] = useState<InstructorMetricsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatActivityTime = (iso: string) => {
    try {
      return formatDistanceToNow(new Date(iso), { addSuffix: true });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const m = await instructorGetMetrics();
        setMetrics(m);
      } catch (e: any) {
        setError(e?.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <>
      <Head>
        <title>Instructor Dashboard - Chitepo</title>
        <meta name="description" content="Instructor dashboard for managing courses, tracking revenue, and viewing analytics on Chitepo." />
      </Head>
      <Layout>
        <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          {/* Enhanced Hero Section */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full mb-4"
                >
                  <AcademicCapIcon className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, Instructor!
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Track your teaching performance, manage courses, and grow your impact.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-accent-500 hover:from-blue-700 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Course
                  </Link>
                  <Link
                    href="/instructor/analytics"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    View Analytics
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <InstructorStatsCard
                title="Monthly Revenue"
                value={loading ? '—' : metrics ? `$${metrics.monthlyRevenue.toFixed(2)}` : '—'}
                icon={CurrencyDollarIcon}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
                loading={loading}
              />
              <InstructorStatsCard
                title="Published Courses"
                value={loading ? '—' : metrics ? metrics.publishedCourses : '—'}
                icon={AcademicCapIcon}
                color="text-primary-600"
                bgColor="bg-primary-50"
                loading={loading}
              />
              <InstructorStatsCard
                title="Total Learners"
                value={loading ? '—' : metrics ? metrics.totalLearners : '—'}
                icon={UserGroupIcon}
                color="text-purple-600"
                bgColor="bg-purple-50"
                loading={loading}
              />
              <InstructorStatsCard
                title="Avg. Rating"
                value={loading ? '—' : ((metrics as any)?.averageRating ? (metrics as any).averageRating.toFixed(1) : 'New')}
                icon={StarIcon}
                color="text-yellow-600"
                bgColor="bg-yellow-50"
                loading={loading}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Performance Chart */}
              <div className="lg:col-span-2">
                <CoursePerformanceChart
                  data={metrics?.coursePerformance || []}
                  loading={loading}
                />
              </div>

              {/* Recent Activity */}
              <div>
                <RecentActivity
                  activities={(metrics?.recentActivity || []).map((a) => ({ ...a, timestamp: formatActivityTime(a.timestamp) }))}
                  loading={loading}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <QuickActions />
            </div>
          </div>
        </RoleGuard>
      </Layout>
    </>
  );
}
