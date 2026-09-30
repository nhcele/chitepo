import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface InstructorStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

export default function InstructorStatsCard({
  title,
  value,
  icon: Icon,
  trend,
  loading = false
}: InstructorStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-paper rounded-md p-5 border border-border/60"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-stone mb-1">{title}</p>
          <p className="text-2xl font-serif font-semibold text-charcoal">
            {loading ? (
              <span className="inline-block h-8 w-20 bg-forest-100 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
          {trend && !loading && (
            <div className="flex items-center mt-1.5">
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-forest-600' : 'text-terracotta-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-pewter ml-1.5">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-md bg-forest-100 flex-shrink-0">
          <Icon className="h-5 w-5 text-forest-600" />
        </div>
      </div>
    </motion.div>
  )
}
