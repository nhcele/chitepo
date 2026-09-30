import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import { UserRole } from '@mindelta/shared';
import { adminGetMetrics, type AdminMetrics } from '@/lib/api/admin';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminGetMetrics();
        setMetrics(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxY = Math.max(
    1,
    ...(metrics?.series.map((d) => Math.max(d.signups, d.completions)) || [1])
  );

  const width = 720;
  const height = 220;
  const padding = 30;
  const step = metrics && metrics.series.length > 1
    ? (width - padding * 2) / (metrics.series.length - 1)
    : 0;

  const toY = (v: number) => height - padding - (v / maxY) * (height - padding * 2);

  const seriesToPath = (key: 'signups' | 'completions') => {
    if (!metrics) return '';
    return metrics.series
      .map((d, i) => {
        const x = padding + i * step;
        const y = toY(d[key]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const statCards = [
    { label: 'Daily Active Users', value: metrics?.dau ?? (loading ? '…' : 0), icon: UserGroupIcon, color: 'text-primary-600' },
    { label: 'Monthly Active Users', value: metrics?.mau ?? (loading ? '…' : 0), icon: UserGroupIcon, color: 'text-forest-600' },
    { label: 'Total Courses', value: metrics?.totalCourses ?? (loading ? '…' : 0), icon: AcademicCapIcon, color: 'text-terracotta-600' },
    { label: 'Total Learners', value: metrics?.totalLearners ?? (loading ? '…' : 0), icon: UserGroupIcon, color: 'text-forest-600' },
    { label: 'Monthly Revenue', value: `$${metrics?.monthlyRevenue?.toLocaleString?.() ?? 0}`, icon: CurrencyDollarIcon, color: 'text-forest-600' }
  ];

  const quickActions = [
    { label: 'Course Approvals', href: '/admin/approval-queue', icon: ClipboardDocumentListIcon, color: 'bg-forest-600 hover:bg-forest-700' },
    { label: 'CSV Exports', href: '/admin/exports', icon: ChartBarIcon, color: 'bg-forest-600 hover:bg-forest-700' },
    { label: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, color: 'bg-primary-600 hover:bg-primary-700' },
    { label: 'User Management', href: '/admin/users', icon: ShieldCheckIcon, color: 'bg-stone hover:bg-ink-800' }
  ];

  return (
    <>
      <Head>
        <title>Admin Dashboard - Chitepo</title>
        <meta name="description" content="Admin dashboard for managing Chitepo platform - users, courses, analytics and settings." />
      </Head>
      <Layout>
        <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-forest-100 to-forest-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <ShieldCheckIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-charcoal mb-4">Admin Dashboard</h1>
                <p className="text-xl text-stone mb-8 max-w-2xl mx-auto">
                  Monitor platform performance, manage users, and configure system settings.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-terracotta-100 border border-terracotta-400 text-terracotta-700 rounded-md"
              >
                {error}
              </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-md shadow-sm p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-md shadow-sm p-6 mb-12"
            >
              <h3 className="text-lg font-semibold text-charcoal mb-4">Daily Activity (Last 30 Days)</h3>
              <div className="relative">
                <svg width={width} height={height} className="w-full max-w-full">
                  {/* axes */}
                  <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
                  <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
                  {/* signups */}
                  <path d={seriesToPath('signups')} stroke="#6366f1" fill="none" strokeWidth={2} />
                  {/* completions */}
                  <path d={seriesToPath('completions')} stroke="#10b981" fill="none" strokeWidth={2} />
                </svg>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-forest-500 rounded-full"></div>
                    <span className="text-sm text-stone">Sign-ups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-forest-500 rounded-full"></div>
                    <span className="text-sm text-stone">Completions</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-lg font-semibold text-charcoal mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`flex items-center justify-center px-6 py-4 rounded-md text-white font-medium transition-colors ${action.color}`}
                  >
                    <action.icon className="h-5 w-5 mr-2" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </RoleGuard>
      </Layout>
    </>
  );
}
