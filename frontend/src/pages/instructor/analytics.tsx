import React, { useState } from 'react';
import Head from 'next/head';
import { instructorGetCourseAnalytics } from '@/lib/api/instructor';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import AnalyticsChart from '@/components/instructor/AnalyticsChart';
import { UserRole } from '@mindelta/shared';
import {
  ChartBarIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

type Summary = {
  courseId?: string;
  enrollments?: number;
  lessonCompletions?: number;
  quizCompletions?: number;
  passRate?: number;
  avgAttempts?: number;
  active7d?: number;
  active30d?: number;
  lastActivityAt?: string;
};

export default function InstructorAnalytics() {
  const [courseId, setCourseId] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await instructorGetCourseAnalytics(courseId);
      setSummary(res as any);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const enrollmentData = [
    { label: 'React Fundamentals', value: 1245, color: 'bg-primary-500' },
    { label: 'Advanced TypeScript', value: 892, color: 'bg-forest-500' },
    { label: 'UI/UX Design', value: 567, color: 'bg-terracotta-500' },
    { label: 'Node.js Masterclass', value: 434, color: 'bg-forest-500' }
  ];

  const completionData = [
    { label: 'Completed', value: 2847, color: 'bg-forest-500' },
    { label: 'In Progress', value: 892, color: 'bg-ochre-500' },
    { label: 'Not Started', value: 399, color: 'bg-stone' }
  ];

  const revenueData = [
    { label: 'This Month', value: 15420, color: 'bg-forest-500' },
    { label: 'Last Month', value: 12890, color: 'bg-primary-500' },
    { label: '2 Months Ago', value: 11340, color: 'bg-forest-500' },
    { label: '3 Months Ago', value: 9870, color: 'bg-terracotta-500' }
  ];

  return (
    <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <Head>
          <title>Analytics - Instructor Dashboard - Chitepo</title>
          <meta name="description" content="View detailed analytics and insights about your courses and student performance." />
        </Head>
        
        {/* Enhanced Hero Section */}
        <div className="bg-gradient-to-br from-forest-50 via-white to-terracotta-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-forest-600 to-terracotta-600 rounded-full mb-4">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-forest-600 to-terracotta-600 bg-clip-text text-transparent">
                Instructor Analytics
              </h1>
              <p className="mt-2 text-sm text-stone">Track your performance, student engagement, and revenue metrics</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-md shadow p-6 border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-charcoal">3,138</p>
                  <p className="text-xs text-forest-600 mt-1">+12% from last month</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-full">
                  <UserGroupIcon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-6 border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-charcoal">78.4%</p>
                  <p className="text-xs text-forest-600 mt-1">+3.2% from last month</p>
                </div>
                <div className="p-3 bg-forest-50 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-forest-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-6 border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Avg. Completion Time</p>
                  <p className="text-2xl font-bold text-charcoal">14.5 hrs</p>
                  <p className="text-xs text-primary-600 mt-1">-1.2 hrs improvement</p>
                </div>
                <div className="p-3 bg-terracotta-50 rounded-full">
                  <ClockIcon className="h-6 w-6 text-terracotta-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-6 border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-charcoal">$15,420</p>
                  <p className="text-xs text-forest-600 mt-1">+19.6% growth</p>
                </div>
                <div className="p-3 bg-forest-50 rounded-full">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-forest-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <AnalyticsChart
              title="Course Enrollments"
              data={enrollmentData}
              type="bar"
            />
            
            <AnalyticsChart
              title="Completion Status"
              data={completionData}
              type="pie"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnalyticsChart
              title="Revenue Trend"
              data={revenueData}
              type="bar"
            />

            {/* Course Specific Analytics */}
            <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
              <h3 className="text-lg font-semibold text-charcoal mb-6">Course Specific Analytics</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-charcoal mb-2">
                    Enter Course ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="courseId"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      placeholder="e.g., course-123"
                      className="flex-1 px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                    <button
                      onClick={fetchSummary}
                      disabled={!courseId || loading}
                      className="px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Loading...' : 'Analyze'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-terracotta-100 border border-terracotta-400 text-terracotta-700 rounded-md">
                    {error}
                  </div>
                )}

                {summary && (
                  <div className="space-y-3 p-4 bg-paper rounded-md">
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">Enrollments:</span>
                      <span className="text-sm font-semibold">{summary.enrollments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">Lesson Completions:</span>
                      <span className="text-sm font-semibold">{summary.lessonCompletions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">Quiz Completions:</span>
                      <span className="text-sm font-semibold">{summary.quizCompletions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">Pass Rate:</span>
                      <span className="text-sm font-semibold">{summary.passRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">Active (7 days):</span>
                      <span className="text-sm font-semibold">{summary.active7d}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone">Active (30 days):</span>
                      <span className="text-sm font-semibold">{summary.active30d}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
}
