import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  BookmarkIcon,
  ShareIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon,
  LanguageIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon as CheckCircleIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid'

interface Lesson {
  id: string
  title: string
  type: 'video' | 'text' | 'interactive'
  content?: string
  contentUrl?: string
  duration: number
  completed: boolean
  order: number
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorAvatar?: string
  rating: number
  students: number
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number
  coverImage: string
}

interface CoursePlayerProps {
  course: Course
  modules: Module[]
  currentLessonId?: string
  onLessonComplete: (lessonId: string) => void
  onProgressUpdate: (lessonId: string, progress: number) => void
  onBookmark?: (lessonId: string) => void
  loading?: boolean
}

export default function CoursePlayer({
  course,
  modules,
  currentLessonId,
  onLessonComplete,
  onProgressUpdate,
  onBookmark,
  loading = false
}: CoursePlayerProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [volume, setVolume] = useState(1)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showTranscript, setShowTranscript] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentModule = modules[currentModuleIndex]
  const currentLesson = currentModule?.lessons[currentLessonIndex]
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const completedLessons = modules.reduce((sum, module) => 
    sum + module.lessons.filter(lesson => lesson.completed).length, 0
  )
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const handleNextLesson = useCallback(() => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
    } else if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1)
      setCurrentLessonIndex(0)
    }
  }, [currentLessonIndex, currentModuleIndex, currentModule, modules])

  const handlePreviousLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1)
      setCurrentLessonIndex(modules[currentModuleIndex - 1].lessons.length - 1)
    }
  }, [currentLessonIndex, currentModuleIndex, modules])

  const handleLessonClick = useCallback((moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex)
    setCurrentLessonIndex(lessonIndex)
  }, [])

  const handleMarkComplete = useCallback(() => {
    if (currentLesson) {
      onLessonComplete(currentLesson.id)
    }
  }, [currentLesson, onLessonComplete])

  const handleBookmark = useCallback(() => {
    if (currentLesson) {
      setBookmarked(!bookmarked)
      onBookmark?.(currentLesson.id)
    }
  }, [currentLesson, bookmarked, onBookmark])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }, [])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return VideoCameraIcon
      case 'text': return DocumentTextIcon
      case 'quiz': return QuestionMarkCircleIcon
      default: return BookOpenIcon
    }
  }

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-terracotta-600 bg-terracotta-50'
      case 'text': return 'text-primary-600 bg-primary-50'
      case 'quiz': return 'text-forest-600 bg-forest-50'
      default: return 'text-stone bg-paper'
    }
  }

  if (!currentLesson) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AcademicCapIcon className="h-12 w-12 text-pewter mx-auto mb-4" />
          <h3 className="text-lg font-medium text-charcoal mb-2">No lessons available</h3>
          <p className="text-stone">This course doesn&apos;t have any lessons yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-ink-950">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 bg-ink-900 border-r border-border/60 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Course Content</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-pewter hover:text-white"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Overview */}
              <div className="mb-6 p-3 bg-ink-800 rounded-md">
                <div className="flex items-center justify-between text-sm text-pewter mb-2">
                  <span>Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-stone rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-pewter">
                  {completedLessons} of {totalLessons} lessons completed
                </div>
              </div>

              {/* Modules and Lessons */}
              <div className="space-y-4">
                {modules.map((module, moduleIndex) => {
                  const moduleCompletedLessons = module.lessons.filter(lesson => lesson.completed).length
                  const moduleProgress = (moduleCompletedLessons / module.lessons.length) * 100

                  return (
                    <div key={module.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <h4 className="text-white font-medium">{module.title}</h4>
                        <span className="text-pewter">
                          {moduleCompletedLessons}/{module.lessons.length}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const Icon = getLessonIcon(lesson.type)
                          const isCurrentLesson = 
                            moduleIndex === currentModuleIndex && 
                            lessonIndex === currentLessonIndex

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(moduleIndex, lessonIndex)}
                              className={`w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors ${
                                isCurrentLesson
                                  ? 'bg-primary-600 text-white'
                                  : lesson.completed
                                    ? 'bg-ink-800 text-pewter'
                                    : 'text-pewter hover:bg-ink-800'
                              }`}
                            >
                              <div className={`p-1 rounded ${isCurrentLesson ? 'bg-primary-700' : getLessonTypeColor(lesson.type)}`}>
                                <Icon className="h-3 w-3" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {lesson.title}
                                </p>
                                <p className="text-xs opacity-75">
                                  {formatTime(lesson.duration)}
                                </p>
                              </div>
                              
                              {lesson.completed && (
                                <CheckCircleIconSolid className="h-4 w-4 text-forest-500" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-ink-900 border-b border-border/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="text-pewter hover:text-white"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              )}
              
              <div>
                <h1 className="text-white font-semibold">{course.title}</h1>
                <p className="text-sm text-pewter">
                  {currentModule?.title} • {currentLesson?.title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-md transition-colors ${
                  bookmarked 
                    ? 'bg-primary-600 text-white' 
                    : 'text-pewter hover:bg-ink-800'
                }`}
              >
                <BookmarkIcon className="h-5 w-5" />
              </button>
              
              <button className="p-2 text-pewter hover:bg-ink-800 rounded-md">
                <ShareIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-pewter hover:bg-ink-800 rounded-md"
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Video/Content Area */}
        <div className="flex-1 bg-black relative" ref={containerRef}>
          {currentLesson.type === 'video' ? (
            <div className="relative h-full">
              <video
                ref={videoRef}
                src={currentLesson.contentUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  setProgress(0)
                  setCurrentTime(0)
                }}
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-6 w-6" />
                    ) : (
                      <PlayIcon className="h-6 w-6" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm">
                        {formatTime(currentTime)}
                      </span>
                      <div className="flex-1 bg-stone rounded-full h-1">
                        <div 
                          className="bg-primary-500 h-1 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">
                        {formatTime(currentLesson.duration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full">
                      <SpeakerWaveIcon className="h-5 w-5" />
                    </button>
                    
                    <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full">
                      <LanguageIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : currentLesson.type === 'text' ? (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {currentLesson.title}
                </h2>
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-pewter leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content || '' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <QuestionMarkCircleIcon className="h-16 w-16 text-stone mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Quiz Lesson</h3>
                <p className="text-pewter mb-6">
                  Quiz interface coming soon!
                </p>
                <button className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  Start Quiz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-ink-900 border-t border-border/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousLesson}
              disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-pewter hover:bg-ink-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              {!currentLesson.completed && (
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center space-x-2 px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Mark Complete</span>
                </button>
              )}
              
              {currentLesson.completed && (
                <div className="flex items-center space-x-2 text-forest-500">
                  <CheckCircleIconSolid className="h-5 w-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>

            <button
              onClick={handleNextLesson}
              disabled={
                currentModuleIndex === modules.length - 1 && 
                currentLessonIndex === currentModule.lessons.length - 1
              }
              className="flex items-center space-x-2 px-4 py-2 text-pewter hover:bg-ink-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
