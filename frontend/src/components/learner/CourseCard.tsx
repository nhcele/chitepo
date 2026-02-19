import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  PlayIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  BookmarkIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid'

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    instructor: string
    instructorAvatar?: string
    rating: number
    students: number
    category: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    estimatedDuration: number
    coverImage: string
    price?: number
    enrolled?: boolean
    progress?: number
    completedLessons?: number
    totalLessons?: number
    lastAccessed?: string
    certificate?: boolean
  }
  variant?: 'default' | 'compact' | 'featured'
  showProgress?: boolean
  onEnroll?: (courseId: string) => void
  onBookmark?: (courseId: string) => void
  loading?: boolean
}

export default function CourseCard({
  course,
  variant = 'default',
  showProgress = false,
  onEnroll,
  onBookmark,
  loading = false
}: CourseCardProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBookmarked(!bookmarked)
    onBookmark?.(course.id)
  }

  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEnroll?.(course.id)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const renderRating = () => {
    const rating = typeof course.rating === 'number' ? course.rating : 0;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
              <Image
                src={course.coverImage}
                alt={course.title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                unoptimized={course.coverImage.startsWith('/api/')}
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {course.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {course.instructor}
                </p>
              </div>
              
              <button
                onClick={handleBookmark}
                className="ml-2 text-gray-400 hover:text-yellow-500"
              >
                {bookmarked ? (
                  <BookmarkIconSolid className="h-4 w-4 text-yellow-500" />
                ) : (
                  <BookmarkIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
              <span>{formatDuration(course.estimatedDuration)}</span>
              <span>•</span>
              <span>{course.students} students</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(course.difficulty)}`}>
                {course.difficulty}
              </span>
            </div>
            
            {showProgress && course.progress !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(course.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl shadow-xl overflow-hidden"
      >
        <div className="relative">
          <div className="aspect-video bg-black bg-opacity-20">
            <Image
              src={course.coverImage}
              alt={course.title}
              width={400}
              height={225}
              className="w-full h-full object-cover opacity-90"
              onLoad={() => setImageLoaded(true)}
              unoptimized={course.coverImage.startsWith('/api/')}
            />
          </div>
          
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-white bg-opacity-20 backdrop-blur-sm`}>
              Featured
            </span>
          </div>
          
          <div className="absolute top-4 right-4">
            <button
              onClick={handleBookmark}
              className="p-2 text-white bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30"
            >
              {bookmarked ? (
                <BookmarkIconSolid className="h-5 w-5" />
              ) : (
                <BookmarkIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {course.title}
            </h2>
            <p className="text-white text-opacity-90 mb-4">
              {course.description}
            </p>
            
            <div className="flex items-center space-x-4 text-white text-sm">
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="h-4 w-4" />
                <span>{(typeof course.students === 'number' ? course.students : 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formatDuration(course.estimatedDuration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <StarIconSolid className="h-4 w-4 text-yellow-400" />
                <span>{(typeof course.rating === 'number' ? course.rating : 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full">
                <Image
                  src={course.instructorAvatar || '/api/placeholder/40/40'}
                  alt={course.instructor}
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full"
                  unoptimized={(course.instructorAvatar || '/api/placeholder/40/40').startsWith('/api/')}
                />
              </div>
              <div>
                <p className="text-white font-medium">{course.instructor}</p>
                <p className="text-white text-opacity-75 text-sm">
                  {course.category}
                </p>
              </div>
            </div>
            
            <Link 
              href={`/courses/${course.id}`}
              className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>Start Learning</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200"
    >
      {/* Course Image */}
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={course.coverImage}
          alt={course.title}
          width={400}
          height={225}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          unoptimized={course.coverImage.startsWith('/api/')}
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
            {course.difficulty}
          </span>
        </div>
        
        <div className="absolute top-3 right-3">
          <button
            onClick={handleBookmark}
            className="p-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-opacity-100"
          >
            {bookmarked ? (
              <BookmarkIconSolid className="h-4 w-4 text-yellow-500" />
            ) : (
              <BookmarkIcon className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
        
        {showProgress && course.progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <span>{course.completedLessons} of {course.totalLessons} completed</span>
              <span>{Math.round(course.progress)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-1.5">
              <div 
                className="bg-white h-1.5 rounded-full"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {!course.enrolled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white rounded-lg p-3 shadow-lg">
                <PlayIcon className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {course.instructor}
            </p>
          </div>
          
          {course.certificate && (
            <div className="ml-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" title="Certificate available" />
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {course.description}
        </p>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
              <span>{(typeof course.rating === 'number' ? course.rating : 0).toFixed(1)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{(typeof course.students === 'number' ? course.students : 0).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDuration(course.estimatedDuration)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {course.enrolled ? (
            <Link 
              href={`/courses/${course.id}/learn`}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center space-x-2"
            >
              <PlayIcon className="h-4 w-4" />
              <span>Continue Learning</span>
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>
                    {course.price ? formatPrice(course.price) : 'Enroll Now'}
                  </span>
                </>
              )}
            </button>
          )}
          
          <Link 
            href={`/courses/${course.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
