import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';
import QuizSystem from '@/components/instructor/QuizSystem';
import {
  getQuizByLesson,
  publishQuiz,
  unpublishQuiz,
  upsertQuizWithQuestions,
} from '@/lib/api/assessments';
import { motion } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import type { Question, Quiz } from '@mindelta/shared';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

interface QuizData {
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  questions: QuizQuestion[];
}

const emptyQuizData: QuizData = {
  title: '',
  description: '',
  passingScore: 70,
  timeLimit: 30,
  shuffleQuestions: false,
  showResults: true,
  allowRetake: true,
  maxAttempts: 3,
  questions: [],
};

function toBuilderType(type: string): QuizQuestion['type'] {
  const normalized = type.replace(/_/g, '-');
  if (normalized === 'true-false' || normalized === 'short-answer') return normalized;
  return 'multiple-choice';
}

function toBuilderCorrectAnswer(question: Question): string | number {
  const type = toBuilderType(String((question as any).type || (question as any).questionType || 'multiple_choice'));
  const answer = (question as any).correctAnswer;
  if (type === 'multiple-choice') {
    const numeric = Number(answer);
    return Number.isFinite(numeric) ? numeric : answer;
  }
  if (type === 'true-false') {
    const raw = String(answer).toLowerCase();
    if (raw === '0') return 'true';
    if (raw === '1') return 'false';
    return raw === 'true' ? 'true' : 'false';
  }
  return answer ?? '';
}

function mapQuizToBuilder(quiz: Quiz): QuizData {
  return {
    title: quiz.title || '',
    description: quiz.description || '',
    passingScore: quiz.passingScore ?? 70,
    timeLimit: quiz.timeLimitMinutes ?? quiz.timeLimit ?? 30,
    shuffleQuestions: quiz.randomizeQuestions ?? false,
    showResults: true,
    allowRetake: (quiz.maxAttempts ?? 0) !== 1,
    maxAttempts: quiz.maxAttempts && quiz.maxAttempts > 0 ? quiz.maxAttempts : 3,
    questions: (quiz.questions || []).map((question, index) => ({
      id: question.id || `${index}`,
      type: toBuilderType(String((question as any).type || (question as any).questionType || 'multiple_choice')),
      question: question.stem || (question as any).questionText || '',
      options: question.options || undefined,
      correctAnswer: toBuilderCorrectAnswer(question),
      points: question.points ?? 1,
      explanation: question.explanation || '',
    })),
  };
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (responseData && typeof responseData === 'object') {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.filter(Boolean).join(' ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function getPublishIssues(quiz: QuizData | null): string[] {
  if (!quiz) return ['Quiz has not loaded yet.'];
  const issues: string[] = [];
  if (!quiz.title.trim()) {
    issues.push('Add a quiz title.');
  }
  if (quiz.questions.length === 0) {
    issues.push('Add at least one question.');
  }
  quiz.questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.question.trim()) {
      issues.push(`${label} needs question text.`);
    }
    if (!Number.isFinite(Number(question.points)) || Number(question.points) <= 0) {
      issues.push(`${label} needs a positive point value.`);
    }
    if (question.type === 'multiple-choice') {
      const options = (question.options || []).filter((option) => option.trim());
      const answerIndex = Number(question.correctAnswer);
      if (options.length < 2) {
        issues.push(`${label} needs at least two answer options.`);
      }
      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
        issues.push(`${label} needs a valid correct option.`);
      }
    }
    if (question.type === 'short-answer' && !String(question.correctAnswer || '').trim()) {
      issues.push(`${label} needs an expected answer for grading.`);
    }
  });
  return issues;
}

export default function QuizBuilder() {
  const router = useRouter();
  const { lessonId, courseId } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publishIssues = getPublishIssues(quizData);
  const canPublish = publishIssues.length === 0 && !hasUnsavedChanges;

  useEffect(() => {
    if (!lessonId || Array.isArray(lessonId)) return;

    let cancelled = false;
    const loadQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const quiz = await getQuizByLesson(lessonId);
        if (cancelled) return;
        if (quiz) {
          setQuizId(quiz.id);
          setIsPublished(!!quiz.isPublished);
          setQuizData(mapQuizToBuilder(quiz));
          setHasUnsavedChanges(false);
        } else {
          setQuizId(null);
          setIsPublished(false);
          setQuizData(emptyQuizData);
          setHasUnsavedChanges(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load quiz:', loadError);
          setError(getApiErrorMessage(loadError, 'Failed to load quiz.'));
          setQuizData(emptyQuizData);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const handleSaveQuiz = async (data: QuizData) => {
    if (!lessonId || Array.isArray(lessonId)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await upsertQuizWithQuestions({
        quizId: quizId || undefined,
        lessonId,
        title: data.title,
        description: data.description,
        passingScore: Number(data.passingScore),
        timeLimit: Number(data.timeLimit),
        maxAttempts: Number(data.maxAttempts),
        randomizeQuestions: data.shuffleQuestions,
        isPublished,
        questions: data.questions.map((question, index) => ({
          id: question.id,
          type: question.type.replace(/-/g, '_'),
          stem: question.question,
          options: question.type === 'multiple-choice' ? question.options : undefined,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: Number(question.points) || 1,
          orderIndex: index,
        })),
      });

      setQuizId(saved.id);
      setIsPublished(!!saved.isPublished);
      setQuizData(mapQuizToBuilder(saved));
      setHasUnsavedChanges(false);
      setMessage('Draft saved.');
    } catch (saveError) {
      console.error('Failed to save quiz:', saveError);
      setError(getApiErrorMessage(saveError, 'Failed to save quiz.'));
      throw saveError;
    } finally {
      setSaving(false);
    }
  };

  const handlePublicationChange = async (publish: boolean) => {
    if (!quizId) {
      setError('Save the quiz before publishing it.');
      return;
    }
    if (publish && hasUnsavedChanges) {
      setError('Save your changes before publishing this quiz.');
      return;
    }
    if (publish && publishIssues.length > 0) {
      setError(publishIssues[0]);
      return;
    }

    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      const updated = publish ? await publishQuiz(quizId) : await unpublishQuiz(quizId);
      setIsPublished(!!updated.isPublished);
      setQuizData(mapQuizToBuilder(updated));
      setHasUnsavedChanges(false);
      setMessage(updated.isPublished ? 'Quiz published.' : 'Quiz unpublished.');
    } catch (publishError) {
      console.error('Failed to update quiz publication:', publishError);
      setError(getApiErrorMessage(publishError, 'Failed to update publication status.'));
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const openGradingQueue = () => {
    if (!quizId) {
      setError('Save the quiz before opening its grading queue.');
      return;
    }
    router.push(`/instructor/grading?quizId=${encodeURIComponent(quizId)}`);
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
        <title>Quiz Builder - Chitepo</title>
        <meta name="description" content="Create and manage quizzes for your lessons on Chitepo." />
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
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-stone bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-forest-50 rounded-md">
                      <QuestionMarkCircleIcon className="h-6 w-6 text-forest-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-charcoal">
                        Quiz Builder
                      </h1>
                      <p className="text-stone">
                        Lesson ID: {lessonId} {courseId && `• Course: ${courseId}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isPublished
                      ? 'text-forest-700 bg-forest-50'
                      : 'text-stone bg-paper'
                  }`}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-terracotta-700 bg-terracotta-50 rounded-md">
                      Unsaved changes
                    </span>
                  )}
                  {quizData && quizData.questions.length > 0 && (
                    <button
                      onClick={handlePreview}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Preview Quiz
                    </button>
                  )}
                  {quizId && (
                    <button
                      onClick={openGradingQueue}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-forest-700 bg-forest-50 rounded-md hover:bg-forest-100 transition-colors"
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                      Grade responses
                    </button>
                  )}
                  {isPublished ? (
                    <button
                      onClick={() => handlePublicationChange(false)}
                      disabled={publishing}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-stone bg-white border border-border/60 rounded-md hover:bg-paper disabled:opacity-60 transition-colors"
                    >
                      {publishing ? 'Updating...' : 'Unpublish'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublicationChange(true)}
                      disabled={publishing || !canPublish}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-md hover:bg-forest-700 disabled:opacity-60 transition-colors"
                    >
                      {publishing ? 'Publishing...' : hasUnsavedChanges ? 'Save before publish' : 'Publish'}
                    </button>
                  )}
                </div>
              </div>

              {(message || error) && (
                <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${
                  error
                    ? 'border-terracotta-200 bg-terracotta-50 text-terracotta-700'
                    : 'border-forest-200 bg-forest-50 text-forest-700'
                }`}>
                  {error || message}
                </div>
              )}

              {quizData && (
                <div className="mb-6 rounded-md border border-border/60 bg-white p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-charcoal">Publish readiness</h2>
                      <p className="text-xs text-stone">
                        {publishIssues.length === 0
                          ? 'Ready to publish once the latest draft is saved.'
                          : `${publishIssues.length} item${publishIssues.length === 1 ? '' : 's'} to resolve before publishing.`}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                      publishIssues.length === 0 && !hasUnsavedChanges
                        ? 'bg-forest-50 text-forest-700'
                        : 'bg-ochre-100 text-ochre-700'
                    }`}>
                      {publishIssues.length === 0 && !hasUnsavedChanges ? 'Ready' : 'Needs attention'}
                    </span>
                  </div>
                  {(publishIssues.length > 0 || hasUnsavedChanges) && (
                    <ul className="mt-3 space-y-1 text-sm text-stone">
                      {hasUnsavedChanges && <li>Save the latest draft before publishing.</li>}
                      {publishIssues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Quiz Stats */}
              {quizData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                >
                  <div className="bg-white border border-border/60 rounded-md p-4">
                    <div className="text-sm text-stone mb-1">Total Questions</div>
                    <div className="text-2xl font-bold text-charcoal">{quizData.questions.length}</div>
                  </div>
                  <div className="bg-white border border-border/60 rounded-md p-4">
                    <div className="text-sm text-stone mb-1">Total Points</div>
                    <div className="text-2xl font-bold text-charcoal">
                      {quizData.questions.reduce((sum, q) => sum + q.points, 0)}
                    </div>
                  </div>
                  <div className="bg-white border border-border/60 rounded-md p-4">
                    <div className="text-sm text-stone mb-1">Passing Score</div>
                    <div className="text-2xl font-bold text-forest-600">{quizData.passingScore}%</div>
                  </div>
                  <div className="bg-white border border-border/60 rounded-md p-4">
                    <div className="text-sm text-stone mb-1">Time Limit</div>
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
                onDirtyChange={setHasUnsavedChanges}
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
        className="bg-white rounded-md shadow-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-border/60 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-charcoal">Quiz Preview</h3>
            <button
              onClick={onClose}
              className="text-pewter hover:text-stone"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-charcoal mb-2">{quiz.title}</h2>
            <p className="text-stone mb-4">{quiz.description}</p>
            <div className="flex items-center space-x-6 text-sm text-stone">
              <span>Time Limit: {quiz.timeLimit} minutes</span>
              <span>Passing Score: {quiz.passingScore}%</span>
              <span>Questions: {quiz.questions.length}</span>
              <span>Total Points: {quiz.questions.reduce((sum, q) => sum + q.points, 0)}</span>
            </div>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="border border-border/60 rounded-md p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="font-medium text-charcoal">Question {index + 1}</span>
                  <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded">
                    {question.type.replace('-', ' ')}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium text-forest-700 bg-forest-50 rounded">
                    {question.points} points
                  </span>
                </div>

                <p className="text-charcoal font-medium mb-3">{question.question}</p>

                {question.type === 'multiple-choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 p-3 border border-border/60 rounded-md cursor-pointer hover:bg-paper">
                        <input
                          type="radio"
                          name={`preview-question-${index}`}
                          className="h-4 w-4 text-primary-600 border-border/60"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border border-border/60 rounded-md cursor-pointer hover:bg-paper">
                      <input
                        type="radio"
                        name={`preview-question-${index}`}
                        className="h-4 w-4 text-primary-600 border-border/60"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-border/60 rounded-md cursor-pointer hover:bg-paper">
                      <input
                        type="radio"
                        name={`preview-question-${index}`}
                        className="h-4 w-4 text-primary-600 border-border/60"
                      />
                      <span>False</span>
                    </label>
                  </div>
                )}

                {question.type === 'short-answer' && (
                  <textarea
                    placeholder="Type your answer here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              className="px-4 py-2 text-sm font-medium text-charcoal bg-forest-100 rounded-md hover:bg-forest-100 transition-colors"
            >
              Close Preview
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
            >
              Submit Quiz (Preview)
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
