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
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.students))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Course Performance</h3>
      
      <div className="space-y-4">
        {data.map((course, index) => (
          <motion.div
            key={course.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">{course.name}</h4>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{course.students} students</span>
                <span>{course.completion}% completion</span>
                <span>${course.revenue.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(course.students / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No course data available
        </div>
      )}
    </motion.div>
  )
}
