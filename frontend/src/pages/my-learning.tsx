import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import CourseTile from '@/components/ui/CourseTile';
import CourseCover from '@/components/ui/CourseCover';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseDifficulty, Lesson, Module as CourseModule } from '@mindelta/shared';
import { enrollInCourse, getEnrollmentContinuePoint, listMyEnrollments } from '@/lib/api/enrollments';
import { getCourse, listCourses } from '@/lib/api/courses';
import { getCourseCoverImage } from '@/lib/cover-image';

function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface EnrolledCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: string;
  nextLesson: string;
  nextLessonId?: string;
  nextModule?: string;
  resumePositionSeconds?: number;
  coverImage: string;
  difficulty: CourseDifficulty;
  estimatedTimeLeft: string;
  certificate?: {
    issued: boolean;
    issueDate?: string;
  };
}

const recommendationReasons = [
  'Based on your interests',
  'Trending in your field',
  'Popular with similar learners'
];

type CourseRecommendationCard = {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  students: number;
  coverImage: string;
  category: string;
  reason: string;
};

function getInstructorName(instructor: any) {
  if (!instructor) return 'Chitepo Instructor';
  if (typeof instructor === 'string') return instructor;
  if (instructor.name) return instructor.name;
  const fullName = [instructor.firstName, instructor.lastName].filter(Boolean).join(' ');
  return fullName || 'Chitepo Instructor';
}

function mapCourseToRecommendation(course: Course & Record<string, any>, index: number): CourseRecommendationCard {
  return {
    id: course.id,
    title: course.title,
    instructor: getInstructorName(course.instructor),
    rating: typeof course.averageRating === 'number' ? course.averageRating : 0,
    students: typeof course.totalEnrollments === 'number' ? course.totalEnrollments : 0,
    coverImage: getCourseCoverImage(course.title, course.coverImageUrl),
    category: course.category || 'General',
    reason: recommendationReasons[index % recommendationReasons.length]
  };
}

function CourseRow({ course }: { course: EnrolledCourse }) {
  const isComplete = course.progress >= 100;
  const resumeHref = course.nextLessonId
    ? `/courses/${course.id}/lessons/${course.nextLessonId}`
    : `/courses/${course.id}/learn`;

  return (
    <div className="bg-paper border border-border/60 rounded-md p-5 hover:border-forest-400 transition-colors">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="relative w-full sm:w-44 aspect-[16/10] sm:aspect-[4/3] bg-forest-100 rounded-md overflow-hidden flex-shrink-0">
          <CourseCover title={course.title} src={course.coverImage} sizes="(max-width: 640px) 100vw, 11rem" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <Link
              href={`/courses/${course.id}`}
              className="font-serif text-lg font-semibold text-charcoal hover:text-forest-600 transition-colors"
            >
              {course.title}
            </Link>
            {isComplete && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-forest-100 text-forest-700 rounded">
                Completed
              </span>
            )}
          </div>
          <p className="text-sm text-stone mb-3">{course.instructor}</p>

          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-stone mb-1.5">
              <span>{course.completedLessons} of {course.totalLessons} lessons</span>
              <span className="font-semibold text-charcoal">{course.progress}%</span>
            </div>
            <div className="w-full bg-forest-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${isComplete ? 'bg-forest-600' : 'bg-forest-500'}`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-pewter">
              {isComplete ? (
                course.certificate?.issued ? 'Certificate earned' : 'Course completed'
              ) : course.nextLesson ? (
                <>Next: {course.nextModule ? `${course.nextModule} › ` : ''}{course.nextLesson}{course.resumePositionSeconds ? ` at ${formatTime(course.resumePositionSeconds)}` : ''}</>
              ) : (
                'Ready to continue'
              )}
            </p>
            <Link
              href={resumeHref}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors flex-shrink-0 ${
                isComplete
                  ? 'text-forest-600 border border-forest-600 hover:bg-forest-100'
                  : 'text-white bg-forest-600 hover:bg-forest-500'
              }`}
            >
              <PlayIcon className="w-4 h-4" />
              {isComplete ? 'Review course' : 'Continue'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyLearningPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<CourseRecommendationCard[]>([]);
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        setEnrolledCourses([]);
        setRecommendedCourses([]);
        setLoading(false);
        return;
      }
      try {
        const enrollments = await listMyEnrollments();
        const enrolledCourseIds = new Set((enrollments as any[]).map((enr) => enr.courseId));
        try {
          const catalogCourses = await listCourses();
          const publishedCourses = (catalogCourses as Array<Course & Record<string, any>>)
            .filter((course) => course.status === 'published');
          const coursesToRecommend = publishedCourses.filter((course) => !enrolledCourseIds.has(course.id));
          const recommendationSource = coursesToRecommend.length > 0 ? coursesToRecommend : publishedCourses;

          setRecommendedCourses(
            recommendationSource
              .slice()
              .sort((a, b) => (b.totalEnrollments || 0) - (a.totalEnrollments || 0))
              .slice(0, 3)
              .map(mapCourseToRecommendation)
          );
        } catch (e) {
          console.error('Failed to load course recommendations:', e);
          setRecommendedCourses([]);
        }

        const cardResults = await Promise.all(
          (enrollments as any[]).map(async (enr) => {
            try {
              const course = await getCourse(enr.courseId as string);
              const modules = ((course as any).modules || []) as (CourseModule & { lessons?: Lesson[] })[];
              const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
              const flatLessons = modules
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .flatMap((m) => (m.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex));
              const completedLessons = Math.round(((enr.progressPercent || 0) / 100) * totalLessons);
              const resumeIndex = flatLessons.length > 0 ? Math.min(completedLessons, flatLessons.length - 1) : 0;
              const fallbackLesson = flatLessons[resumeIndex];

              let continuePoint = null;
              try {
                continuePoint = await getEnrollmentContinuePoint(enr.id);
              } catch {
                continuePoint = null;
              }

              const nextLessonId = continuePoint?.lessonId || fallbackLesson?.id;
              const nextLessonTitle = continuePoint?.lessonTitle || fallbackLesson?.title || '';

              return {
                id: course.id,
                title: course.title,
                instructor: getInstructorName((course as any).instructor),
                progress: Math.round(enr.progressPercent || 0),
                totalLessons,
                completedLessons,
                lastAccessed: (enr.updatedAt || enr.enrolledAt || new Date()).toString(),
                nextLesson: nextLessonTitle,
                nextLessonId,
                nextModule: continuePoint?.moduleTitle || undefined,
                resumePositionSeconds: continuePoint?.videoPositionSeconds || undefined,
                coverImage: getCourseCoverImage(course.title, (course as any).coverImageUrl) || '/api/placeholder/400/225',
                difficulty: course.difficulty as CourseDifficulty,
                estimatedTimeLeft: '',
                certificate: enr.completedAt ? { issued: true, issueDate: new Date(enr.completedAt).toISOString() } : { issued: false },
              } as EnrolledCourse;
            } catch {
              return null;
            }
          }),
        );
        const cards: EnrolledCourse[] = cardResults.filter(Boolean) as EnrolledCourse[];
        cards.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
        setEnrolledCourses(cards);
      } catch (e) {
        setEnrolledCourses([]);
        setRecommendedCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const inProgressCourses = enrolledCourses.filter(c => c.progress < 100);
  const completedCourses = enrolledCourses.filter(c => c.progress >= 100);
  const displayedCourses = activeTab === 'in-progress' ? inProgressCourses : completedCourses;

  if (isLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Learn — Chitepo</title>
        </Head>
        <AppLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="font-serif text-3xl font-semibold text-charcoal mb-3">Your courses</h1>
            <p className="text-stone mb-8">Sign in to view your learning progress.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Learn — Chitepo</title>
        <meta name="description" content="Track your learning progress and continue your courses." />
      </Head>
      <AppLayout>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="w-12 h-12 bg-forest-600 rounded-md flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 text-cream" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">
                Learn
              </p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal leading-tight mb-4"
            >
              Your courses
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-stone leading-relaxed max-w-2xl"
            >
              Pick up where you left off and keep the momentum going.
            </motion.p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <PlayIcon className="h-8 w-8 text-forest-600" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-charcoal mb-3">
                Ready to start learning?
              </h2>
              <p className="text-stone mb-8 max-w-md mx-auto">
                Enroll in your first course and begin your journey toward new knowledge and opportunities.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
              >
                Browse courses
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-border/60 mb-8">
                {([
                  { id: 'in-progress', label: `In progress (${inProgressCourses.length})` },
                  { id: 'completed', label: `Completed (${completedCourses.length})` },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-forest-600 text-forest-600'
                        : 'border-transparent text-stone hover:text-charcoal'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Course list */}
              <div className="space-y-4">
                {displayedCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <CourseRow course={course} />
                  </motion.div>
                ))}
                {displayedCourses.length === 0 && (
                  <div className="text-center py-12 text-stone">
                    {activeTab === 'in-progress'
                      ? 'No courses in progress. Browse the catalogue to enroll.'
                      : 'No completed courses yet. Keep going.'}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Recommendations */}
          {recommendedCourses.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-semibold text-charcoal">
                  Recommended for you
                </h2>
                <Link
                  href="/courses"
                  className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                >
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <CourseTile
                      id={course.id}
                      title={course.title}
                      instructor={course.instructor}
                      category={course.category}
                      students={course.students}
                      coverImage={course.coverImage}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
