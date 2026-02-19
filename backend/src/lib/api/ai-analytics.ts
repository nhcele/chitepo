// AI Analytics API Client
// Frontend helper functions for AI-powered analytics features

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Predictive Analytics

export const predictCompletion = async (courseId: string) => {
  const response = await api.get(`/ai-analytics/predict-completion/${courseId}`);
  return response.data;
};

export const getAtRiskProfile = async () => {
  const response = await api.get('/ai-analytics/at-risk-profile');
  return response.data;
};

export const forecastSkillMastery = async (skill: string, targetLevel?: number) => {
  const response = await api.post('/ai-analytics/skill-mastery-forecast', {
    skill,
    targetLevel,
  });
  return response.data;
};

export const generateOptimalSchedule = async (
  courseId: string,
  targetCompletionDate: string
) => {
  const response = await api.post('/ai-analytics/optimal-schedule', {
    courseId,
    targetCompletionDate,
  });
  return response.data;
};

// Teaching Assistant

export const getClassAnalytics = async (courseId: string) => {
  const response = await api.get(`/ai-analytics/class-analytics/${courseId}`);
  return response.data;
};

export const generateDiscussionPrompts = async (
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  count?: number
) => {
  const response = await api.post('/ai-analytics/discussion-prompts', {
    topic,
    difficulty,
    count,
  });
  return response.data;
};

export const respondToFAQ = async (
  question: string,
  courseContext: string,
  lessonContext?: string
) => {
  const response = await api.post('/ai-analytics/faq-response', {
    question,
    courseContext,
    lessonContext,
  });
  return response.data;
};

export const analyzeContentQuality = async (lessonId: string) => {
  const response = await api.get(`/ai-analytics/content-feedback/${lessonId}`);
  return response.data;
};

export const generateStudentFeedback = async (params: {
  studentId: string;
  assignmentTitle: string;
  submission: string;
  rubric: string;
  maxScore: number;
}) => {
  const response = await api.post('/ai-analytics/student-feedback', params);
  return response.data;
};

// AI Quiz Features

export const aiGenerateQuiz = async (params: {
  lessonId: string;
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[];
  focusAreas?: string[];
  bloomLevel?: string;
}) => {
  const response = await api.post('/assessments/ai/generate-quiz', params);
  return response.data;
};

export const getIntelligentFeedback = async (params: {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  questionText: string;
  questionType: string;
  lessonContext?: string;
}) => {
  const response = await api.post('/assessments/ai/feedback', params);
  return response.data;
};

export const calculateAdaptiveDifficulty = async (params: {
  currentDifficulty: number;
  recentPerformance: number[];
  timeSpent: number[];
}) => {
  const response = await api.post('/assessments/ai/adaptive-difficulty', params);
  return response.data;
};

export const gradeShortAnswer = async (params: {
  question: string;
  studentAnswer: string;
  modelAnswer: string;
  rubric?: string;
  maxPoints: number;
}) => {
  const response = await api.post('/assessments/ai/grade-short-answer', params);
  return response.data;
};

export const generateHints = async (
  questionText: string,
  correctAnswer: string,
  hintLevel: 1 | 2 | 3
) => {
  const response = await api.post('/assessments/ai/hints', {
    questionText,
    correctAnswer,
    hintLevel,
  });
  return response.data;
};

export const detectMisconceptions = async (params: {
  questionId: string;
  wrongAnswers: Array<{ answer: string; frequency: number }>;
  correctAnswer: string;
  questionText: string;
}) => {
  const response = await api.post('/assessments/ai/detect-misconceptions', params);
  return response.data;
};

export default {
  // Predictive Analytics
  predictCompletion,
  getAtRiskProfile,
  forecastSkillMastery,
  generateOptimalSchedule,
  
  // Teaching Assistant
  getClassAnalytics,
  generateDiscussionPrompts,
  respondToFAQ,
  analyzeContentQuality,
  generateStudentFeedback,
  
  // AI Quiz
  aiGenerateQuiz,
  getIntelligentFeedback,
  calculateAdaptiveDifficulty,
  gradeShortAnswer,
  generateHints,
  detectMisconceptions,
};
