import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

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
  timeLimit: number; // in minutes
  shuffleQuestions: boolean;
  showResults: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  questions: QuizQuestion[];
}

interface QuizSystemProps {
  lessonId: string;
  initialData?: Partial<QuizData>;
  onSave: (data: QuizData) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  loading?: boolean;
}

export default function QuizSystem({ 
  lessonId, 
  initialData, 
  onSave, 
  onDirtyChange,
  loading = false 
}: QuizSystemProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [quizData, setQuizData] = useState<QuizData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    passingScore: initialData?.passingScore || 70,
    timeLimit: initialData?.timeLimit || 30,
    shuffleQuestions: initialData?.shuffleQuestions || false,
    showResults: initialData?.showResults || true,
    allowRetake: initialData?.allowRetake || true,
    maxAttempts: initialData?.maxAttempts || 3,
    questions: initialData?.questions || []
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<QuizData>({
    defaultValues: quizData
  });

  useEffect(() => {
    const nextData = {
      title: initialData?.title || '',
      description: initialData?.description || '',
      passingScore: initialData?.passingScore || 70,
      timeLimit: initialData?.timeLimit || 30,
      shuffleQuestions: initialData?.shuffleQuestions || false,
      showResults: initialData?.showResults ?? true,
      allowRetake: initialData?.allowRetake ?? true,
      maxAttempts: initialData?.maxAttempts || 3,
      questions: initialData?.questions || []
    };
    setQuizData(nextData);
    reset(nextData);
    setIsEditing(true);
    onDirtyChange?.(false);
  }, [initialData, onDirtyChange, reset]);

  useEffect(() => {
    if (isDirty) {
      onDirtyChange?.(true);
    }
  }, [isDirty, onDirtyChange]);

  const handleSaveQuiz = async (data: QuizData) => {
    try {
      const updatedData = { ...data, questions: quizData.questions };
      await onSave(updatedData);
      setQuizData(updatedData);
      reset(updatedData);
      onDirtyChange?.(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save quiz:', error);
      throw error;
    }
  };

  const handleAddQuestion = (question: QuizQuestion) => {
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...question, id: Date.now().toString() }]
    }));
    onDirtyChange?.(true);
    setIsEditing(true);
    setShowAddQuestion(false);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setShowAddQuestion(true);
  };

  const handleUpdateQuestion = (updatedQuestion: QuizQuestion) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    }));
    onDirtyChange?.(true);
    setIsEditing(true);
    setShowAddQuestion(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
    onDirtyChange?.(true);
    setIsEditing(true);
  };

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const questions = [...quizData.questions];
    const index = questions.findIndex(q => q.id === questionId);
    
    if (direction === 'up' && index > 0) {
      [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
    } else if (direction === 'down' && index < questions.length - 1) {
      [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
    }
    
    setQuizData(prev => ({ ...prev, questions }));
    onDirtyChange?.(true);
    setIsEditing(true);
  };

  const totalPoints = quizData.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md shadow-sm border border-border/60"
      >
        <div className="px-6 py-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-forest-50 rounded-md">
                <QuestionMarkCircleIcon className="h-5 w-5 text-forest-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal">Quiz Configuration</h3>
                <p className="text-sm text-stone">Set up quiz parameters and questions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing && (
                <button
                  onClick={() => setShowAddQuestion(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-forest-600 bg-forest-50 rounded-md hover:bg-forest-100 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Question
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(handleSaveQuiz)} className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Quiz title is required' })}
                  disabled={!isEditing}
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500 disabled:bg-paper disabled:text-stone"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-terracotta-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  {...register('timeLimit', { 
                    required: 'Time limit is required',
                    min: { value: 1, message: 'Must be at least 1 minute' },
                    max: { value: 180, message: 'Cannot exceed 3 hours' }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500 disabled:bg-paper disabled:text-stone"
                />
                {errors.timeLimit && (
                  <p className="mt-1 text-sm text-terracotta-600">{errors.timeLimit.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                disabled={!isEditing}
                placeholder="Describe what this quiz covers and any special instructions..."
                className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500 disabled:bg-paper disabled:text-stone"
              />
            </div>

            {/* Quiz Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  {...register('passingScore', { 
                    required: 'Passing score is required',
                    min: { value: 0, message: 'Must be between 0 and 100' },
                    max: { value: 100, message: 'Must be between 0 and 100' }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500 disabled:bg-paper disabled:text-stone"
                />
                {errors.passingScore && (
                  <p className="mt-1 text-sm text-terracotta-600">{errors.passingScore.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  {...register('maxAttempts', { 
                    required: 'Max attempts is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    max: { value: 10, message: 'Cannot exceed 10 attempts' }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500 disabled:bg-paper disabled:text-stone"
                />
                {errors.maxAttempts && (
                  <p className="mt-1 text-sm text-terracotta-600">{errors.maxAttempts.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="shuffleQuestions"
                  {...register('shuffleQuestions')}
                  disabled={!isEditing}
                  className="h-4 w-4 text-forest-600 border-border/60 rounded focus:ring-forest-500 disabled:opacity-50"
                />
                <label htmlFor="shuffleQuestions" className="text-sm text-charcoal">
                  Shuffle Questions
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="showResults"
                  {...register('showResults')}
                  disabled={!isEditing}
                  className="h-4 w-4 text-forest-600 border-border/60 rounded focus:ring-forest-500 disabled:opacity-50"
                />
                <label htmlFor="showResults" className="text-sm text-charcoal">
                  Show Results
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-border/60 pt-4">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-md hover:bg-forest-700 disabled:opacity-60 transition-colors"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Questions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-md shadow-sm border border-border/60"
      >
        <div className="px-6 py-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-50 rounded-md">
                <AcademicCapIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal">Questions ({quizData.questions.length})</h3>
                <p className="text-sm text-stone">Total Points: {totalPoints}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {quizData.questions.length === 0 ? (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="h-12 w-12 text-pewter mx-auto mb-4" />
              <h3 className="text-lg font-medium text-charcoal mb-2">No questions yet</h3>
              <p className="text-stone mb-4">Add your first question to get started</p>
              <button
                onClick={() => setShowAddQuestion(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizData.questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-border/60 rounded-md p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-stone">Question {index + 1}</span>
                        <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded">
                          {question.type.replace('-', ' ')}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium text-forest-700 bg-forest-50 rounded">
                          {question.points} points
                        </span>
                      </div>
                      
                      <h4 className="text-charcoal font-medium mb-2">{question.question}</h4>
                      
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-1 mb-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                question.correctAnswer === optionIndex 
                                  ? 'bg-forest-500 border-forest-500' 
                                  : 'border-border/60'
                              }`} />
                              <span className="text-sm text-charcoal">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'true-false' && (
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              question.correctAnswer === 'true' 
                                ? 'bg-forest-500 border-forest-500' 
                                : 'border-border/60'
                            }`} />
                            <span className="text-sm text-charcoal">True</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              question.correctAnswer === 'false' 
                                ? 'bg-forest-500 border-forest-500' 
                                : 'border-border/60'
                            }`} />
                            <span className="text-sm text-charcoal">False</span>
                          </div>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="mt-2 p-2 bg-paper rounded text-sm text-stone">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => handleMoveQuestion(question.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-pewter hover:text-stone disabled:opacity-50"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(question.id, 'down')}
                        disabled={index === quizData.questions.length - 1}
                        className="p-1 text-pewter hover:text-stone disabled:opacity-50"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-1 text-pewter hover:text-primary-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-1 text-pewter hover:text-terracotta-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Question Modal */}
      <AnimatePresence>
        {showAddQuestion && (
          <QuestionModal
            question={editingQuestion}
            onSave={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
            onClose={() => {
              setShowAddQuestion(false);
              setEditingQuestion(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Question Modal Component
interface QuestionModalProps {
  question?: QuizQuestion | null;
  onSave: (question: QuizQuestion) => void;
  onClose: () => void;
}

function QuestionModal({ question, onSave, onClose }: QuestionModalProps) {
  const [formData, setFormData] = useState<QuizQuestion>(
    question || {
      id: '',
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      explanation: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const changeQuestionType = (type: QuizQuestion['type']) => {
    setFormData((prev) => ({
      ...prev,
      type,
      options: type === 'multiple-choice' ? (prev.options && prev.options.length >= 2 ? prev.options : ['', '', '', '']) : undefined,
      correctAnswer:
        type === 'multiple-choice'
          ? 0
          : type === 'true-false'
            ? 'true'
            : '',
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
      correctAnswer: typeof prev.correctAnswer === 'number' && prev.correctAnswer === index ? 0 : 
                     typeof prev.correctAnswer === 'number' && prev.correctAnswer > index ? prev.correctAnswer - 1 : prev.correctAnswer
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-md shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-border/60">
          <h3 className="text-lg font-semibold text-charcoal">
            {question ? 'Edit Question' : 'Add New Question'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Question Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => changeQuestionType(e.target.value as QuizQuestion['type'])}
              className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Question
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
              required
              className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          {formData.type === 'multiple-choice' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Answer Options
              </label>
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswer === index}
                      onChange={() => setFormData(prev => ({ ...prev, correctAnswer: index }))}
                      className="h-4 w-4 text-forest-600 border-border/60"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                      className="flex-1 px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                    />
                    {formData.options && formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-1 text-terracotta-600 hover:text-terracotta-800"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options && formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-sm text-forest-600 hover:text-forest-800"
                >
                  + Add Option
                </button>
              )}
            </div>
          )}

          {formData.type === 'true-false' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Correct Answer
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="tfAnswer"
                    checked={formData.correctAnswer === 'true'}
                    onChange={() => setFormData(prev => ({ ...prev, correctAnswer: 'true' }))}
                    className="h-4 w-4 text-forest-600 border-border/60"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="tfAnswer"
                    checked={formData.correctAnswer === 'false'}
                    onChange={() => setFormData(prev => ({ ...prev, correctAnswer: 'false' }))}
                    className="h-4 w-4 text-forest-600 border-border/60"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {formData.type === 'short-answer' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Correct Answer (case-insensitive)
              </label>
              <input
                type="text"
                value={formData.correctAnswer as string}
                onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                placeholder="Enter the correct answer"
                required
                className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                min="1"
                max="100"
                required
                className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Explanation (optional)
            </label>
            <textarea
              value={formData.explanation || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              placeholder="Explain why this is the correct answer..."
              className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-charcoal bg-forest-100 rounded-md hover:bg-forest-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-md hover:bg-forest-700 transition-colors"
            >
              {question ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
