import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import CourseKnowledgeSpine from '@/components/ui/CourseKnowledgeSpine';
import { useAuth } from '@/contexts/AuthContext';
import { getCourse, getCourseLessonProgress } from '@/lib/api/courses';
import { enrollInCourse, getMyEnrollmentForCourse } from '@/lib/api/enrollments';
import { Course, Module as CourseModule, Lesson } from '@mindelta/shared';
import { getCourseCoverImage } from '@/lib/cover-image';
import CourseCover from '@/components/ui/CourseCover';

const placeholderOutcomes = [
  'Understand the historical and ideological foundations of the subject.',
  'Analyze primary texts and debates within their political context.',
  'Apply frameworks to contemporary governance and civic leadership.',
];

type RichCourse = Course & {
  modules?: (CourseModule & { lessons?: Lesson[] })[];
  instructor?: { name?: string; firstName?: string; lastName?: string; bio?: string };
  skills?: string[];
  totalEnrollments?: number;
};

export default function CourseDetailPage() {
  const router = useRouter();
  const { courseId } = router.query as { courseId?: string };
  const { isAuthenticated, user } = useAuth();

  const [course, setCourse] = useState<RichCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!courseId) return;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
        setError('This course link is not valid.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = (await getCourse(courseId)) as RichCourse;
        setCourse(data);
        if (isAuthenticated) {
          try {
            const [enr, lessonProgress] = await Promise.all([
              getMyEnrollmentForCourse(courseId),
              getCourseLessonProgress(courseId),
            ]);
            setIsEnrolled(!!enr);
            const lessons = (data.modules || []).flatMap((module) => module.lessons || []);
            const completedLessons = lessons.filter((lesson) => lessonProgress[lesson.id]?.isCompleted).length;
            setProgress(lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0);
          } catch (_) {}
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [courseId, isAuthenticated]);

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      await enrollInCourse(courseId);
      setIsEnrolled(true);
      if (firstLessonId) {
        router.push(`/courses/${courseId}/lessons/${firstLessonId}`);
      } else {
        router.push(`/courses/${courseId}/learn`);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const modules = useMemo(() => {
    if (!course?.modules) return [];
    return [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex).map((m) => ({
      ...m,
      lessons: [...(m.lessons || [])].sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  }, [course]);

  const totalLessons = useMemo(
    () => modules.reduce((sum, m) => sum + m.lessons.length, 0),
    [modules]
  );

  const totalDurationSeconds = useMemo(
    () =>
      modules.reduce(
        (sum, m) => sum + m.lessons.reduce((lSum, l) => lSum + ((l as any).videoDuration || 0), 0),
        0
      ),
    [modules]
  );
  const totalHours = Math.floor(totalDurationSeconds / 3600);
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60);

  const allLessons = useMemo(
    () => modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id }))),
    [modules]
  );

  const completedLessonCount = useMemo(() => {
    if (!isEnrolled || totalLessons === 0) return 0;
    return Math.min(totalLessons, Math.floor((progress / 100) * totalLessons));
  }, [isEnrolled, progress, totalLessons]);

  const lessonStatuses = useMemo(() => {
    const statuses = new Map<string, 'completed' | 'current' | 'pending'>();
    allLessons.forEach((lesson, index) => {
      if (!isEnrolled) {
        statuses.set(lesson.id, 'pending');
      } else if (index < completedLessonCount) {
        statuses.set(lesson.id, 'completed');
      } else if (index === completedLessonCount) {
        statuses.set(lesson.id, 'current');
      } else {
        statuses.set(lesson.id, 'pending');
      }
    });
    return statuses;
  }, [allLessons, completedLessonCount, isEnrolled]);

  const firstPendingLesson = useMemo(() => {
    return allLessons.find((l) => lessonStatuses.get(l.id) !== 'completed');
  }, [allLessons, lessonStatuses]);

  const firstLessonId = useMemo(() => firstPendingLesson?.id || allLessons[0]?.id, [firstPendingLesson, allLessons]);

  const spineModules = useMemo(
    () =>
      modules.map((m) => ({
        id: m.id,
        orderIndex: m.orderIndex,
        title: m.title,
        description: (m as any).description || undefined,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationMinutes: Math.floor(((l as any).videoDuration || 0) / 60) || undefined,
          isPreview: l.isPreview,
          status: lessonStatuses.get(l.id) || 'pending',
          href: isEnrolled || l.isPreview ? `/courses/${courseId}/lessons/${l.id}` : undefined,
        })),
      })),
    [modules, lessonStatuses, isEnrolled, courseId]
  );

  const instructorName = useMemo(() => {
    const inst = course?.instructor;
    if (!inst) return 'Chitepo Instructor';
    if (inst.firstName && inst.lastName) return `${inst.firstName} ${inst.lastName}`.trim();
    if (inst.name) return inst.name;
    return 'Chitepo Instructor';
  }, [course]);

  const instructorInitial = useMemo(() => {
    const inst = course?.instructor;
    if (!inst) return 'C';
    if (inst.firstName) return inst.firstName[0].toUpperCase();
    if (inst.name) return inst.name[0].toUpperCase();
    return 'C';
  }, [course]);

  const outcomes = course?.skills?.length ? course.skills : placeholderOutcomes;

  const formatDuration = () => {
    if (totalHours > 0) return `${totalHours}h ${totalMinutes}m`;
    if (totalMinutes > 0) return `${totalMinutes}m`;
    return `${totalDurationSeconds}s`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="font-serif text-3xl font-semibold text-charcoal mb-3">Course not found</h1>
          <p className="text-stone mb-8">{error || 'This course does not exist or has been removed.'}</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
          >
            Explore courses
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{`${course.title} — Chitepo`}</title>
        <meta name="description" content={course.subtitle || course.description || ''} />
      </Head>
      <AppLayout>
        <div className="bg-cream">
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-border/60 bg-paper">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
              <div className="mb-6">
                <nav aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-stone">
                    <li>
                      <Link href="/courses" className="hover:text-forest-600 transition-colors">
                        Explore
                      </Link>
                    </li>
                    <li>/</li>
                    <li className="text-charcoal">{course.category || 'Course'}</li>
                  </ol>
                </nav>
              </div>

              <div className="grid lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-7">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal leading-tight mb-6"
                  >
                    {course.title}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-lg text-stone leading-relaxed mb-8"
                  >
                    {course.subtitle || course.description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap items-center gap-4 mb-8"
                  >
                    {course.instructor && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center">
                          <span className="font-serif text-lg font-semibold text-forest-600">{instructorInitial}</span>
                        </div>
                        <div>
                          <p className="text-xs text-stone">Instructor</p>
                          <p className="text-sm font-semibold text-charcoal">{instructorName}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-100 rounded-md">
                        <AcademicCapIcon className="w-3.5 h-3.5" />
                        {String(course.difficulty).toLowerCase()}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal bg-cream border border-border/60 rounded-md">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formatDuration()}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal bg-cream border border-border/60 rounded-md">
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        {totalLessons} lessons
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal bg-cream border border-border/60 rounded-md">
                        <UserGroupIcon className="w-3.5 h-3.5" />
                        {course.totalEnrollments || 0} learners
                      </span>
                    </div>
                  </motion.div>
                </div>

                <div className="lg:col-span-5">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:sticky lg:top-24"
                  >
                    <div className="bg-paper border border-border/60 rounded-md overflow-hidden shadow-sm">
                      <div className="relative aspect-video bg-forest-100 overflow-hidden group">
                        <CourseCover
                          title={course.title}
                          src={getCourseCoverImage(course.title)}
                          sizes="(max-width: 1024px) 100vw, 40vw"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <PlayIcon className="w-6 h-6 text-forest-600 ml-1" />
                          </div>
                        </div>
                        {firstLessonId && (isEnrolled || allLessons[0]?.isPreview) && (
                          <Link
                            href={`/courses/${courseId}/lessons/${firstLessonId}`}
                            className="absolute inset-0"
                            aria-label="Preview course"
                          />
                        )}
                      </div>

                      <div className="p-6">
                        {isEnrolled && progress > 0 && (
                          <div className="mb-5">
                            <div className="flex items-center justify-between text-sm text-charcoal mb-2">
                              <span>Your progress</span>
                              <span className="font-semibold">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-forest-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-forest-600"
                              />
                            </div>
                          </div>
                        )}

                        {isEnrolled ? (
                          <Link
                            href={firstLessonId ? `/courses/${courseId}/lessons/${firstLessonId}` : `/courses/${courseId}/learn`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                          >
                            Continue learning
                            <ArrowRightIcon className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={handleEnroll}
                            disabled={!isAuthenticated || enrolling}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            {enrolling ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Enrolling...
                              </>
                            ) : (
                              <>
                                <AcademicCapIcon className="w-4 h-4" />
                                {isAuthenticated ? 'Enroll now' : 'Sign in to enroll'}
                              </>
                            )}
                          </button>
                        )}

                        {!isAuthenticated && (
                          <p className="mt-4 text-center text-xs text-stone">
                            Already enrolled?{' '}
                            <Link href="/auth/login" className="font-semibold text-forest-600 hover:text-forest-500 transition-colors">
                              Sign in
                            </Link>
                          </p>
                        )}

                        <div className="mt-6 pt-6 border-t border-border/60 space-y-3">
                          {[
                            'Lifetime access',
                            'Certificate of completion',
                            'Mobile and desktop access',
                          ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3 text-sm text-stone">
                              <CheckCircleIcon className="h-5 w-5 text-forest-600 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* Main content */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-12">
                {/* What you will learn */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="font-serif text-2xl font-semibold text-charcoal mb-6">What you will learn</h2>
                  <ul className="space-y-4">
                    {outcomes.slice(0, 6).map((outcome, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center mt-0.5">
                          <CheckCircleIcon className="w-4 h-4 text-forest-600" />
                        </span>
                        <p className="text-stone leading-relaxed">{outcome}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* About */}
                {course.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4 }}
                  >
                    <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">About this course</h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">{course.description}</p>
                  </motion.div>
                )}

                {/* Instructor */}
                {course.instructor && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4 }}
                    className="bg-paper border border-border/60 rounded-md p-6"
                  >
                    <h2 className="font-serif text-2xl font-semibold text-charcoal mb-6">Your instructor</h2>
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-serif text-2xl font-semibold text-forest-600">{instructorInitial}</span>
                      </div>
                      <div>
                        <p className="font-serif text-xl font-semibold text-charcoal mb-2">{instructorName}</p>
                        <p className="text-stone leading-relaxed">
                          {course.instructor.bio || 'An experienced educator committed to Pan-African political education.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-5 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4 }}
                >
                  <CourseKnowledgeSpine
                    modules={spineModules}
                    isEnrolled={isEnrolled}
                    title="Knowledge Spine"
                  />
                </motion.div>
              </div>
            </div>
          </section>
        </div>
      </AppLayout>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
