import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  VideoCameraIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  LinkIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'

interface LessonEditorProps {
  lesson: {
    id: string
    title: string
    type: 'video' | 'text' | 'quiz'
    content?: string
    contentUrl?: string
    duration?: number
  }
  onUpdate: (data: any) => void
  onSave: () => void
  onCancel: () => void
  loading?: boolean
}

export default function LessonEditor({
  lesson,
  onUpdate,
  onSave,
  onCancel,
  loading = false
}: LessonEditorProps) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content || '')
  const [contentUrl, setContentUrl] = useState(lesson.contentUrl || '')
  const [duration, setDuration] = useState(lesson.duration || 0)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')

  const handleSave = useCallback(() => {
    onUpdate({
      title,
      content,
      contentUrl,
      duration
    })
    onSave()
  }, [title, content, contentUrl, duration, onUpdate, onSave])

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true)
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      setContentUrl(`https://example.com/uploads/${file.name}`)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [])

  const lessonTypeConfig = {
    video: {
      icon: VideoCameraIcon,
      color: 'text-terracotta-600 bg-terracotta-50',
      label: 'Video Lesson',
      placeholder: 'Enter video URL or upload a video file...'
    },
    text: {
      icon: DocumentTextIcon,
      color: 'text-primary-600 bg-primary-50',
      label: 'Text Lesson',
      placeholder: 'Write your lesson content here...'
    },
    quiz: {
      icon: QuestionMarkCircleIcon,
      color: 'text-forest-600 bg-forest-50',
      label: 'Quiz Lesson',
      placeholder: 'Create quiz questions and answers...'
    }
  }

  const config = lessonTypeConfig[lesson.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-md shadow-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-charcoal">{config.label}</h2>
              <p className="text-sm text-stone">Edit lesson content and settings</p>
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="p-2 text-pewter hover:text-stone"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'content'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-stone hover:text-charcoal'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'settings'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-stone hover:text-charcoal'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'content' ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter lesson title..."
                />
              </div>

              {/* Content based on type */}
              {lesson.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Video Content
                  </label>
                  
                  {/* URL Input */}
                  <div className="mb-4">
                    <input
                      type="url"
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)..."
                    />
                  </div>

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-border/60 rounded-md p-6 text-center">
                    <VideoCameraIcon className="h-12 w-12 text-pewter mx-auto mb-2" />
                    <p className="text-sm text-stone mb-2">Or upload a video file</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="inline-flex items-center px-4 py-2 border border-border/60 text-sm font-medium text-charcoal bg-white rounded-md hover:bg-paper cursor-pointer"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </label>
                  </div>
                </div>
              )}

              {lesson.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Lesson Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Write your lesson content here..."
                  />
                  
                  {/* Text formatting toolbar */}
                  <div className="mt-2 flex items-center space-x-2 text-sm">
                    <button className="p-2 text-stone hover:text-charcoal border border-border/60 rounded">
                      <strong>B</strong>
                    </button>
                    <button className="p-2 text-stone hover:text-charcoal border border-border/60 rounded">
                      <em>I</em>
                    </button>
                    <button className="p-2 text-stone hover:text-charcoal border border-border/60 rounded">
                      <u>U</u>
                    </button>
                    <div className="h-4 w-px bg-stone" />
                    <button className="p-2 text-stone hover:text-charcoal border border-border/60 rounded">
                      <LinkIcon className="h-3 w-3" />
                    </button>
                    <button className="p-2 text-stone hover:text-charcoal border border-border/60 rounded">
                      <PhotoIcon className="h-3 w-3" />
                    </button>
                    <button className="p-2 text-stone hover:text-charcoal border border-border/60 rounded">
                      <DocumentIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {lesson.type === 'quiz' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Quiz Questions
                  </label>
                  <div className="border-2 border-dashed border-border/60 rounded-md p-6 text-center">
                    <QuestionMarkCircleIcon className="h-12 w-12 text-pewter mx-auto mb-2" />
                    <p className="text-sm text-stone mb-2">Quiz builder coming soon</p>
                    <p className="text-xs text-stone">For now, add quiz questions as text content</p>
                  </div>
                  
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="w-full mt-4 px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add quiz questions and answers here..."
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Estimated lesson duration..."
                />
              </div>

              {/* Additional Settings */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Lesson Settings
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-border/60 text-primary-600 focus:ring-primary-500" />
                    <span className="ml-2 text-sm text-charcoal">Require completion before next lesson</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-border/60 text-primary-600 focus:ring-primary-500" />
                    <span className="ml-2 text-sm text-charcoal">Allow downloads</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-border/60 text-primary-600 focus:ring-primary-500" />
                    <span className="ml-2 text-sm text-charcoal">Include in certificate</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border/60 bg-paper">
          <div className="text-sm text-stone">
            {lesson.type === 'video' && contentUrl && 'Video URL added'}
            {lesson.type === 'text' && content.length > 0 && `${content.length} characters`}
            {lesson.type === 'quiz' && content.length > 0 && 'Quiz questions added'}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
