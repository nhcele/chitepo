import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  PencilIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface CourseManagementCardProps {
  course: {
    id: string
    title: string
    status: 'draft' | 'published' | 'under_review' | 'archived'
    students?: number
    rating?: number
    updatedAt: string
    createdAt: string
  }
}

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'text-stone bg-forest-100',
    icon: ClockIcon
  },
  published: {
    label: 'Published',
    color: 'text-forest-600 bg-forest-100',
    icon: CheckCircleIcon
  },
  under_review: {
    label: 'Under Review',
    color: 'text-ochre-600 bg-ochre-100',
    icon: ExclamationTriangleIcon
  },
  archived: {
    label: 'Archived',
    color: 'text-stone bg-forest-100',
    icon: ClockIcon
  }
}

export default function CourseManagementCard({ course }: CourseManagementCardProps) {
  const statusInfo = statusConfig[course.status]
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-md shadow-sm border border-border/60 overflow-hidden"
    >
      {/* Course Header */}
      <div className="p-6 border-b border-border/60">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-charcoal mb-2 line-clamp-2">
              {course.title}
            </h3>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </span>
              <span className="text-sm text-stone">
                Updated {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-stone mb-1">
              <UserGroupIcon className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold text-charcoal">{course.students || 0}</p>
            <p className="text-xs text-stone">Students</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-ochre-500 mb-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-charcoal">{course.rating ? Number(course.rating).toFixed(1) : '0.0'}</p>
            <p className="text-xs text-stone">Rating</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-paper">
        <div className="grid grid-cols-3 gap-2">
          <Link href={`/instructor/courses/${course.id}`}>
            <span className="flex items-center justify-center px-3 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors cursor-pointer">
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </span>
          </Link>
          
          <Link href={`/instructor/courses/${course.id}/preview`}>
            <span className="flex items-center justify-center px-3 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors cursor-pointer">
              <EyeIcon className="h-4 w-4 mr-1" />
              Preview
            </span>
          </Link>
          
          <Link href={`/instructor/courses/${course.id}/analytics`}>
            <span className="flex items-center justify-center px-3 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors cursor-pointer">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              Analytics
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
