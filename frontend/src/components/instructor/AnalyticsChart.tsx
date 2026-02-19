import React from 'react'
import { motion } from 'framer-motion'

interface AnalyticsChartProps {
  title: string
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  type: 'bar' | 'line' | 'pie'
  loading?: boolean
}

export default function AnalyticsChart({ title, data, type, loading }: AnalyticsChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading chart...</div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))

  if (type === 'bar') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm text-gray-900 font-semibold">{item.value}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-3 rounded-full ${item.color || 'bg-primary-500'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color || 'bg-primary-500'}`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-900 font-semibold">{item.value}</span>
                  <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="h-64 flex items-center justify-center text-gray-500">
        Chart type &quot;{type}&quot; not implemented
      </div>
    </motion.div>
  )
}
