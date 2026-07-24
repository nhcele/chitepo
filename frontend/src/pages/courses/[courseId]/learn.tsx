import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AILearningCompanion from '@/components/learner/AILearningCompanion';
import LearningDashboard from '@/components/learner/LearningDashboard';
import { type ProgressInsight } from '@/lib/api/ai';
import { getCourse } from '@/lib/api/courses';
import { getMyEnrollmentForCourse, listMyEnrollments } from '@/lib/api/enrollments';
import { getCourseCoverImage } from '@/lib/cover-image';
import { useAuth } from '@/contexts/AuthContext';
import { Course, Enrollment, Lesson, Module as CourseModule } from '@mindelta/shared';

type CourseWithModules = Course & {
  instructor?: {
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  modules?: (CourseModule & { lessons?: Lesson[] })[];
};

type RecentCourse = {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  lastAccessed: string;
  coverImage: string;
  nextLesson?: string;
  nextLessonId?: string;
};

function getInstructorName(course?: CourseWithModules | null) {
  const instructor = course?.instructor;
  if (!instructor) return 'Chitepo Instructor';
  if (instructor.name) return instructor.name;
  const fullName = [instructor.firstName, instructor.lastName].filter(Boolean).join(' ');
  return fullName || 'Chitepo Instructor';
}

function getOrderedLessons(course?: CourseWithModules | null) {
  return (course?.modules || [])
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap((module) => (module.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex));
}

function getEnrollmentProgress(enrollment?: Enrollment | null) {
  return Math.round(Number((enrollment as any)?.progressPercent ?? (enrollment as any)?.progressPercentage ?? 0));
}

export default function LearnPage() {
  const router = useRouter();
  const { courseId } = router.query as { courseId?: string };
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseLearning = async () => {
      if (!courseId || authLoading) return;
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [courseData, courseEnrollment, enrollments] = await Promise.all([
          getCourse(courseId),
          getMyEnrollmentForCourse(courseId),
          listMyEnrollments(),
        ]);

        setCourse(courseData as CourseWithModules);
        setEnrollment(courseEnrollment);

        const enrollmentCards = await Promise.all(
          (enrollments as Enrollment[]).slice(0, 6).map(async (item) => {
            try {
              const enrolledCourse = (item.courseId === courseId ? courseData : await getCourse(item.courseId)) as CourseWithModules;
              const lessons = getOrderedLessons(enrolledCourse);
              const nextLesson = lessons[0];

              return {
                id: enrolledCourse.id,
                title: enrolledCourse.title,
                instructor: getInstructorName(enrolledCourse),
                progress: getEnrollmentProgress(item),
                lastAccessed: ((item as any).updatedAt || (item as any).enrolledAt || new Date()).toString(),
                coverImage: getCourseCoverImage(enrolledCourse.title, enrolledCourse.coverImageUrl),
                nextLesson: nextLesson?.title,
                nextLessonId: nextLesson?.id,
              };
            } catch {
              return null;
            }
          }),
        );

        setRecentCourses(enrollmentCards.filter(Boolean) as RecentCourse[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load course learning data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseLearning();
  }, [authLoading, courseId, isAuthenticated, router]);

  const lessons = useMemo(() => getOrderedLessons(course), [course]);
  const nextLesson = lessons[0];
  const progress = getEnrollmentProgress(enrollment);
  const completedCourses = recentCourses.filter((item) => item.progress === 100).length;
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || (user as any)?.name || 'Learner';

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course unavailable</h1>
          <p className="text-gray-600 mb-6">{error || 'We could not find this course.'}</p>
          <Link href="/courses" className="inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Learning: {course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back, {displayName}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
              <p className="text-gray-600 mb-4">{course.description || course.subtitle || 'Continue your course materials.'}</p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Course Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary-900 mb-2">
                  {nextLesson ? `Current Lesson: ${nextLesson.title}` : 'Course content'}
                </h3>
                <p className="text-primary-700 text-sm mb-3">
                  {nextLesson ? 'Continue with the next lesson in this course.' : 'No lessons are available for this course yet.'}
                </p>
                {nextLesson ? (
                  <Link
                    href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                    className="inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Continue Learning
                  </Link>
                ) : (
                  <button disabled className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                    No Lessons Available
                  </button>
                )}
              </div>
            </div>

            <LearningDashboard
              userId={user?.id || ''}
              stats={{
                totalCoursesEnrolled: recentCourses.length,
                coursesCompleted: completedCourses,
                totalLearningTime: 0,
                currentStreak: 0,
                longestStreak: 0,
                certificatesEarned: completedCourses,
                averageCompletionRate:
                  recentCourses.length > 0
                    ? Math.round(recentCourses.reduce((sum, item) => sum + item.progress, 0) / recentCourses.length)
                    : 0,
              }}
              recentCourses={recentCourses}
              achievements={[]}
              recommendations={[]}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Learning Assistant</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get personalized help with your course content, ask questions, and receive AI-powered insights.
              </p>
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">AI</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Smart Explanations</p>
                    <p className="text-xs text-gray-600">Get concepts explained your way</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">AD</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Adaptive Difficulty</p>
                    <p className="text-xs text-gray-600">Content adjusts to your level</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                  <span className="text-2xl">PI</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Progress Insights</p>
                    <p className="text-xs text-gray-600">AI analyzes your learning patterns</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/courses/${course.id}`} className="block w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  View Course Materials
                </Link>
                {nextLesson && (
                  <Link href={`/courses/${course.id}/lessons/${nextLesson.id}`} className="block w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                    Take Practice Quiz
                  </Link>
                )}
                <Link href="/forums" className="block w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  Join Discussion Forum
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AILearningCompanion
        courseId={course.id}
        lessonId={nextLesson?.id || ''}
        userId={user?.id || ''}
        onProgressUpdate={(insights: ProgressInsight[]) => {
          console.log('Progress insights updated:', insights);
        }}
      />
    </div>
  );
}
