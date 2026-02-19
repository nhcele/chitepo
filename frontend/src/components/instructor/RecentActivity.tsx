import React from 'react'
import { motion } from 'framer-motion'
import { 
  UserPlusIcon, 
  AcademicCapIcon, 
  StarIcon, 
  CurrencyDollarIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

interface ActivityItem {
  id: string
  type: 'enrollment' | 'completion' | 'review' | 'purchase' | 'lesson'
  title: string
  description: string
  timestamp: string
  course?: string
  student?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
  loading?: boolean
}

const activityIcons = {
  enrollment: UserPlusIcon,
  completion: AcademicCapIcon,
  review: StarIcon,
  purchase: CurrencyDollarIcon,
  lesson: ClockIcon
}

const activityColors = {
  enrollment: 'text-primary-600 bg-primary-50',
  completion: 'text-green-600 bg-green-50',
  review: 'text-yellow-600 bg-yellow-50',
  purchase: 'text-emerald-600 bg-emerald-50',
  lesson: 'text-purple-600 bg-purple-50'
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type]
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-2 rounded-full ${activityColors[activity.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {activity.description}
                </p>
                {activity.course && (
                  <p className="text-xs text-gray-400 mt-1">
                    Course: {activity.course}
                  </p>
                )}
                {activity.student && (
                  <p className="text-xs text-gray-400 mt-1">
                    Student: {activity.student}
                  </p>
                )}
              </div>
              
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {activity.timestamp}
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No recent activity
        </div>
      )}
    </motion.div>
  )
}
