import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@mindelta/shared';
import AdminLayout from '@/components/admin/AdminLayout';
import RoleGuard from '@/components/RoleGuard';
import { listCourses } from '@/lib/api/courses';

type AdminCourse = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'review' | 'archived';
  totalEnrollments?: number;
  averageRating?: number;
  updatedAt?: string;
  createdAt?: string;
};

const statusOptions = ['all', 'published', 'draft', 'review', 'archived'] as const;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('all');

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await listCourses();
      setCourses(
        items.map((course: any) => ({
          id: course.id,
          title: course.title || 'Untitled Course',
          status: (course.status || 'draft') as AdminCourse['status'],
          totalEnrollments: course.totalEnrollments || 0,
          averageRating: course.averageRating || 0,
          updatedAt: course.updatedAt,
          createdAt: course.createdAt,
        })),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesSearch = !search || course.title.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [courses, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((course) => course.status === 'published').length,
      draft: courses.filter((course) => course.status === 'draft').length,
      enrollments: courses.reduce((sum, course) => sum + (course.totalEnrollments || 0), 0),
    }),
    [courses],
  );

  return (
    <>
      <Head>
        <title>Course Management - Admin - Chitepo</title>
        <meta
          name="description"
          content="Review the course catalog, open course builders, and monitor publishing status from the admin workspace."
        />
      </Head>
      <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <AdminLayout
          title="Course Management"
          subtitle="Review the catalog, open course editors, and monitor publishing status without leaving the admin workspace."
        >
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total courses</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{stats.total}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm text-emerald-700">Published</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-900">{stats.published}</p>
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="text-sm text-amber-700">Drafts</p>
                <p className="mt-3 text-3xl font-semibold text-amber-900">{stats.draft}</p>
              </div>
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                <p className="text-sm text-blue-700">Enrollments</p>
                <p className="mt-3 text-3xl font-semibold text-blue-900">{stats.enrollments}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Catalog workspace</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Open course builders, review analytics, or send authors to the approval queue.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/instructor/course/new"
                    className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Course
                  </Link>
                  <button
                    type="button"
                    onClick={loadCourses}
                    className="inline-flex items-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowPathIcon className="mr-2 h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search courses by title"
                    className="w-full rounded-2xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])}
                  className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="review">In review</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="p-8 text-sm text-slate-500">Loading courses...</div>
              ) : error ? (
                <div className="p-8 text-sm text-red-600">{error}</div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <AcademicCapIcon className="h-10 w-10 text-slate-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">No courses match this view.</p>
                    <p className="mt-1 text-sm text-slate-500">Change the filters or create a new course.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Learners</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{course.title}</div>
                            <div className="mt-1 text-xs text-slate-500">{course.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                              {course.status === 'review' ? 'in review' : course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            <span className="inline-flex items-center gap-2">
                              <UserGroupIcon className="h-4 w-4 text-slate-400" />
                              {course.totalEnrollments || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {Number(course.averageRating || 0).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/instructor/course/${course.id}`}
                                className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <PencilSquareIcon className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                              <Link
                                href={`/instructor/courses/${course.id}/analytics`}
                                className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <ChartBarIcon className="mr-2 h-4 w-4" />
                                Analytics
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </AdminLayout>
      </RoleGuard>
    </>
  );
}
