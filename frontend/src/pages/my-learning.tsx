import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  BookmarkIcon,
  CalendarIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import Layout from '@/components/Layout';
import LearningDashboard from '@/components/learner/LearningDashboard';
import CourseCard from '@/components/learner/CourseCard';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseDifficulty, Lesson, Module as CourseModule } from '@mindelta/shared';
import { enrollInCourse, listMyEnrollments } from '@/lib/api/enrollments';
import { getCourse, listCourses } from '@/lib/api/courses';
import { getCourseCoverImage } from '@/lib/cover-image';

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
  coverImage: string;
  difficulty: CourseDifficulty;
  estimatedTimeLeft: string;
  certificate?: {
    issued: boolean;
    issueDate?: string;
    blockchainHash?: string;
  };
}

interface LearningStats {
  totalCoursesEnrolled: number;
  coursesCompleted: number;
  totalLearningTime: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  certificatesEarned: number;
  skillsAcquired: string[];
}

// removed mock courses; will fetch from API

// basic computed stats based on enrollments

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

function FeaturedCoursesSection() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const courses = await listCourses();
        // Get first 3 published courses as featured
        const featured = courses
          .filter((c: any) => c.status === 'published')
          .slice(0, 3)
          .map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.subtitle || course.description || '',
            instructor: course.instructor?.name || 'Chitepo Instructor',
            rating: course.averageRating || 0,
            students: course.totalEnrollments || 0,
            category: course.category || 'General',
            difficulty: course.difficulty || 'beginner',
            estimatedDuration: course.estimatedDuration || 0,
            coverImage: getCourseCoverImage(course.title, course.coverImageUrl) || '/api/placeholder/400/225',
            price: course.price || 0
          }));
        setFeaturedCourses(featured);
      } catch (e) {
        console.error('Failed to load featured courses:', e);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (enrollingId) return;
    setEnrollError(null);
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      setFeaturedCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c)));
    } catch (e: any) {
      console.error('Failed to enroll:', e?.message || e);
      setEnrollError(e?.message || 'Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredCourses.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured Courses</h2>
      {enrollError && (
        <div className="mb-4 text-sm text-red-600">{enrollError}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CourseCard
              course={course}
              variant="default"
              onEnroll={handleEnroll}
              loading={enrollingId === course.id}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function MyLearningPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<CourseRecommendationCard[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'bookmarked'>('in-progress');

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        setEnrolledCourses([]);
        setRecommendedCourses([]);
        setLearningStats(null);
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

        // Map enrollments to course cards (fetched in parallel, not sequentially)
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
              // Resume at the next incomplete lesson (not always lesson 1).
              const resumeIndex = flatLessons.length > 0 ? Math.min(completedLessons, flatLessons.length - 1) : 0;
              const resumeLesson = flatLessons[resumeIndex];
              return {
                id: course.id,
                title: course.title,
                instructor: (course as any).instructor?.name || 'Instructor',
                progress: Math.round(enr.progressPercent || 0),
                totalLessons,
                completedLessons,
                lastAccessed: (enr.updatedAt || enr.enrolledAt || new Date()).toString(),
                nextLesson: resumeLesson?.title || '',
                nextLessonId: resumeLesson?.id,
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
        setEnrolledCourses(cards);
        const stats: LearningStats = {
          totalCoursesEnrolled: cards.length,
          coursesCompleted: cards.filter(c => c.progress === 100).length,
          totalLearningTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          certificatesEarned: cards.filter(c => c.certificate?.issued).length,
          skillsAcquired: [],
        };
        setLearningStats(stats);
      } catch (e) {
        setEnrolledCourses([]);
        setRecommendedCourses([]);
        setLearningStats(null);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const formatLearningTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h` : `${minutes}m`;
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-primary-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const filteredCourses = enrolledCourses.filter(course => {
    switch (activeTab) {
      case 'completed':
        return course.progress === 100;
      case 'bookmarked':
        return false; // Would implement bookmarking logic
      default:
        return course.progress < 100;
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>My Courses - Chitepo</title>
        </Head>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">My Courses</h1>
              <p className="text-gray-600 mb-8">Please sign in to view your learning progress.</p>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Courses - Chitepo</title>
        <meta name="description" content="Track your learning progress, view enrolled courses, and manage your professional development journey." />
      </Head>
      <Layout>
        {learningStats && enrolledCourses.length > 0 ? (
          <LearningDashboard
            userId="current-user"
            stats={{
              totalCoursesEnrolled: learningStats.totalCoursesEnrolled,
              coursesCompleted: learningStats.coursesCompleted,
              totalLearningTime: learningStats.totalLearningTime,
              currentStreak: learningStats.currentStreak,
              longestStreak: learningStats.longestStreak,
              certificatesEarned: learningStats.certificatesEarned,
              averageCompletionRate: enrolledCourses.length > 0 
                ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length)
                : 0
            }}
            recentCourses={enrolledCourses.slice(0, 6).map(course => ({
              id: course.id,
              title: course.title,
              instructor: course.instructor,
              progress: course.progress,
              lastAccessed: course.lastAccessed,
              coverImage: course.coverImage,
              nextLesson: course.nextLesson,
              nextLessonId: course.nextLessonId
            }))}
            achievements={[
              {
                id: 'first-course',
                title: 'First Steps',
                description: 'Complete your first course',
                icon: <TrophyIcon className="h-8 w-8" />,
                earned: learningStats.coursesCompleted > 0,
                earnedDate: learningStats.coursesCompleted > 0 ? undefined : undefined
              },
              {
                id: 'week-streak',
                title: 'Week Warrior',
                description: 'Maintain a 7-day learning streak',
                icon: <FireIcon className="h-8 w-8" />,
                earned: learningStats.currentStreak >= 7,
                earnedDate: learningStats.currentStreak >= 7 ? undefined : undefined
              },
              {
                id: 'quick-learner',
                title: 'Quick Learner',
                description: 'Complete a course in under a week',
                icon: <ChartBarIcon className="h-8 w-8" />,
                earned: false
              },
              {
                id: 'dedicated',
                title: 'Dedicated Learner',
                description: 'Complete 5 courses',
                icon: <CheckCircleIconSolid className="h-8 w-8" />,
                earned: learningStats.coursesCompleted >= 5,
                earnedDate: learningStats.coursesCompleted >= 5 ? undefined : undefined
              },
              {
                id: 'time-master',
                title: 'Time Master',
                description: 'Spend 100 hours learning',
                icon: <ClockIcon className="h-8 w-8" />,
                earned: learningStats.totalLearningTime >= 6000,
                earnedDate: learningStats.totalLearningTime >= 6000 ? undefined : undefined
              },
              {
                id: 'certified',
                title: 'Certified Professional',
                description: 'Earn 3 certificates',
                icon: <StarIconSolid className="h-8 w-8" />,
                earned: learningStats.certificatesEarned >= 3,
                earnedDate: learningStats.certificatesEarned >= 3 ? undefined : undefined
              }
            ]}
            recommendations={recommendedCourses}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || 'Learner'}!
              </h1>
              <p className="text-gray-600">
                Start your professional development journey
              </p>
            </div>

            {/* Empty State */}
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 text-primary-600 rounded-full mb-6">
                <PlayIcon className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to start learning?
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Enroll in your first course and begin your journey toward professional growth and new opportunities.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
              >
                Browse Courses
              </Link>
            </div>

            {/* Featured Courses */}
            <FeaturedCoursesSection />
          </div>
        )}
      </Layout>
    </>
  );
}
