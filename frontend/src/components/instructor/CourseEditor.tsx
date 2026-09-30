import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  FolderIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Lesson {
  id: string
  title: string
  type: 'video' | 'text' | 'quiz'
  content?: string
  duration?: number
  order: number
}

interface Module {
  id: string
  title: string
  description?: string
  lessons: Lesson[]
  order: number
}

interface CourseEditorProps {
  course: {
    id: string
    title: string
    description: string
    status: 'draft' | 'published' | 'under_review'
  }
  modules: Module[]
  onModuleAdd: () => void
  onModuleUpdate: (moduleId: string, data: Partial<Module>) => void
  onModuleDelete: (moduleId: string) => void
  onModuleReorder: (moduleId: string, direction: 'up' | 'down') => void
  onLessonAdd: (moduleId: string) => void
  onLessonUpdate: (moduleId: string, lessonId: string, data: Partial<Lesson>) => void
  onLessonDelete: (moduleId: string, lessonId: string) => void
  onLessonReorder: (moduleId: string, lessonId: string, direction: 'up' | 'down') => void
  onPreview: () => void
  onAiGenerate: () => void
  loading?: boolean
}

const lessonTypeIcons = {
  video: VideoCameraIcon,
  text: DocumentTextIcon,
  quiz: QuestionMarkCircleIcon
}

const lessonTypeColors = {
  video: 'text-terracotta-600 bg-terracotta-50',
  text: 'text-primary-600 bg-primary-50',
  quiz: 'text-forest-600 bg-forest-50'
}

export default function CourseEditor({
  course,
  modules,
  onModuleAdd,
  onModuleUpdate,
  onModuleDelete,
  onModuleReorder,
  onLessonAdd,
  onLessonUpdate,
  onLessonDelete,
  onLessonReorder,
  onPreview,
  onAiGenerate,
  loading = false
}: CourseEditorProps) {
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)

  const handleModuleTitleChange = useCallback((moduleId: string, title: string) => {
    onModuleUpdate(moduleId, { title })
  }, [onModuleUpdate])

  const handleLessonTitleChange = useCallback((moduleId: string, lessonId: string, title: string) => {
    onLessonUpdate(moduleId, lessonId, { title })
  }, [onLessonUpdate])

  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const totalDuration = modules.reduce((sum, module) => 
    sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + (lesson.duration || 0), 0), 0
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md shadow-sm border border-border/60 p-6 mb-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-charcoal mb-2">{course.title}</h1>
            <p className="text-stone mb-4">{course.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-stone">
              <div className="flex items-center">
                <FolderIcon className="h-4 w-4 mr-1" />
                {modules.length} modules
              </div>
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                {totalLessons} lessons
              </div>
              <div className="flex items-center">
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onAiGenerate}
              className="inline-flex items-center px-4 py-2 border border-terracotta-300 text-terracotta-700 bg-terracotta-50 rounded-md hover:bg-terracotta-100 transition-colors"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              AI Generate
            </button>
            <button
              onClick={onPreview}
              className="inline-flex items-center px-4 py-2 border border-border/60 text-charcoal bg-white rounded-md hover:bg-paper transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modules and Lessons */}
      <div className="space-y-6">
        <AnimatePresence>
          {modules.map((module, moduleIndex) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: moduleIndex * 0.1 }}
              className="bg-white rounded-md shadow-sm border border-border/60 overflow-hidden"
            >
              {/* Module Header */}
              <div className="p-6 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-md font-semibold text-sm">
                      {moduleIndex + 1}
                    </div>
                    
                    {editingModule === module.id ? (
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => handleModuleTitleChange(module.id, e.target.value)}
                        onBlur={() => setEditingModule(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingModule(null)}
                        className="flex-1 text-lg font-semibold text-charcoal bg-paper border border-border/60 rounded-md px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className="text-lg font-semibold text-charcoal cursor-pointer hover:text-primary-600"
                        onClick={() => setEditingModule(module.id)}
                      >
                        {module.title}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onModuleReorder(module.id, 'up')}
                      disabled={moduleIndex === 0}
                      className="p-2 text-pewter hover:text-stone disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onModuleReorder(module.id, 'down')}
                      disabled={moduleIndex === modules.length - 1}
                      className="p-2 text-pewter hover:text-stone disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingModule(module.id)}
                      className="p-2 text-pewter hover:text-primary-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onModuleDelete(module.id)}
                      className="p-2 text-pewter hover:text-terracotta-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {module.description && (
                  <p className="mt-2 text-sm text-stone ml-11">{module.description}</p>
                )}
              </div>

              {/* Lessons */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-charcoal">Lessons ({module.lessons.length})</h4>
                  <button
                    onClick={() => onLessonAdd(module.id)}
                    className="inline-flex items-center px-3 py-1 text-sm border border-border/60 text-charcoal bg-white rounded-md hover:bg-paper"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Lesson
                  </button>
                </div>

                {module.lessons.length === 0 ? (
                  <div className="text-center py-8 text-stone">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No lessons yet. Add your first lesson to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const Icon = lessonTypeIcons[lesson.type]
                      
                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: lessonIndex * 0.05 }}
                          className="flex items-center justify-between p-3 bg-paper rounded-md hover:bg-forest-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-md ${lessonTypeColors[lesson.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            {editingLesson === lesson.id ? (
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => handleLessonTitleChange(module.id, lesson.id, e.target.value)}
                                onBlur={() => setEditingLesson(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingLesson(null)}
                                className="flex-1 text-sm font-medium text-charcoal bg-white border border-border/60 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-1">
                                <p 
                                  className="text-sm font-medium text-charcoal cursor-pointer hover:text-primary-600"
                                  onClick={() => setEditingLesson(lesson.id)}
                                >
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-stone capitalize">{lesson.type}</p>
                              </div>
                            )}
                            
                            {lesson.duration && (
                              <span className="text-xs text-stone">
                                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onLessonReorder(module.id, lesson.id, 'up')}
                              disabled={lessonIndex === 0}
                              className="p-1 text-pewter hover:text-stone disabled:opacity-50"
                            >
                              <ArrowUpIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onLessonReorder(module.id, lesson.id, 'down')}
                              disabled={lessonIndex === module.lessons.length - 1}
                              className="p-1 text-pewter hover:text-stone disabled:opacity-50"
                            >
                              <ArrowDownIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingLesson(lesson.id)}
                              className="p-1 text-pewter hover:text-primary-600"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onLessonDelete(module.id, lesson.id)}
                              className="p-1 text-pewter hover:text-terracotta-600"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Module Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: modules.length * 0.1 }}
        className="mt-6"
      >
        <button
          onClick={onModuleAdd}
          disabled={loading}
          className="w-full p-6 border-2 border-dashed border-border/60 rounded-md text-stone hover:border-border/60 hover:text-stone transition-colors disabled:opacity-50"
        >
          <PlusIcon className="h-6 w-6 mx-auto mb-2" />
          <span className="text-sm font-medium">Add Module</span>
        </button>
      </motion.div>
    </div>
  )
}
