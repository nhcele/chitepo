import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ClockIcon, FireIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import KnowledgeSpine, { SpineItem } from '@/components/ui/KnowledgeSpine';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseDifficulty, CourseStatus, Enrollment } from '@mindelta/shared';
import { getUserProgress, UserProgressSummary } from '@/lib/api/analytics';
import { getCourse } from '@/lib/api/courses';
import { listMyEnrollments } from '@/lib/api/enrollments';
import { listMyCertificates, CertificateDTO } from '@/lib/api/certificates';
import { getCourseCoverImage } from '@/lib/cover-image';
import CourseCover from '@/components/ui/CourseCover';

const sampleCourses: Course[] = [
  {
    id: 'pan-africanism',
    title: 'Pan-Africanism and African Unity',
    subtitle: 'Foundations of continental solidarity and institutions.',
    description: '',
    difficulty: CourseDifficulty.BEGINNER,
    estimatedDuration: 480,
    tags: [],
    instructorId: '',
    status: CourseStatus.PUBLISHED,
    price: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'revolutionary-theory',
    title: 'Revolutionary Theory and Practice',
    subtitle: 'Ideas and strategies that shaped anti-colonial movements.',
    description: '',
    difficulty: CourseDifficulty.INTERMEDIATE,
    estimatedDuration: 720,
    tags: [],
    instructorId: '',
    status: CourseStatus.PUBLISHED,
    price: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const courseHref = (id: string) => (isUuid(id) ? `/courses/${id}` : '/courses');

const sampleEnrollments: Enrollment[] = sampleCourses.map((c, i) => ({
  id: `enroll-${c.id}`,
  userId: 'user',
  courseId: c.id,
  progressPercent: i === 0 ? 34 : 12,
  enrolledAt: new Date(),
  updatedAt: new Date(),
  lastLessonSeenAt: i === 0 ? new Date() : undefined,
}));

interface EnrolledCourse {
  enrollment: Enrollment;
  course: Course;
}

export default function HomeDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [progress, setProgress] = useState<UserProgressSummary | null>(null);
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const [enrollments, progressData, certs] = await Promise.all([
          listMyEnrollments(),
          user ? getUserProgress(user.id) : Promise.resolve(null),
          listMyCertificates(),
        ]);

        const uniqueIds = Array.from(new Set(enrollments.map((e) => e.courseId)));
        const courseMap = new Map<string, Course>();
        await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const c = await getCourse(id);
              courseMap.set(id, c);
            } catch {
              const sample = sampleCourses.find((s) => s.id === id);
              if (sample) courseMap.set(id, sample);
            }
          })
        );

        const list: EnrolledCourse[] = enrollments
          .map((e) => ({ enrollment: e, course: courseMap.get(e.courseId) }))
          .filter((item): item is EnrolledCourse => !!item.course)
          .sort((a, b) => {
            const aDate = a.enrollment.lastLessonSeenAt || a.enrollment.updatedAt;
            const bDate = b.enrollment.lastLessonSeenAt || b.enrollment.updatedAt;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          });

        setEnrolled(list.length > 0 ? list : sampleEnrollments.map((e) => ({ enrollment: e, course: sampleCourses.find((c) => c.id === e.courseId)! })));
        setProgress(progressData);
        setCertificates(certs);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
        setEnrolled(sampleEnrollments.map((e) => ({ enrollment: e, course: sampleCourses.find((c) => c.id === e.courseId)! })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user]);

  const activeCourse = enrolled[0] || null;
  const spineItems = useMemo<SpineItem[]>(
    () =>
      enrolled.map((item, index) => ({
        id: item.enrollment.id,
        label: item.course.title,
        description: item.course.subtitle || undefined,
        status: index === 0 ? 'current' : item.enrollment.progressPercent >= 100 ? 'completed' : 'pending',
        href: courseHref(item.course.id),
      })),
    [enrolled]
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <Head>
        <title>Home — Chitepo</title>
        <meta name="description" content="Your learning home at Chitepo School of Ideology." />
      </Head>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          {authLoading || loading ? (
            <div className="animate-pulse space-y-8">
              <div className="h-48 bg-paper rounded-md" />
              <div className="grid md:grid-cols-3 gap-6">
                <div className="h-64 bg-paper rounded-md" />
                <div className="h-64 bg-paper rounded-md" />
                <div className="h-64 bg-paper rounded-md" />
              </div>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-20">
              <p className="text-lg text-stone mb-4">Please sign in to view your learning home.</p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
              >
                <p className="text-sm font-semibold uppercase tracking-wider text-forest-600 mb-2">
                  {greeting()}, {user?.name?.split(' ')[0] || 'Learner'}
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal">
                  Your learning home
                </h1>
              </motion.div>

              {error && (
                <div className="mb-8 p-4 border-l-4 border-terracotta-600 bg-terracotta-100 rounded-r-md">
                  <p className="text-sm text-terracotta-700">{error}</p>
                </div>
              )}

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Main column */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Continue learning */}
                  {activeCourse ? (
                    <motion.section
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-paper border border-border/60 rounded-md overflow-hidden"
                    >
                      <div className="grid md:grid-cols-5">
                        <div className="md:col-span-2 relative h-48 md:h-auto bg-forest-100">
                          <CourseCover
                            title={activeCourse.course.title}
                            src={getCourseCoverImage(activeCourse.course.title)}
                            sizes="(max-width: 768px) 100vw, 40vw"
                          />
                        </div>
                        <div className="md:col-span-3 p-6 lg:p-8 flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-forest-600 mb-3">
                              Continue learning
                            </p>
                            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal mb-3">
                              {activeCourse.course.title}
                            </h2>
                            <p className="text-stone leading-relaxed line-clamp-2 mb-4">
                              {activeCourse.course.subtitle || activeCourse.course.description}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-sm text-stone mb-2">
                              <span>{activeCourse.enrollment.progressPercent}% complete</span>
                              <span>{formatDuration(activeCourse.course.estimatedDuration || 0)} total</span>
                            </div>
                            <div className="w-full h-2 bg-forest-100 rounded-full overflow-hidden mb-5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${activeCourse.enrollment.progressPercent}%` }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="h-full bg-forest-600"
                              />
                            </div>
                            <Link
                              href={courseHref(activeCourse.course.id)}
                              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                            >
                              Continue where you left off
                              <ArrowRightIcon className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  ) : (
                    <motion.section
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-paper border border-border/60 rounded-md p-6 lg:p-8"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-forest-600 mb-3">
                        Get started
                      </p>
                      <h2 className="font-serif text-2xl font-semibold text-charcoal mb-3">
                        No active course yet
                      </h2>
                      <p className="text-stone mb-5">
                        Explore the curriculum and begin your first course today.
                      </p>
                      <Link
                        href="/courses"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                      >
                        Explore courses
                        <ArrowRightIcon className="w-4 h-4" />
                      </Link>
                    </motion.section>
                  )}

                  {/* My courses */}
                  <section>
                    <div className="flex items-end justify-between mb-6">
                      <h2 className="font-serif text-2xl font-semibold text-charcoal">My courses</h2>
                      <Link
                        href="/my-learning"
                        className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                      >
                        View all →
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {enrolled.slice(0, 4).map((item, index) => (
                        <motion.div
                          key={item.enrollment.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                        >
                          <Link
                            href={courseHref(item.course.id)}
                            className="group flex flex-col sm:flex-row gap-4 p-4 bg-paper border border-border/60 rounded-md hover:border-forest-600 transition-colors"
                          >
                            <div className="relative w-full sm:w-32 h-24 flex-shrink-0 bg-forest-100 rounded-md overflow-hidden">
                              <CourseCover title={item.course.title} src={getCourseCoverImage(item.course.title)} sizes="8rem" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-forest-600 px-2 py-0.5 bg-forest-100 rounded">
                                  {String(item.course.difficulty).toLowerCase()}
                                </span>
                                <span className="text-xs text-stone flex items-center gap-1">
                                  <ClockIcon className="w-3.5 h-3.5" />
                                  {formatDuration(item.course.estimatedDuration || 0)}
                                </span>
                              </div>
                              <h3 className="font-serif text-lg font-semibold text-charcoal group-hover:text-forest-600 transition-colors mb-1">
                                {item.course.title}
                              </h3>
                              <p className="text-sm text-stone line-clamp-1 mb-3">
                                {item.course.subtitle || item.course.description}
                              </p>
                              <div className="w-full h-1.5 bg-forest-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-forest-600"
                                  style={{ width: `${item.enrollment.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Knowledge spine summary */}
                  {spineItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <KnowledgeSpine items={spineItems} title="Learning journey" />
                    </motion.div>
                  )}

                  {/* Quick stats */}
                  {progress && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="bg-forest-700 text-white rounded-md p-6"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ochre-400 mb-6">
                        This week
                      </h3>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-forest-600 flex items-center justify-center">
                            <FireIcon className="w-5 h-5 text-ochre-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-serif font-semibold">{progress.streakDays}</p>
                            <p className="text-xs text-white/70">Day streak</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-forest-600 flex items-center justify-center">
                            <AcademicCapIcon className="w-5 h-5 text-ochre-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-serif font-semibold">{progress.lessonsCompleted}</p>
                            <p className="text-xs text-white/70">Lessons completed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-forest-600 flex items-center justify-center">
                            <TrophyIcon className="w-5 h-5 text-ochre-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-serif font-semibold">{progress.quizzesAttempted}</p>
                            <p className="text-xs text-white/70">Quizzes attempted</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Certificates */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-paper border border-border/60 rounded-md p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone">
                        Achievements
                      </h3>
                      {certificates.length > 0 && (
                        <span className="text-xs font-semibold text-forest-600">{certificates.length}</span>
                      )}
                    </div>
                    {certificates.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ochre-100 flex items-center justify-center">
                          <TrophyIcon className="w-6 h-6 text-ochre-600" />
                        </div>
                        <p className="text-sm text-charcoal mb-1">No certificates yet</p>
                        <p className="text-xs text-stone mb-4">Complete a course to earn your first certificate.</p>
                        <Link
                          href="/courses"
                          className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                        >
                          Find a course →
                        </Link>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {certificates.slice(0, 3).map((cert) => (
                          <li key={cert.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-ochre-100 flex items-center justify-center flex-shrink-0">
                              <TrophyIcon className="w-4 h-4 text-ochre-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-charcoal line-clamp-1">
                                {cert.course?.title || cert.courseId}
                              </p>
                              <p className="text-xs text-stone">
                                Issued {new Date(cert.issuedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </>
  );
}
