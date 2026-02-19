import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon,
  BookOpenIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { getCourse } from '@/lib/api/courses';
import { enrollInCourse, getMyEnrollmentForCourse } from '@/lib/api/enrollments';
import { useAuth } from '@/contexts/AuthContext';
import { Course, Module as CourseModule, Lesson } from '@mindelta/shared';
import Link from 'next/link';

export default function CourseHomePage() {
  const router = useRouter();
  const { courseId } = router.query as { courseId?: string };
  const [course, setCourse] = useState<(Course & { modules?: (CourseModule & { lessons?: Lesson[] })[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor'>('overview');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const { isAuthenticated, user } = useAuth();

  // Helper function to get instructor name
  const getInstructorName = () => {
    if (!course) return 'Chitepo Instructor';
    const instructor = (course as any)?.instructor;
    console.log('Getting instructor name, instructor object:', instructor);
    if (!instructor) return 'Chitepo Instructor';
    
    // Try different ways to get the name
    if (instructor.firstName && instructor.lastName) {
      const fullName = `${instructor.firstName} ${instructor.lastName}`.trim();
      console.log('Built name from firstName + lastName:', fullName);
      return fullName;
    }
    if (instructor.name) {
      console.log('Using instructor.name:', instructor.name);
      return instructor.name;
    }
    console.log('No instructor name found, using default');
    return 'Chitepo Instructor';
  };

  // Helper function to get instructor initial
  const getInstructorInitial = () => {
    if (!course) return 'C';
    const instructor = (course as any)?.instructor;
    if (!instructor) return 'C';
    if (instructor.firstName) return instructor.firstName[0].toUpperCase();
    if (instructor.name) return instructor.name[0].toUpperCase();
    return 'C';
  };

  useEffect(() => {
    const run = async () => {
      if (!courseId) return;
      try {
        const data = await getCourse(courseId);
        console.log('Course data:', data);
        console.log('Instructor data:', (data as any)?.instructor);
        setCourse(data as any);
        if (isAuthenticated) {
          try {
            const enr = await getMyEnrollmentForCourse(courseId);
            setIsEnrolled(!!enr);
            setProgress((enr as any)?.progressPercentage || 0);
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
      router.push(`/courses/${courseId}/lessons/${firstLessonId}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const firstLessonId = (() => {
    if (!course?.modules || course.modules.length === 0) return null;
    const sortedModules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    const firstModule = sortedModules[0];
    const lessons = (firstModule.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    return lessons[0]?.id || null;
  })();

  const totalLessons = course?.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
  const totalDuration = course?.modules?.reduce((sum, m) => {
    return sum + (m.lessons?.reduce((lSum, l) => lSum + ((l as any).videoDuration || 0), 0) || 0);
  }, 0) || 0;
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
            <p className="text-gray-600">{error || 'This course does not exist.'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{`${course.title} | Chitepo Learning Platform`}</title>
        <meta name="description" content={course.description || ''} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
          {/* Hero Section with Glassmorphism */}
          <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Course Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Breadcrumb */}
                  <div className="flex items-center space-x-2 text-sm text-white/80">
                    <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                    <span>/</span>
                    <span className="text-white">{course.category || 'General'}</span>
                  </div>

                  {/* Title & Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                      {course.title}
                    </h1>
                    <p className="text-xl text-white/90 mb-6">
                      {course.subtitle || course.description}
                    </p>
                  </motion.div>

                  {/* Stats Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-wrap gap-6"
                  >
                    <div className="flex items-center space-x-2 text-white/90">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <AcademicCapIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">Difficulty</p>
                        <p className="font-semibold capitalize">{course.difficulty}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-white/90">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <ClockIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">Duration</p>
                        <p className="font-semibold">{totalHours}h {totalMinutes}m</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-white/90">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <BookOpenIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">Lessons</p>
                        <p className="font-semibold">{totalLessons} lessons</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-white/90">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <UserGroupIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">Students</p>
                        <p className="font-semibold">{(course as any).totalEnrollments || 0}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Instructor Info */}
                  {(course as any).instructor && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20"
                    >
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {getInstructorInitial()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Instructor</p>
                        <p className="font-semibold text-white text-lg">
                          {getInstructorName()}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right: Enrollment Card */}
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="sticky top-6"
                  >
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                      {/* Preview Video Placeholder */}
                      <div className="relative aspect-video bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center group cursor-pointer">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        <button className="relative p-6 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                          <PlayIcon className="h-10 w-10 text-primary-600" />
                        </button>
                        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm">
                          Preview Course
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Progress Bar (if enrolled) */}
                        {isEnrolled && progress > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Your Progress</span>
                              <span className="font-semibold text-primary-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* CTA Button */}
                        {isEnrolled ? (
                          <Link href={`/courses/${courseId}/lessons/${firstLessonId}`}>
                            <button className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group">
                              <span>{progress > 0 ? 'Continue Learning' : 'Start Course'}</span>
                              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        ) : (
                          <button
                            onClick={handleEnroll}
                            disabled={!isAuthenticated || enrolling}
                            className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                          >
                            {enrolling ? (
                              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <AcademicCapIcon className="h-5 w-5" />
                                <span>{isAuthenticated ? 'Enroll Now' : 'Login to Enroll'}</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Features */}
                        <div className="pt-4 border-t space-y-3">
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <CheckCircleSolid className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>Lifetime access</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <CheckCircleSolid className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>Certificate of completion</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <CheckCircleSolid className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>AI-powered learning assistant</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <CheckCircleSolid className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>Access on mobile and desktop</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8">
                {(['overview', 'curriculum', 'instructor'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-12"
                >
                  {/* What You'll Learn */}
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <SparklesIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">What You'll Learn</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {((course as any).skills && (course as any).skills.length > 0) ? (
                        (course as any).skills.map((skill: string, idx: number) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <CheckCircleSolid className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{skill}</span>
                          </div>
                        ))
                      ) : (
                        course.modules?.slice(0, 6).map((module, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <CheckCircleSolid className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{module.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Course Description */}
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
                    <div className="prose prose-lg max-w-none text-gray-700">
                      <p>{course.description}</p>
                    </div>
                  </section>

                  {/* AI-Enhanced Learning */}
                  <section className="bg-gradient-to-br from-purple-50 to-primary-50 rounded-2xl border border-purple-100 p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <SparklesIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">AI-Enhanced Learning Experience</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-4xl mb-3">🤖</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Smart Assistant</h3>
                        <p className="text-sm text-gray-600">Get instant answers to your questions with our AI companion</p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-4xl mb-3">📊</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Progress Insights</h3>
                        <p className="text-sm text-gray-600">AI analyzes your learning patterns and suggests improvements</p>
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-4xl mb-3">🎯</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Adaptive Content</h3>
                        <p className="text-sm text-gray-600">Difficulty adjusts based on your performance</p>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'curriculum' && (
                <motion.div
                  key="curriculum"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
                        <p className="text-gray-600 mt-1">
                          {course.modules?.length || 0} modules • {totalLessons} lessons • {totalHours}h {totalMinutes}m total
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (expandedModules.size === course.modules?.length) {
                            setExpandedModules(new Set());
                          } else {
                            setExpandedModules(new Set(course.modules?.map(m => m.id) || []));
                          }
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {expandedModules.size === course.modules?.length ? 'Collapse All' : 'Expand All'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {course.modules?.sort((a, b) => a.orderIndex - b.orderIndex).map((module, moduleIndex) => {
                        const isExpanded = expandedModules.has(module.id);
                        const moduleDuration = module.lessons?.reduce((sum, l) => sum + ((l as any).videoDuration || 0), 0) || 0;
                        const moduleHours = Math.floor(moduleDuration / 3600);
                        const moduleMinutes = Math.floor((moduleDuration % 3600) / 60);

                        return (
                          <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => toggleModule(module.id)}
                              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-4 text-left">
                                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <span className="font-bold text-primary-600">{moduleIndex + 1}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {module.lessons?.length || 0} lessons
                                    {moduleDuration > 0 && ` • ${moduleHours > 0 ? `${moduleHours}h ` : ''}${moduleMinutes}m`}
                                  </p>
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="divide-y divide-gray-100">
                                    {module.lessons?.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, lessonIndex) => {
                                      const lessonDuration = (lesson as any).videoDuration || 0;
                                      const lessonMinutes = Math.floor(lessonDuration / 60);

                                      return (
                                        <div key={lesson.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                          <div className="flex items-center space-x-4 flex-1">
                                            <div className="flex-shrink-0">
                                              {lesson.type === 'video' ? (
                                                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                                  <PlayIcon className="h-5 w-5 text-primary-600" />
                                                </div>
                                              ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                  <BookOpenIcon className="h-5 w-5 text-gray-600" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-gray-900 truncate">
                                                {lessonIndex + 1}. {lesson.title}
                                              </p>
                                              <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-xs text-gray-500 capitalize">{lesson.type}</span>
                                                {lessonDuration > 0 && (
                                                  <>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">{lessonMinutes}m</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          {lesson.isPreview && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                              Preview
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'instructor' && (
                <motion.div
                  key="instructor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Instructor</h2>
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {getInstructorInitial()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {getInstructorName()}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {(course as any).instructor?.bio || 'Professional educator with years of experience in the field'}
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-primary-600">4.8</p>
                            <p className="text-sm text-gray-600">Rating</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-primary-600">12K</p>
                            <p className="text-sm text-gray-600">Students</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-primary-600">25</p>
                            <p className="text-sm text-gray-600">Courses</p>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          An experienced educator passionate about helping students achieve their learning goals through practical, hands-on instruction and real-world examples.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Layout>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
