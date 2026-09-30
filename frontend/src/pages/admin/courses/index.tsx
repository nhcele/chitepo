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
              <div className="rounded-md border border-border/60 bg-white p-5 shadow-sm">
                <p className="text-sm text-stone">Total courses</p>
                <p className="mt-3 text-3xl font-semibold text-charcoal">{stats.total}</p>
              </div>
              <div className="rounded-md border border-forest-200 bg-forest-50 p-5 shadow-sm">
                <p className="text-sm text-forest-700">Published</p>
                <p className="mt-3 text-3xl font-semibold text-forest-900">{stats.published}</p>
              </div>
              <div className="rounded-md border border-ochre-200 bg-ochre-50 p-5 shadow-sm">
                <p className="text-sm text-ochre-700">Drafts</p>
                <p className="mt-3 text-3xl font-semibold text-ochre-900">{stats.draft}</p>
              </div>
              <div className="rounded-md border border-forest-200 bg-forest-50 p-5 shadow-sm">
                <p className="text-sm text-forest-700">Enrollments</p>
                <p className="mt-3 text-3xl font-semibold text-forest-900">{stats.enrollments}</p>
              </div>
            </section>

            <section className="rounded-md border border-border/60 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">Catalog workspace</h2>
                  <p className="mt-1 text-sm text-stone">
                    Open course builders, review analytics, or send authors to the approval queue.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/instructor/course/new"
                    className="inline-flex items-center rounded-md bg-ink-950 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Course
                  </Link>
                  <button
                    type="button"
                    onClick={loadCourses}
                    className="inline-flex items-center rounded-md border border-border/60 px-4 py-2 text-sm font-medium text-charcoal hover:bg-paper"
                  >
                    <ArrowPathIcon className="mr-2 h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-pewter" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search courses by title"
                    className="w-full rounded-md border border-border/60 py-2.5 pl-10 pr-4 text-sm text-charcoal focus:border-border/60 focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])}
                  className="rounded-md border border-border/60 px-4 py-2.5 text-sm text-charcoal focus:border-border/60 focus:outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="review">In review</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </section>

            <section className="rounded-md border border-border/60 bg-white shadow-sm">
              {loading ? (
                <div className="p-8 text-sm text-stone">Loading courses...</div>
              ) : error ? (
                <div className="p-8 text-sm text-terracotta-600">{error}</div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <AcademicCapIcon className="h-10 w-10 text-pewter" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">No courses match this view.</p>
                    <p className="mt-1 text-sm text-stone">Change the filters or create a new course.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/60">
                    <thead className="bg-paper">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone">Learners</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone">Updated</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-white">
                      {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td className="px-6 py-4">
                            <div className="font-medium text-charcoal">{course.title}</div>
                            <div className="mt-1 text-xs text-stone">{course.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-forest-100 px-3 py-1 text-xs font-medium capitalize text-charcoal">
                              {course.status === 'review' ? 'in review' : course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-charcoal">
                            <span className="inline-flex items-center gap-2">
                              <UserGroupIcon className="h-4 w-4 text-pewter" />
                              {course.totalEnrollments || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-charcoal">
                            {Number(course.averageRating || 0).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-sm text-charcoal">
                            {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/instructor/course/${course.id}`}
                                className="inline-flex items-center rounded-md border border-border/60 px-3 py-2 text-sm font-medium text-charcoal hover:bg-paper"
                              >
                                <PencilSquareIcon className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                              <Link
                                href={`/instructor/courses/${course.id}/analytics`}
                                className="inline-flex items-center rounded-md border border-border/60 px-3 py-2 text-sm font-medium text-charcoal hover:bg-paper"
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
