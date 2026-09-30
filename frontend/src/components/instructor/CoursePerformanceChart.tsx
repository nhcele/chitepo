import React from 'react'
import { motion } from 'framer-motion'

interface CoursePerformanceChartProps {
  data: Array<{
    name: string
    students: number
    completion: number
    revenue: number
  }>
  loading?: boolean
}

export default function CoursePerformanceChart({ data, loading }: CoursePerformanceChartProps) {
  if (loading) {
    return (
      <div className="bg-paper rounded-md p-6 border border-border/60">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.students), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-paper rounded-md p-6 border border-border/60"
    >
      <h3 className="font-serif text-lg font-semibold text-charcoal mb-6">Course performance</h3>

      <div className="space-y-5">
        {data.map((course, index) => (
          <motion.div
            key={course.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center gap-4">
              <h4 className="text-sm font-medium text-charcoal truncate">{course.name}</h4>
              <div className="flex items-center gap-4 text-xs text-pewter flex-shrink-0">
                <span>{course.students} students</span>
                <span>{course.completion}% completion</span>
                <span>${course.revenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="w-full bg-forest-100 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(course.students / maxValue) * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="bg-forest-600 h-2 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-stone">
          No course data available
        </div>
      )}
    </motion.div>
  )
}
