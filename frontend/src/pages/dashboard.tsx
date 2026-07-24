import Head from 'next/head';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClockIcon, CheckCircleIcon, FireIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Course } from '@mindelta/shared';
import { getUserProgress, UserProgressSummary, trackEvent, AnalyticsEventType } from '@/lib/api/analytics';
import { listMyCertificates, downloadCertificate, CertificateDTO } from '@/lib/api/certificates';
import { getCourse } from '@/lib/api/courses';
import { listMyEnrollments } from '@/lib/api/enrollments';
import TrackWidgets from '@/components/dashboard/TrackWidgets';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [progress, setProgress] = useState<UserProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [certs, setCerts] = useState<CertificateDTO[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [myCourses, setMyCourses] = useState<Course[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        const data = await getUserProgress(user.id);
        setProgress(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load progress');
      }
    };
    run();
  }, [user]);

  useEffect(() => {
    const loadCerts = async () => {
      if (!user) return;
      setLoadingCerts(true);
      try {
        const items = await listMyCertificates();
        setCerts(items);
      } catch (_) {
        // ignore
      } finally {
        setLoadingCerts(false);
      }
    };
    loadCerts();
  }, [user]);

  useEffect(() => {
    const loadMyCourses = async () => {
      if (!isAuthenticated) return;
      try {
        const enrollments = await listMyEnrollments();
        const courseIds = (enrollments as any[]).map((e) => e.courseId).filter(Boolean);
        const uniqueIds = Array.from(new Set(courseIds));
        const courses: Course[] = [];
        for (const id of uniqueIds) {
          try {
            const c = await getCourse(id);
            courses.push(c);
          } catch {}
        }
        setMyCourses(courses);
      } catch (e) {
        setMyCourses([]);
      }
    };
    loadMyCourses();
  }, [isAuthenticated]);

  const formatLearningTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h` : `${minutes}m`;
  };

  // Progress UI not shown until enrollment/progress APIs exist

  return (
    <>
      <Head>
        <title>Dashboard - Chitepo</title>
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Learning</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Learner'}!</p>
          </div>
          {isLoading && <p className="text-gray-600">Loading...</p>}
          {!isLoading && !isAuthenticated && (
            <p className="text-gray-600">Please sign in to view your dashboard.</p>
          )}
          {error && <p className="text-red-600">{error}</p>}
          
          {/* Track-Specific Widgets */}
          {isAuthenticated && user && (
            <div className="mb-8">
              <TrackWidgets userId={user.id} />
            </div>
          )}

          {/* Learning Stats (from analytics API) */}
          {progress && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0"><CheckCircleIcon className="h-8 w-8 text-green-600" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{progress.lessonsCompleted}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0"><ClockIcon className="h-8 w-8 text-primary-500" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{progress.totalEvents}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0"><FireIcon className="h-8 w-8 text-orange-500" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{progress.streakDays} days</p>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0"><CheckCircleIconSolid className="h-8 w-8 text-green-500" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Quizzes Attempted</p>
                    <p className="text-2xl font-bold text-gray-900">{progress.quizzesAttempted}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {/* My Courses (enrolled) */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">My Courses</h2>
            {isAuthenticated && myCourses.length === 0 && (
              <p className="text-gray-600">You haven&apos;t enrolled in any courses yet.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((c, index) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{c.title}</h3>
                  {c.description && <p className="text-sm text-gray-600 line-clamp-3 mb-3">{c.description}</p>}
                  <div className="flex items-center justify-between">
                    <Link href={`/courses/${c.id}`} className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">
                      View Course
                    </Link>
                    {c.difficulty && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 capitalize">{String(c.difficulty).toLowerCase()}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Certificates Section */}
          {isAuthenticated && (
            <div className="mt-10 rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Certificates</h2>
              </div>
              {loadingCerts && <p className="text-gray-600">Loading certificates...</p>}
              {!loadingCerts && certs.length === 0 && (
                <p className="text-gray-600">No certificates yet.</p>
              )}
              {!loadingCerts && certs.length > 0 && (
                <ul className="divide-y divide-gray-200">
                  {certs.map((c) => (
                    <li key={c.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.course?.title || c.courseId}</div>
                        <div className="text-xs text-gray-500">Issued {new Date(c.issuedAt).toLocaleDateString()} • Serial {c.serial}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent({
                            eventType: AnalyticsEventType.CERTIFICATE_DOWNLOADED,
                            courseId: c.courseId,
                            metadata: { certificateId: c.id, serial: c.serial },
                          });
                          downloadCertificate(c.id);
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700"
                      >
                        Download PDF
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

