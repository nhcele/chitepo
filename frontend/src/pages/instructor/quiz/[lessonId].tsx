import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';
import QuizSystem from '@/components/instructor/QuizSystem';
import { motion } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface QuizData {
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  questions: Array<{
    id: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    question: string;
    options?: string[];
    correctAnswer: string | number;
    points: number;
    explanation?: string;
  }>;
}

export default function QuizBuilder() {
  const { lessonId, courseId } = useRouter().query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    if (lessonId) {
      // Simulate API call to fetch existing quiz
      setLoading(true);
      setTimeout(() => {
        setQuizData({
          title: 'JavaScript Fundamentals Quiz',
          description: 'Test your knowledge of basic JavaScript concepts including variables, functions, and control structures.',
          passingScore: 70,
          timeLimit: 30,
          shuffleQuestions: true,
          showResults: true,
          allowRetake: true,
          maxAttempts: 3,
          questions: [
            {
              id: '1',
              type: 'multiple-choice',
              question: 'What is the correct way to declare a variable in JavaScript?',
              options: [
                'var myVariable = 5;',
                'variable myVariable = 5;',
                'v myVariable = 5;',
                'declare myVariable = 5;'
              ],
              correctAnswer: 0,
              points: 5,
              explanation: 'The correct syntax is "var" followed by the variable name and assignment.'
            },
            {
              id: '2',
              type: 'true-false',
              question: 'JavaScript is a compiled programming language.',
              correctAnswer: 'false',
              points: 3,
              explanation: 'JavaScript is an interpreted programming language, not compiled.'
            },
            {
              id: '3',
              type: 'short-answer',
              question: 'What keyword is used to declare a constant in ES6?',
              correctAnswer: 'const',
              points: 4,
              explanation: 'The "const" keyword is used to declare variables that cannot be reassigned.'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    }
  }, [lessonId]);

  const handleSaveQuiz = async (data: QuizData) => {
    setSaving(true);
    try {
      // API call to save quiz
      console.log('Saving quiz for lesson:', lessonId, data);
      setQuizData(data);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Failed to save quiz:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Layout>
      </RoleGuard>
    );
  }

  return (
    <>
      <Head>
        <title>Quiz Builder - Mindelta</title>
        <meta name="description" content="Create and manage quizzes for your lessons on Mindelta." />
      </Head>
      
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <QuestionMarkCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Quiz Builder
                      </h1>
                      <p className="text-gray-500">
                        Lesson ID: {lessonId} {courseId && `• Course: ${courseId}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {quizData && quizData.questions.length > 0 && (
                    <button
                      onClick={handlePreview}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Preview Quiz
                    </button>
                  )}
                </div>
              </div>

              {/* Quiz Stats */}
              {quizData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                >
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Questions</div>
                    <div className="text-2xl font-bold text-gray-900">{quizData.questions.length}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Points</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {quizData.questions.reduce((sum, q) => sum + q.points, 0)}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Passing Score</div>
                    <div className="text-2xl font-bold text-green-600">{quizData.passingScore}%</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Time Limit</div>
                    <div className="text-2xl font-bold text-primary-600">{quizData.timeLimit}m</div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quiz System Component */}
            {quizData && (
              <QuizSystem
                lessonId={lessonId as string}
                initialData={quizData}
                onSave={handleSaveQuiz}
                loading={saving}
              />
            )}

            {/* Preview Modal */}
            {showPreview && quizData && (
              <QuizPreviewModal
                quiz={quizData}
                onClose={() => setShowPreview(false)}
              />
            )}
          </motion.div>
        </Layout>
      </RoleGuard>
    </>
  );
}

// Quiz Preview Modal Component
interface QuizPreviewModalProps {
  quiz: QuizData;
  onClose: () => void;
}

function QuizPreviewModal({ quiz, onClose }: QuizPreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Quiz Preview</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
            <p className="text-gray-600 mb-4">{quiz.description}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Time Limit: {quiz.timeLimit} minutes</span>
              <span>Passing Score: {quiz.passingScore}%</span>
              <span>Questions: {quiz.questions.length}</span>
              <span>Total Points: {quiz.questions.reduce((sum, q) => sum + q.points, 0)}</span>
            </div>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="font-medium text-gray-900">Question {index + 1}</span>
                  <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded">
                    {question.type.replace('-', ' ')}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded">
                    {question.points} points
                  </span>
                </div>

                <p className="text-gray-900 font-medium mb-3">{question.question}</p>

                {question.type === 'multiple-choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`preview-question-${index}`}
                          className="h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name={`preview-question-${index}`}
                        className="h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name={`preview-question-${index}`}
                        className="h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <span>False</span>
                    </label>
                  </div>
                )}

                {question.type === 'short-answer' && (
                  <textarea
                    placeholder="Type your answer here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}

                {question.explanation && (
                  <div className="mt-3 p-3 bg-primary-50 rounded text-sm text-primary-800">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close Preview
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Submit Quiz (Preview)
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
