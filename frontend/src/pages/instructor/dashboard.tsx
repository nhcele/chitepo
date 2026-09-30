import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import RoleGuard from '@/components/RoleGuard';
import AppLayout from '@/components/layouts/AppLayout';
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
        <title>Studio — Chitepo</title>
        <meta name="description" content="Instructor studio for managing courses, tracking revenue, and viewing analytics on Chitepo." />
      </Head>
      <AppLayout>
        <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-border/60 bg-paper">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-terracotta-100/60 -skew-x-6 origin-top-right translate-x-1/4" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 mb-5"
                >
                  <div className="w-12 h-12 bg-terracotta-600 rounded-md flex items-center justify-center">
                    <AcademicCapIcon className="h-6 w-6 text-cream" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
                    Instructor studio
                  </p>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal leading-tight mb-4"
                >
                  Your teaching, at a glance
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg text-stone leading-relaxed mb-8"
                >
                  Track performance, manage courses, and grow your impact.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create new course
                  </Link>
                  <Link
                    href="/instructor/analytics"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-charcoal border border-border/60 rounded-md hover:bg-forest-100 transition-colors"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                    View analytics
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {error && (
              <div className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100/50 text-terracotta-700 rounded-r-md">
                {error}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <InstructorStatsCard
                title="Monthly revenue"
                value={loading ? '—' : metrics ? `$${metrics.monthlyRevenue.toFixed(2)}` : '—'}
                icon={CurrencyDollarIcon}
                loading={loading}
              />
              <InstructorStatsCard
                title="Published courses"
                value={loading ? '—' : metrics ? metrics.publishedCourses : '—'}
                icon={AcademicCapIcon}
                loading={loading}
              />
              <InstructorStatsCard
                title="Total learners"
                value={loading ? '—' : metrics ? metrics.totalLearners : '—'}
                icon={UserGroupIcon}
                loading={loading}
              />
              <InstructorStatsCard
                title="Avg. rating"
                value={loading ? '—' : ((metrics as any)?.averageRating ? (metrics as any).averageRating.toFixed(1) : 'New')}
                icon={StarIcon}
                loading={loading}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CoursePerformanceChart
                  data={metrics?.coursePerformance || []}
                  loading={loading}
                />
              </div>
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
      </AppLayout>
    </>
  );
}
