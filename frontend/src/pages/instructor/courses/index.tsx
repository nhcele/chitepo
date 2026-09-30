import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { instructorListCourses, instructorSubmitCourse } from '@/lib/api/instructor';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import { UserRole } from '@mindelta/shared';
import CourseManagementCard from '@/components/instructor/CourseManagementCard';
import {
  PlusIcon,
  AcademicCapIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

type MyCourse = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'under_review' | 'archived';
  students?: number;
  rating?: number;
  updatedAt: string;
  createdAt: string;
};

export default function InstructorCourses() {
  const [items, setItems] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      // Try to get instructor's courses first
      try {
        const res = await instructorListCourses();
        if (res.items && res.items.length > 0) {
          setItems(res.items.map((item: any) => ({
            id: item.id,
            title: item.title || 'Untitled Course',
            status: item.status || 'draft',
            students: item.totalEnrollments || 0,
            rating: item.averageRating || 0,
            updatedAt: item.updatedAt || new Date().toISOString(),
            createdAt: item.createdAt || new Date().toISOString()
          } as MyCourse)));
          return;
        }
      } catch (e) {
        // If instructor courses fail, fall through to get all courses
      }
      
      // If no instructor courses, get all courses from the general endpoint
      const { listCourses } = await import('@/lib/api/courses');
      const allCourses = await listCourses();
      setItems(allCourses.map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled Course',
        status: item.status || 'published',
        students: item.totalEnrollments || 0,
        rating: item.averageRating || 0,
        updatedAt: item.updatedAt || new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString()
      } as MyCourse)));
    } catch (e: any) {
      setError(e?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitForReview = async (id: string) => {
    await instructorSubmitCourse(id);
    await load();
    setToast('Submitted for review');
    setTimeout(() => setToast(null), 2000);
  };

  const coursesToDisplay = items;
  
  const filteredCourses = coursesToDisplay.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter;
    const matchesSearch = !search || course.title?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: coursesToDisplay.length,
    published: coursesToDisplay.filter(c => c.status === 'published').length,
    draft: coursesToDisplay.filter(c => c.status === 'draft').length,
    underReview: coursesToDisplay.filter(c => c.status === 'under_review').length,
    totalStudents: coursesToDisplay.reduce((sum, c) => sum + (c.students || 0), 0)
  };

  return (
    <>
      <Head>
        <title>My Courses - Instructor Dashboard - Chitepo</title>
        <meta name="description" content="Manage your courses, track progress, and create new content on Chitepo." />
      </Head>
      <Layout>
        <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          {/* Enhanced Hero Section */}
          <div className="bg-gradient-to-br from-forest-50 via-forest-50 to-terracotta-50 py-12">
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
                <h1 className="text-4xl font-bold text-charcoal mb-4">My Courses</h1>
                <p className="text-xl text-stone mb-8 max-w-2xl mx-auto">
                  Create, manage, and track your courses. Share your expertise with learners worldwide.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-accent-500 hover:from-forest-700 hover:to-accent-600 transition-all duration-200 shadow-sm hover:shadow-sm"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Course
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-md shadow p-4 border border-border/60">
                <p className="text-sm text-stone mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
              </div>
              <div className="bg-white rounded-md shadow p-4 border border-border/60">
                <p className="text-sm text-stone mb-1">Published</p>
                <p className="text-2xl font-bold text-forest-600">{stats.published}</p>
              </div>
              <div className="bg-white rounded-md shadow p-4 border border-border/60">
                <p className="text-sm text-stone mb-1">Total Students</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalStudents.toLocaleString()}</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-md shadow p-4 mb-6 border border-border/60">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-pewter" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-pewter" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Courses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Course Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-md shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-forest-100 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-forest-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-forest-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CourseManagementCard course={course} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AcademicCapIcon className="h-12 w-12 text-pewter mx-auto mb-4" />
                <h3 className="text-lg font-medium text-charcoal mb-2">No courses found</h3>
                <p className="text-stone mb-6">
                  {search ? 'Try adjusting your search terms' : 'Get started by creating your first course'}
                </p>
                {!search && (
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Toast Notification */}
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 bg-forest-500 text-white px-6 py-3 rounded-md shadow-sm z-50"
            >
              {toast}
            </motion.div>
          )}
        </RoleGuard>
      </Layout>
    </>
  );
}
