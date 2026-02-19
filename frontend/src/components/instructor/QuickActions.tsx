import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  PlusIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  BookOpenIcon,
  UsersIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface QuickAction {
  label: string
  href: string
  icon: any
  color: string
  description: string
}

interface QuickActionsProps {
  actions?: QuickAction[]
}

const defaultActions: QuickAction[] = [
  { 
    label: 'Create Course', 
    href: '/instructor/courses/new', 
    icon: PlusIcon, 
    color: 'from-primary-500 to-primary-600',
    description: 'Start building a new course'
  },
  { 
    label: 'View Analytics', 
    href: '/instructor/analytics', 
    icon: ChartBarIcon, 
    color: 'from-emerald-500 to-emerald-600',
    description: 'Track your performance metrics'
  },
  { 
    label: 'Manage Courses', 
    href: '/instructor/courses', 
    icon: BookOpenIcon, 
    color: 'from-purple-500 to-purple-600',
    description: 'Edit and organize your courses'
  },
  { 
    label: 'Student Insights', 
    href: '/instructor/students', 
    icon: UsersIcon, 
    color: 'from-orange-500 to-orange-600',
    description: 'View student engagement data'
  },
  { 
    label: 'Revenue Report', 
    href: '/instructor/revenue', 
    icon: CurrencyDollarIcon, 
    color: 'from-green-500 to-green-600',
    description: 'Track earnings and payouts'
  },
  { 
    label: 'Settings', 
    href: '/instructor/settings', 
    icon: Cog6ToothIcon, 
    color: 'from-gray-500 to-gray-600',
    description: 'Manage your account settings'
  }
]

export default function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href={action.href}
              className={`
                relative overflow-hidden rounded-lg p-4 cursor-pointer block
                bg-gradient-to-br ${action.color} text-white
                transition-all duration-200 hover:shadow-lg
              `}
            >
              <div className="relative z-10">
                <action.icon className="h-6 w-6 mb-3 opacity-90" />
                <h4 className="font-semibold text-sm mb-1">{action.label}</h4>
                <p className="text-xs opacity-80 line-clamp-2">{action.description}</p>
              </div>
              
              {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-white opacity-10" />
              <div className="absolute bottom-0 left-0 -mb-2 -ml-2 h-8 w-8 rounded-full bg-white opacity-10" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
