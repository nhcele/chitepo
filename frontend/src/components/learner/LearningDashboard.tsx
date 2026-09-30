import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  FireIcon,
  TrophyIcon,
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon,
  AcademicCapIcon,
  PlayIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  CalendarIcon,
  UserGroupIcon,
  SparklesIcon,
  GiftIcon,
  LightBulbIcon,
  ArrowPathIcon,
  CpuChipIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import {
  FireIcon as FireIconSolid,
  TrophyIcon as TrophyIconSolid
} from '@heroicons/react/24/solid'
import { 
  getProgressInsights, 
  getPersonalizedRecommendations,
  type ProgressInsight,
  type LearningRecommendation
} from '@/lib/api/ai'

interface LearningDashboardProps {
  userId: string
  stats: {
    totalCoursesEnrolled: number
    coursesCompleted: number
    totalLearningTime: number // in minutes
    currentStreak: number
    longestStreak: number
    certificatesEarned: number
    averageCompletionRate: number
  }
  recentCourses: Array<{
    id: string
    title: string
    instructor: string
    progress: number
    lastAccessed: string
    coverImage: string
    nextLesson?: string
    nextLessonId?: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: React.ReactNode
    earned: boolean
    earnedDate?: string
  }>
  recommendations: Array<{
    id: string
    title: string
    instructor: string
    rating: number
    students: number
    coverImage: string
    category: string
    reason: string
  }>
  loading?: boolean
}

export default function LearningDashboard({
  userId,
  stats,
  recentCourses,
  achievements,
  recommendations,
  loading = false
}: LearningDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'achievements' | 'ai-insights'>('overview')
  const [aiInsights, setAiInsights] = useState<ProgressInsight[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<LearningRecommendation[]>([])
  const [loadingAi, setLoadingAi] = useState(false)

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const loadAiInsights = useCallback(async () => {
    setLoadingAi(true)
    try {
      const [insightsData, recommendationsData] = await Promise.all([
        getProgressInsights(userId),
        getPersonalizedRecommendations(userId)
      ])
      setAiInsights(insightsData)
      setAiRecommendations(recommendationsData)
    } catch (error) {
      console.error('Failed to load AI insights:', error)
    } finally {
      setLoadingAi(false)
    }
  }, [userId])

  // Load AI insights when tab changes to ai-insights
  useEffect(() => {
    if (activeTab === 'ai-insights' && aiInsights.length === 0) {
      loadAiInsights()
    }
  }, [activeTab, aiInsights.length, loadAiInsights])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const StatCard = ({ icon, title, value, color, trend }: {
    icon: React.ReactNode
    title: string
    value: string | number
    color: string
    trend?: {
      positive: boolean
      value: number
    }
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md shadow-sm border border-border/60 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && (
            <div className={`flex items-center text-sm mt-1 ${
              trend.positive ? 'text-forest-600' : 'text-terracotta-600'
            }`}>
              <span>{trend.positive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-md ${color.replace('text', 'bg').replace('600', '100')}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )

  const TabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<BookOpenIcon className="h-6 w-6 text-primary-600" />}
                title="Courses Enrolled"
                value={stats.totalCoursesEnrolled}
                color="text-primary-600"
              />
              <StatCard
                icon={<TrophyIcon className="h-6 w-6 text-forest-600" />}
                title="Completed"
                value={stats.coursesCompleted}
                color="text-forest-600"
              />
              <StatCard
                icon={<ClockIcon className="h-6 w-6 text-terracotta-600" />}
                title="Learning Time"
                value={formatTime(stats.totalLearningTime)}
                color="text-terracotta-600"
              />
              <StatCard
                icon={<FireIconSolid className="h-6 w-6 text-ochre-600" />}
                title="Current Streak"
                value={`${stats.currentStreak} days`}
                color="text-ochre-600"
              />
            </div>

            {/* Continue Courses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-charcoal">Continue Courses</h2>
                <Link href="/my-learning" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentCourses.slice(0, 3).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-md shadow-sm border border-border/60 overflow-hidden hover:shadow-sm transition-all"
                  >
                    <div className="relative">
                      <Image
                        src={course.coverImage}
                        alt={course.title}
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <div className="flex items-center justify-between text-white text-xs">
                          <span>{Math.round(course.progress)}% complete</span>
                          <span>{formatDate(course.lastAccessed)}</span>
                        </div>
                        <div className="w-full bg-white bg-opacity-30 rounded-full h-1 mt-1">
                          <div 
                            className="bg-white h-1 rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-charcoal mb-1 line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-stone mb-3">{course.instructor}</p>
                      
                      {course.nextLesson && (
                        <div className="mb-3">
                          <p className="text-xs text-stone mb-1">Next lesson:</p>
                          <p className="text-sm font-medium text-charcoal">{course.nextLesson}</p>
                        </div>
                      )}
                      
                      <Link 
                        href={course.nextLessonId ? `/courses/${course.id}/lessons/${course.nextLessonId}` : `/courses/${course.id}`}
                        className="w-full px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 flex items-center justify-center space-x-2"
                      >
                        <PlayIcon className="h-4 w-4" />
                        <span>Continue</span>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommended Courses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-charcoal">Recommended for You</h2>
                <Link href="/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Browse All
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-md shadow-sm border border-border/60 overflow-hidden hover:shadow-sm transition-all"
                  >
                    <div className="relative">
                      <Image
                        src={course.coverImage}
                        alt={course.title}
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                          {course.reason}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-charcoal mb-1 line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-stone mb-2">{course.instructor}</p>
                      
                      <div className="flex items-center space-x-3 text-xs text-stone mb-3">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="h-3 w-3 text-ochre-400" />
                          <span>{course.rating > 0 ? course.rating.toFixed(1) : 'New'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="h-3 w-3" />
                          <span>{course.students.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/courses/${course.id}`}
                        className="w-full px-3 py-2 border border-border/60 text-charcoal rounded-md text-sm font-medium hover:bg-paper flex items-center justify-center"
                      >
                        View Course
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'progress':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
              <h2 className="text-xl font-semibold text-charcoal mb-6">Learning Progress</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-charcoal mb-4">Completion Rate</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full border-8 border-border/60">
                        <div 
                          className="absolute inset-0 rounded-full border-8 border-primary-600"
                          style={{
                            borderStyle: 'solid',
                            borderTopColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: 'transparent',
                            transform: `rotate(${(stats.averageCompletionRate / 100) * 360}deg)`
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-charcoal">
                          {Math.round(stats.averageCompletionRate)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-stone mt-4">
                    Average completion rate across all courses
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-charcoal mb-4">Learning Streak</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-ochre-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <FireIconSolid className="h-8 w-8 text-ochre-600" />
                        <div>
                          <p className="font-semibold text-charcoal">Current Streak</p>
                          <p className="text-sm text-stone">Keep it going!</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-ochre-600">
                        {stats.currentStreak}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-paper rounded-md">
                      <div className="flex items-center space-x-3">
                        <TrophyIconSolid className="h-8 w-8 text-ochre-600" />
                        <div>
                          <p className="font-semibold text-charcoal">Longest Streak</p>
                          <p className="text-sm text-stone">Your personal best</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-ochre-600">
                        {stats.longestStreak}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
              <h3 className="text-lg font-medium text-charcoal mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-4 p-3 hover:bg-paper rounded-md">
                    <Image
                      src={course.coverImage}
                      alt={course.title}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-charcoal">{course.title}</p>
                      <p className="text-sm text-stone">
                        Last accessed {formatDate(course.lastAccessed)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-charcoal">
                        {Math.round(course.progress)}%
                      </p>
                      <div className="w-16 bg-forest-100 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-500 h-1.5 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'achievements':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
              <h2 className="text-xl font-semibold text-charcoal mb-6">Achievements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-md p-6 text-center ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-ochre-50 to-ochre-50 border-2 border-ochre-200'
                        : 'bg-paper border-2 border-border/60'
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      achievement.earned ? 'bg-ochre-200' : 'bg-forest-100'
                    }`}>
                      {achievement.icon}
                    </div>
                    
                    <h3 className={`font-semibold mb-2 ${
                      achievement.earned ? 'text-charcoal' : 'text-stone'
                    }`}>
                      {achievement.title}
                    </h3>
                    
                    <p className={`text-sm mb-3 ${
                      achievement.earned ? 'text-charcoal' : 'text-pewter'
                    }`}>
                      {achievement.description}
                    </p>
                    
                    {achievement.earned ? (
                      <div className="flex items-center justify-center space-x-1 text-ochre-600">
                        <TrophyIconSolid className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {achievement.earnedDate && formatDate(achievement.earnedDate)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-pewter">
                        <SparklesIcon className="h-4 w-4 mx-auto" />
                        <span className="text-xs">Locked</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
              <h3 className="text-lg font-medium text-charcoal mb-4">Certificates Earned</h3>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 text-primary-600 rounded-full mb-4">
                    <TrophyIconSolid className="h-10 w-10" />
                  </div>
                  <p className="text-2xl font-bold text-charcoal mb-2">
                    {stats.certificatesEarned}
                  </p>
                  <p className="text-stone">Certificates earned</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'ai-insights':
        return (
          <div className="space-y-8">
            {loadingAi ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-stone">Loading AI insights...</span>
              </div>
            ) : (
              <>
                {/* AI Progress Insights */}
                <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-charcoal">AI Progress Insights</h2>
                    <button
                      onClick={loadAiInsights}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiInsights.map((insight, index) => (
                      <motion.div
                        key={insight.area}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-md border-2 ${
                          insight.trend === 'improving' 
                            ? 'bg-forest-50 border-forest-200' 
                            : insight.trend === 'declining'
                            ? 'bg-terracotta-50 border-terracotta-200'
                            : 'bg-ochre-50 border-ochre-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-md ${
                              insight.trend === 'improving' 
                                ? 'bg-forest-200' 
                                : insight.trend === 'declining'
                                ? 'bg-terracotta-200'
                                : 'bg-ochre-200'
                            }`}>
                              {insight.trend === 'improving' ? (
                                <ChartBarIcon className="h-5 w-5 text-forest-700" />
                              ) : insight.trend === 'declining' ? (
                                <ArrowPathIcon className="h-5 w-5 text-terracotta-700" />
                              ) : (
                                <TagIcon className="h-5 w-5 text-ochre-700" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-charcoal">{insight.area}</h3>
                              <p className="text-sm text-stone">Score: {insight.score}%</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            insight.trend === 'improving' 
                              ? 'bg-forest-200 text-forest-800' 
                              : insight.trend === 'declining'
                              ? 'bg-terracotta-200 text-terracotta-800'
                              : 'bg-ochre-200 text-ochre-800'
                          }`}>
                            {insight.trend}
                          </span>
                        </div>
                        
                        <p className="text-sm text-charcoal mb-3">{insight.recommendation}</p>
                        
                        <div>
                          <p className="text-xs font-medium text-charcoal mb-2">Next Steps:</p>
                          <ul className="space-y-1">
                            {insight.nextSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-center space-x-2 text-xs text-stone">
                                <CheckCircleIcon className="h-3 w-3 text-primary-600" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
                  <h2 className="text-xl font-semibold text-charcoal mb-6">Personalized Recommendations</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiRecommendations.map((rec, index) => (
                      <motion.div
                        key={rec.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-forest-50 to-forest-50 border border-primary-200 rounded-md p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            rec.difficulty === 'beginner' 
                              ? 'bg-forest-200 text-forest-800'
                              : rec.difficulty === 'intermediate'
                              ? 'bg-ochre-200 text-ochre-800'
                              : 'bg-terracotta-200 text-terracotta-800'
                          }`}>
                            {rec.difficulty}
                          </span>
                          <span className="text-xs text-stone">{rec.estimatedTime}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="p-2 bg-forest-200 rounded-md">
                            <AcademicCapIcon className="h-4 w-4 text-primary-700" />
                          </div>
                          <span className={`text-xs font-medium uppercase tracking-wide ${
                            rec.priority === 'high' 
                              ? 'text-terracotta-600'
                              : rec.priority === 'medium'
                              ? 'text-ochre-600'
                              : 'text-stone'
                          }`}>
                            {rec.priority} priority
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-charcoal mb-2">{rec.title}</h3>
                        <p className="text-sm text-charcoal mb-3">{rec.description}</p>
                        
                        <div className="bg-primary-100 rounded-md p-3 mb-4">
                          <p className="text-xs font-medium text-primary-900 mb-1">Why this is recommended:</p>
                          <p className="text-xs text-primary-700">{rec.reason}</p>
                        </div>
                        
                        <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                          Start Learning
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* AI Feature Overview */}
                <div className="bg-gradient-to-r from-terracotta-600 to-primary-600 rounded-md p-6 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <SparklesIcon className="h-8 w-8" />
                    <h2 className="text-xl font-semibold">AI Learning Companion</h2>
                  </div>
                  <p className="text-white/90 mb-6">
                    Your personal AI assistant helps you learn smarter with personalized insights, adaptive difficulty, and real-time support.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-md p-4">
                      <LightBulbIcon className="h-6 w-6 mb-2" />
                      <h3 className="font-medium mb-1">Smart Insights</h3>
                      <p className="text-sm text-white/80">AI analyzes your progress and provides actionable recommendations</p>
                    </div>
                    <div className="bg-white/10 rounded-md p-4">
                      <TagIcon className="h-6 w-6 mb-2" />
                      <h3 className="font-medium mb-1">Adaptive Learning</h3>
                      <p className="text-sm text-white/80">Difficulty adjusts automatically based on your performance</p>
                    </div>
                    <div className="bg-white/10 rounded-md p-4">
                      <CpuChipIcon className="h-6 w-6 mb-2" />
                      <h3 className="font-medium mb-1">24/7 Support</h3>
                      <p className="text-sm text-white/80">Get instant answers to your questions from your AI companion</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal mb-2">My Learning</h1>
        <p className="text-stone">Track your progress and continue your learning journey</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-border/60">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="h-5 w-5" /> },
              { id: 'progress', label: 'Progress', icon: <TrophyIcon className="h-5 w-5" /> },
              { id: 'achievements', label: 'Achievements', icon: <TrophyIconSolid className="h-5 w-5" /> },
              { id: 'ai-insights', label: 'AI Insights', icon: <CpuChipIcon className="h-5 w-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-stone hover:text-charcoal hover:border-border/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {TabContent()}
      </motion.div>
    </div>
  )
}
