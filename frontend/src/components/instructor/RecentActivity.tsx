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
  enrollment: 'text-forest-600 bg-forest-100',
  completion: 'text-forest-600 bg-forest-100',
  review: 'text-ochre-600 bg-ochre-100',
  purchase: 'text-forest-600 bg-forest-100',
  lesson: 'text-terracotta-600 bg-terracotta-100'
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-paper rounded-md p-6 border border-border/60">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-forest-100 rounded-md" />
                <div className="flex-1">
                  <div className="h-4 bg-forest-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-forest-100 rounded w-1/2" />
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-paper rounded-md p-6 border border-border/60"
    >
      <h3 className="font-serif text-lg font-semibold text-charcoal mb-6">Recent activity</h3>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type]

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-md hover:bg-forest-100/50 transition-colors"
            >
              <div className={`p-2 rounded-md flex-shrink-0 ${activityColors[activity.type]}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">
                  {activity.title}
                </p>
                <p className="text-sm text-stone truncate">
                  {activity.description}
                </p>
                {activity.course && (
                  <p className="text-xs text-pewter mt-1">
                    Course: {activity.course}
                  </p>
                )}
                {activity.student && (
                  <p className="text-xs text-pewter mt-1">
                    Student: {activity.student}
                  </p>
                )}
              </div>

              <div className="text-xs text-pewter whitespace-nowrap flex-shrink-0">
                {activity.timestamp}
              </div>
            </motion.div>
          )
        })}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8 text-stone">
          No recent activity
        </div>
      )}
    </motion.div>
  )
}
