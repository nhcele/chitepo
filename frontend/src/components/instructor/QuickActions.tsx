import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  PlusIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  BookOpenIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon
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
    label: 'Create course',
    href: '/instructor/courses/new',
    icon: PlusIcon,
    color: 'bg-forest-600 hover:bg-forest-500',
    description: 'Start building a new course'
  },
  {
    label: 'View analytics',
    href: '/instructor/analytics',
    icon: ChartBarIcon,
    color: 'bg-ink-800 hover:bg-ink-700',
    description: 'Track your performance metrics'
  },
  {
    label: 'Manage courses',
    href: '/instructor/courses',
    icon: BookOpenIcon,
    color: 'bg-terracotta-600 hover:bg-terracotta-500',
    description: 'Edit and organize your courses'
  },
  {
    label: 'Student insights',
    href: '/instructor/students',
    icon: UsersIcon,
    color: 'bg-ochre-500 hover:bg-ochre-400 text-ink-950',
    description: 'View student engagement data'
  },
  {
    label: 'Manual grading',
    href: '/instructor/grading',
    icon: ClipboardDocumentCheckIcon,
    color: 'bg-ochre-600 hover:bg-ochre-500 text-ink-950',
    description: 'Review written quiz responses'
  },
  {
    label: 'Question bank',
    href: '/instructor/question-bank',
    icon: ClipboardDocumentListIcon,
    color: 'bg-forest-700 hover:bg-forest-600',
    description: 'Reuse tagged assessment items'
  },
  {
    label: 'Item analysis',
    href: '/instructor/item-analysis',
    icon: ChartBarIcon,
    color: 'bg-terracotta-700 hover:bg-terracotta-600',
    description: 'Review objective-level quiz performance'
  },
  {
    label: 'Revenue report',
    href: '/instructor/revenue',
    icon: CurrencyDollarIcon,
    color: 'bg-forest-700 hover:bg-forest-600',
    description: 'Track earnings and payouts'
  },
  {
    label: 'Settings',
    href: '/instructor/settings',
    icon: Cog6ToothIcon,
    color: 'bg-stone/80 hover:bg-stone',
    description: 'Manage your account settings'
  }
]

export default function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-paper rounded-md p-6 border border-border/60"
    >
      <h3 className="font-serif text-lg font-semibold text-charcoal mb-6">Quick actions</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`rounded-md p-4 block text-cream transition-colors ${action.color}`}
          >
            <action.icon className="h-5 w-5 mb-3 opacity-90" />
            <h4 className="font-semibold text-sm mb-1">{action.label}</h4>
            <p className="text-xs opacity-80 line-clamp-2">{action.description}</p>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
