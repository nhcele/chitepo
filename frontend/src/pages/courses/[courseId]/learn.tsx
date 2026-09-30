import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, PlayIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AILearningCompanion from '@/components/learner/AILearningCompanion';
import AppLayout from '@/components/layouts/AppLayout';
import CourseKnowledgeSpine, { SpineModule } from '@/components/ui/CourseKnowledgeSpine';
import { type ProgressInsight } from '@/lib/api/ai';
import { getCourse } from '@/lib/api/courses';
import { getMyEnrollmentForCourse } from '@/lib/api/enrollments';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseLearning = async () => {
      if (!courseId || authLoading) return;
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
        setError('This course link is not valid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [courseData, courseEnrollment] = await Promise.all([
          getCourse(courseId),
          getMyEnrollmentForCourse(courseId),
        ]);

        setCourse(courseData as CourseWithModules);
        setEnrollment(courseEnrollment);
      } catch (e: any) {
        setError(e?.message || 'Failed to load course learning data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseLearning();
  }, [authLoading, courseId, isAuthenticated, router]);

  const lessons = useMemo(() => getOrderedLessons(course), [course]);
  const progress = getEnrollmentProgress(enrollment);

  const spineModules = useMemo<SpineModule[]>(() => {
    const total = lessons.length;
    const completedCount = Math.round((progress / 100) * total);
    const sortedModules = (course?.modules || [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex);

    let lessonIndex = 0;
    return sortedModules.map((module) => {
      const moduleLessons = (module.lessons || [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((lesson) => {
          const idx = lessonIndex++;
          const status = idx < completedCount ? 'completed' : idx === completedCount ? 'current' : 'pending';
          return {
            id: lesson.id,
            title: lesson.title,
            type: lesson.type || 'video',
            durationMinutes: (lesson as any).durationMinutes || (lesson as any).estimatedDuration,
            isPreview: Boolean((lesson as any).isPreview),
            status: status as 'completed' | 'current' | 'pending',
            href: `/courses/${courseId}/lessons/${lesson.id}`,
          };
        });
      return {
        id: module.id,
        orderIndex: module.orderIndex,
        title: module.title,
        description: (module as any).description || (module as any).summary,
        lessons: moduleLessons,
      };
    });
  }, [course, lessons.length, progress, courseId]);

  // Resume at the next incomplete lesson (not always lesson 1)
  const completedCount = Math.round((progress / 100) * lessons.length);
  const resumeIndex = lessons.length > 0 ? Math.min(completedCount, lessons.length - 1) : 0;
  const nextLesson = lessons[resumeIndex];
  const isComplete = progress >= 100 && lessons.length > 0;

  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
          <div className="bg-paper border border-border/60 rounded-md p-8 max-w-md text-center">
            <h1 className="font-serif text-2xl font-semibold text-charcoal mb-2">Course unavailable</h1>
            <p className="text-stone mb-6">{error || 'We could not find this course.'}</p>
            <Link href="/courses" className="inline-flex px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors">
              Browse courses
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{course.title} — Chitepo</title>
      </Head>
      <AppLayout>
        {/* Course hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone hover:text-forest-600 transition-colors mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to course overview
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal leading-tight mb-2"
            >
              {course.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-stone mb-8"
            >
              {getInstructorName(course)}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl"
            >
              <div className="flex items-center justify-between text-sm text-stone mb-2">
                <span>Course progress</span>
                <span className="font-semibold text-charcoal">{progress}%</span>
              </div>
              <div className="w-full bg-forest-100 rounded-full h-2.5 mb-6">
                <div className="bg-forest-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              {isComplete ? (
                <div className="inline-flex items-center gap-3 bg-forest-100 border border-forest-400/40 rounded-md px-5 py-3">
                  <span className="text-sm font-semibold text-forest-700">Course completed — well done.</span>
                  <Link href="/my-certifications" className="text-sm font-semibold text-forest-600 underline">
                    View certifications
                  </Link>
                </div>
              ) : nextLesson ? (
                <Link
                  href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  Continue: {nextLesson.title}
                </Link>
              ) : (
                <p className="text-sm text-stone">No lessons are available for this course yet.</p>
              )}
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Knowledge Spine */}
            <div className="lg:col-span-2">
              <CourseKnowledgeSpine modules={spineModules} isEnrolled title="Your learning path" />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-forest-700 rounded-md p-6">
                <h3 className="font-serif text-lg font-semibold text-cream mb-2">
                  <SparklesIcon className="inline h-5 w-5 text-ochre-400 mr-2 -mt-0.5" />
                  AI learning assistant
                </h3>
                <p className="text-sm text-cream/80 mb-4">
                  Get personalized help with course content, ask questions, and receive insights on your learning patterns.
                </p>
                <ul className="space-y-2 text-sm text-cream/80">
                  <li className="flex gap-2"><span className="text-ochre-400">—</span>Smart explanations</li>
                  <li className="flex gap-2"><span className="text-ochre-400">—</span>Adaptive difficulty</li>
                  <li className="flex gap-2"><span className="text-ochre-400">—</span>Progress insights</li>
                </ul>
              </div>

              <div className="bg-paper border border-border/60 rounded-md p-6">
                <h3 className="font-serif text-lg font-semibold text-charcoal mb-4">Quick actions</h3>
                <div className="space-y-2">
                  <Link
                    href={`/courses/${course.id}`}
                    className="block w-full px-4 py-2.5 text-sm font-medium text-charcoal bg-forest-100/50 rounded-md hover:bg-forest-100 transition-colors"
                  >
                    View course overview
                  </Link>
                  <Link
                    href="/forums"
                    className="block w-full px-4 py-2.5 text-sm font-medium text-charcoal bg-forest-100/50 rounded-md hover:bg-forest-100 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="inline h-4 w-4 mr-2 -mt-0.5" />
                    Join discussion forum
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
      </AppLayout>
    </>
  );
}
