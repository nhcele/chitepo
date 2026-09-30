import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  TrophyIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XMarkIcon as XMarkIconSolid
} from '@heroicons/react/24/solid'

interface Question {
  id: string
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay'
  question: string
  options?: string[]
  correctAnswer: string | number
  explanation?: string
  points: number
  timeLimit?: number // in seconds
}

interface QuizResult {
  questionId: string
  userAnswer: string | number
  correct: boolean
  points: number
  timeSpent: number
}

interface QuizPlayerProps {
  quiz: {
    id: string
    title: string
    description: string
    questions: Question[]
    timeLimit?: number // total time in minutes
    passingScore: number
    allowRetake: boolean
    showResults: boolean
    shuffleQuestions: boolean
  }
  onComplete: (results: QuizResult[]) => void
  onProgress?: (currentQuestion: number, totalQuestions: number) => void
  loading?: boolean
}

export default function QuizPlayer({
  quiz,
  onComplete,
  onProgress,
  loading = false
}: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [results, setResults] = useState<QuizResult[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('')
  const [showFeedback, setShowFeedback] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const answeredQuestions = Object.keys(answers).length

  const handleSubmitQuiz = useCallback(() => {
    const quizResults: QuizResult[] = quiz.questions.map((question) => {
      const userAnswer = answers[question.id]
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
      const correct = userAnswer === question.correctAnswer
      
      return {
        questionId: question.id,
        userAnswer,
        correct,
        points: correct ? question.points : 0,
        timeSpent
      }
    })

    setResults(quizResults)
    setQuizCompleted(true)
    onComplete(quizResults)
  }, [quiz.questions, answers, questionStartTime, onComplete])

  useEffect(() => {
    if (quizStarted && !quizCompleted && timeRemaining && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0) {
      handleSubmitQuiz()
    }
  }, [quizStarted, quizCompleted, timeRemaining, handleSubmitQuiz])

  useEffect(() => {
    onProgress?.(currentQuestionIndex + 1, quiz.questions.length)
  }, [currentQuestionIndex, quiz.questions.length, onProgress])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (answer: string | number) => {
    setSelectedAnswer(answer)
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(answers[quiz.questions[currentQuestionIndex + 1].id] || '')
      setShowHint(false)
      setShowFeedback(false)
      setQuestionStartTime(Date.now())
    } else {
      handleSubmitQuiz()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedAnswer(answers[quiz.questions[currentQuestionIndex - 1].id] || '')
      setShowHint(false)
      setShowFeedback(false)
      setQuestionStartTime(Date.now())
    }
  }

  const calculateScore = () => {
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    const earnedPoints = results.reduce((sum, r) => sum + r.points, 0)
    return Math.round((earnedPoints / totalPoints) * 100)
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setQuestionStartTime(Date.now())
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setAnswers({})
    setResults([])
    setQuizStarted(false)
    setQuizCompleted(false)
    setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null)
    setShowHint(false)
    setShowFeedback(false)
    setSelectedAnswer('')
  }

  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-md shadow-sm border border-border/60 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-6">
              <QuestionMarkCircleIcon className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-charcoal mb-4">{quiz.title}</h2>
            <p className="text-stone mb-8 max-w-2xl mx-auto">{quiz.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal">{quiz.questions.length}</div>
                <div className="text-sm text-stone">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal">{quiz.passingScore}%</div>
                <div className="text-sm text-stone">Passing Score</div>
              </div>
              {quiz.timeLimit && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">{quiz.timeLimit}m</div>
                  <div className="text-sm text-stone">Time Limit</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal">
                  {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
                </div>
                <div className="text-sm text-stone">Total Points</div>
              </div>
            </div>
            
            <div className="bg-primary-50 border border-primary-200 rounded-md p-4 mb-8">
              <div className="flex items-start space-x-3">
                <LightBulbIcon className="h-5 w-5 text-primary-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-primary-900">Before you start</h4>
                  <ul className="text-sm text-primary-700 mt-1 space-y-1">
                    <li>• Read each question carefully before answering</li>
                    <li>• You can navigate between questions using the previous/next buttons</li>
                    <li>• Your progress is saved automatically</li>
                    {quiz.timeLimit && <li>• You have {quiz.timeLimit} minutes to complete the quiz</li>}
                    <li>• You need {quiz.passingScore}% or higher to pass</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    const score = calculateScore()
    const passed = score >= quiz.passingScore
    const correctAnswers = results.filter(r => r.correct).length

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-md shadow-sm border border-border/60 p-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
              passed ? 'bg-forest-100 text-forest-600' : 'bg-terracotta-100 text-terracotta-600'
            }`}>
              {passed ? (
                <TrophyIcon className="h-8 w-8" />
              ) : (
                <XMarkIcon className="h-8 w-8" />
              )}
            </div>
            
            <h2 className={`text-2xl font-bold mb-4 ${
              passed ? 'text-forest-900' : 'text-terracotta-900'
            }`}>
              {passed ? 'Congratulations! You Passed!' : 'Quiz Completed'}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  passed ? 'text-forest-600' : 'text-terracotta-600'
                }`}>
                  {score}%
                </div>
                <div className="text-sm text-stone">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal">{correctAnswers}</div>
                <div className="text-sm text-stone">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal">
                  {results.length - correctAnswers}
                </div>
                <div className="text-sm text-stone">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal">
                  {Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / 60)}m
                </div>
                <div className="text-sm text-stone">Time Spent</div>
              </div>
            </div>
            
            {quiz.showResults && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Question Review</h3>
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => {
                    const result = results.find(r => r.questionId === question.id)
                    
                    return (
                      <div key={question.id} className="border border-border/60 rounded-md p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded ${
                            result?.correct ? 'bg-forest-100 text-forest-600' : 'bg-terracotta-100 text-terracotta-600'
                          }`}>
                            {result?.correct ? (
                              <CheckCircleIconSolid className="h-4 w-4" />
                            ) : (
                              <XMarkIconSolid className="h-4 w-4" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-charcoal mb-2">
                              {index + 1}. {question.question}
                            </p>
                            
                            <div className="text-sm text-stone space-y-1">
                              <p>Your answer: <span className={result?.correct ? 'text-forest-600' : 'text-terracotta-600'}>
                                {result?.userAnswer}
                              </span></p>
                              {!result?.correct && (
                                <p>Correct answer: <span className="text-forest-600">{question.correctAnswer}</span></p>
                              )}
                              {question.explanation && (
                                <p className="text-stone italic">{question.explanation}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-4">
              {quiz.allowRetake && !passed && (
                <button
                  onClick={restartQuiz}
                  className="px-6 py-2 border border-border/60 text-charcoal rounded-md font-medium hover:bg-paper"
                >
                  Retake Quiz
                </button>
              )}
              
              <button className="px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700">
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="bg-white rounded-md shadow-sm border border-border/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">{quiz.title}</h2>
            <p className="text-sm text-stone">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {timeRemaining && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-md ${
                timeRemaining < 60 ? 'bg-terracotta-100 text-terracotta-700' : 'bg-forest-100 text-charcoal'
              }`}>
                <ClockIcon className="h-4 w-4" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            <div className="text-sm text-stone">
              {answeredQuestions} answered
            </div>
          </div>
        </div>
        
        <div className="w-full bg-forest-100 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-md shadow-sm border border-border/60 p-8">
        <div className="mb-8">
          <div className="flex items-start space-x-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-semibold text-sm">
              {currentQuestionIndex + 1}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                {currentQuestion.question}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-stone">
                <span>{currentQuestion.points} points</span>
                {currentQuestion.timeLimit && (
                  <span>• {currentQuestion.timeLimit}s time limit</span>
                )}
              </div>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-md cursor-pointer transition-colors ${
                  selectedAnswer === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border/60 hover:bg-paper'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => handleAnswerSelect(index)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedAnswer === index
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-border/60'
                }`}>
                  {selectedAnswer === index && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-charcoal">{option}</span>
              </label>
            ))}

            {currentQuestion.type === 'true-false' && (
              <div className="grid grid-cols-2 gap-4">
                {['True', 'False'].map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center justify-center p-4 border-2 rounded-md cursor-pointer transition-colors ${
                      selectedAnswer === option
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border/60 hover:bg-paper'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => handleAnswerSelect(option)}
                      className="sr-only"
                    />
                    <span className="text-charcoal font-medium">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'fill-blank' && (
              <input
                type="text"
                value={selectedAnswer as string}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            )}

            {currentQuestion.type === 'essay' && (
              <textarea
                rows={6}
                value={selectedAnswer as string}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Write your answer here..."
                className="w-full px-4 py-3 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            )}
          </div>

          {currentQuestion.explanation && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="mt-4 flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <LightBulbIcon className="h-4 w-4" />
              <span>{showHint ? 'Hide' : 'Show'} Hint</span>
            </button>
          )}

          {showHint && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
              <p className="text-sm text-primary-700">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border/60">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 text-charcoal bg-white border border-border/60 rounded-md font-medium hover:bg-paper disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-stone">
            {answeredQuestions} of {quiz.questions.length} questions answered
          </div>

          <button
            onClick={handleNextQuestion}
            className="flex items-center space-x-2 px-4 py-2 text-white bg-primary-600 rounded-md font-medium hover:bg-primary-700"
          >
            <span>
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit' : 'Next'}
            </span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
