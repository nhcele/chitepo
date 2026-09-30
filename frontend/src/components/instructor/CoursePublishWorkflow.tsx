import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface CoursePublishWorkflowProps {
  course: {
    id: string
    title: string
    description: string
    status: 'draft' | 'under_review' | 'published'
  }
  modules: Array<{
    id: string
    title: string
    lessons: Array<{
      id: string
      title: string
      type: 'video' | 'text' | 'quiz'
      content?: string
      contentUrl?: string
    }>
  }>
  onPublish: () => void
  onSubmitForReview: () => void
  onPreview: () => void
  loading?: boolean
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
  category: 'content' | 'quality' | 'legal' | 'technical'
}

export default function CoursePublishWorkflow({
  course,
  modules,
  onPublish,
  onSubmitForReview,
  onPreview,
  loading = false
}: CoursePublishWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'title',
      title: 'Course Title',
      description: 'Add a compelling, descriptive title',
      completed: course.title.trim().length > 0,
      required: true,
      category: 'content'
    },
    {
      id: 'description',
      title: 'Course Description',
      description: 'Write a clear description of what students will learn',
      completed: course.description.trim().length > 50,
      required: true,
      category: 'content'
    },
    {
      id: 'modules',
      title: 'Course Modules',
      description: 'Create at least 2 modules to structure your content',
      completed: modules.length >= 2,
      required: true,
      category: 'content'
    },
    {
      id: 'lessons',
      title: 'Lesson Content',
      description: 'Add video, text, or quiz content to each lesson',
      completed: modules.every(module => 
        module.lessons.every(lesson => 
          lesson.content || lesson.contentUrl
        )
      ),
      required: true,
      category: 'content'
    },
    {
      id: 'cover',
      title: 'Cover Image',
      description: 'Upload an attractive cover image for your course',
      completed: false, // Would check for cover image
      required: false,
      category: 'quality'
    },
    {
      id: 'preview',
      title: 'Course Preview',
      description: 'Review your course from the student perspective',
      completed: false,
      required: true,
      category: 'quality'
    },
    {
      id: 'pricing',
      title: 'Pricing Information',
      description: 'Set a competitive price for your course',
      completed: false,
      required: true,
      category: 'technical'
    },
    {
      id: 'legal',
      title: 'Legal Compliance',
      description: 'Agree to terms and content guidelines',
      completed: false,
      required: true,
      category: 'legal'
    }
  ])

  const steps = [
    { id: 'review', title: 'Review Course', icon: DocumentCheckIcon },
    { id: 'checklist', title: 'Quality Checklist', icon: CheckCircleIcon },
    { id: 'pricing', title: 'Pricing & Settings', icon: CurrencyDollarIcon },
    { id: 'publish', title: 'Publish', icon: AcademicCapIcon }
  ]

  const completedRequired = checklist.filter(item => item.required && item.completed).length
  const totalRequired = checklist.filter(item => item.required).length
  const isReadyToPublish = completedRequired === totalRequired

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ))
  }

  const categoryColors = {
    content: 'bg-primary-50 text-primary-700 border-primary-200',
    quality: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
    legal: 'bg-forest-50 text-forest-700 border-forest-200',
    technical: 'bg-ochre-50 text-ochre-700 border-ochre-200'
  }

  const StepContent = () => {
    switch (currentStep) {
      case 0: // Review
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-md border border-border/60 p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Course Overview</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-charcoal">Title</label>
                  <p className="mt-1 text-charcoal">{course.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-charcoal">Description</label>
                  <p className="mt-1 text-charcoal">{course.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-charcoal">Course Structure</label>
                  <div className="mt-2 space-y-2">
                    {modules.map((module, index) => (
                      <div key={module.id} className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{module.title}</span>
                        <span className="text-stone">({module.lessons.length} lessons)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">{modules.length}</div>
                    <div className="text-sm text-stone">Modules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                    </div>
                    <div className="text-sm text-stone">Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-charcoal">
                      {modules.reduce((sum, m) => 
                        sum + m.lessons.filter(l => l.type === 'video').length, 0
                      )}
                    </div>
                    <div className="text-sm text-stone">Videos</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={onPreview}
                className="inline-flex items-center px-4 py-2 border border-border/60 text-charcoal bg-white rounded-md hover:bg-paper"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview Course
              </button>
            </div>
          </div>
        )
        
      case 1: // Checklist
        return (
          <div className="space-y-6">
            <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                <div>
                  <h4 className="text-sm font-medium text-primary-900">Quality Standards</h4>
                  <p className="text-sm text-primary-700">
                    Complete {completedRequired} of {totalRequired} required items
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {checklist.map((item) => {
                const CategoryIcon = item.category === 'content' ? DocumentCheckIcon :
                                   item.category === 'quality' ? EyeIcon :
                                   item.category === 'legal' ? CheckCircleIcon :
                                   ClockIcon
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className={`border rounded-md p-4 cursor-pointer transition-colors ${
                      item.completed 
                        ? 'bg-forest-50 border-forest-200' 
                        : 'bg-white border-border/60 hover:bg-paper'
                    }`}
                    onClick={() => !item.required && toggleChecklistItem(item.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!item.required) toggleChecklistItem(item.id)
                        }}
                        disabled={item.required}
                        className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.completed 
                            ? 'bg-forest-600 border-forest-600' 
                            : 'border-border/60 hover:border-border/60'
                        } ${item.required ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {item.completed && (
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${
                            item.completed ? 'text-forest-900' : 'text-charcoal'
                          }`}>
                            {item.title}
                          </h4>
                          {item.required && (
                            <span className="text-xs text-terracotta-600 font-medium">Required</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[item.category]}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          item.completed ? 'text-forest-700' : 'text-stone'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      
                      <CategoryIcon className="h-5 w-5 text-pewter" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
        
      case 2: // Pricing
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-md border border-border/60 p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Pricing Strategy</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Course Price
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-stone">$</span>
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500"
                      placeholder="99.99"
                      defaultValue="99.99"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Pricing Tier
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Starter', price: '$29-49', desc: 'Basic courses' },
                      { name: 'Professional', price: '$99-199', desc: 'Comprehensive content' },
                      { name: 'Premium', price: '$299+', desc: 'Advanced programs' }
                    ].map((tier) => (
                      <label key={tier.name} className="cursor-pointer">
                        <input type="radio" name="pricing" className="sr-only peer" />
                        <div className="border-2 rounded-md p-3 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50">
                          <div className="font-medium text-charcoal">{tier.name}</div>
                          <div className="text-sm text-stone">{tier.price}</div>
                          <div className="text-xs text-pewter">{tier.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded border-border/60 text-primary-600" />
                    <div>
                      <span className="text-sm font-medium text-charcoal">Enable promotional pricing</span>
                      <p className="text-xs text-stone">Offer limited-time discounts</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 3: // Publish
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isReadyToPublish 
                  ? 'bg-forest-100 text-forest-600' 
                  : 'bg-ochre-100 text-ochre-600'
              }`}>
                {isReadyToPublish ? (
                  <CheckCircleIcon className="h-8 w-8" />
                ) : (
                  <ExclamationTriangleIcon className="h-8 w-8" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                {isReadyToPublish ? 'Ready to Publish!' : 'Almost Ready'}
              </h3>
              
              <p className="text-stone max-w-md mx-auto">
                {isReadyToPublish 
                  ? 'Your course meets all quality standards and is ready for students.'
                  : `Complete ${totalRequired - completedRequired} more required items to publish.`
                }
              </p>
            </div>
            
            <div className="bg-white rounded-md border border-border/60 p-6">
              <h4 className="font-medium text-charcoal mb-4">Publishing Options</h4>
              
              <div className="space-y-3">
                <button
                  onClick={onPublish}
                  disabled={!isReadyToPublish || loading}
                  className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
                    isReadyToPublish
                      ? 'bg-forest-600 text-white hover:bg-forest-700'
                      : 'bg-forest-100 text-pewter cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Publishing...' : 'Publish Course Now'}
                </button>
                
                <button
                  onClick={onSubmitForReview}
                  className="w-full px-4 py-3 border border-border/60 text-charcoal bg-white rounded-md font-medium hover:bg-paper"
                >
                  Submit for Review
                </button>
              </div>
              
              <div className="mt-4 text-xs text-stone">
                <p>• Published courses are immediately available to students</p>
                <p>• Review ensures quality standards are met</p>
                <p>• You can unpublish or make changes anytime</p>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === index
            const isCompleted = currentStep > index
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : isCompleted 
                        ? 'bg-forest-100 text-forest-700'
                        : 'text-stone hover:text-charcoal'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isActive 
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCompleted 
                        ? 'bg-forest-600 border-forest-600 text-white'
                        : 'border-border/60'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > index ? 'bg-forest-600' : 'bg-stone'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {StepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Previous
        </button>
        
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  )
}
