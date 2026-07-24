import { apiClient } from './client';
import { Quiz, QuizAttempt } from '@mindelta/shared';

export async function getQuizByLesson(lessonId: string): Promise<Quiz | null> {
  try {
    return await apiClient.get<Quiz>(`/assessments/quizzes/by-lesson/${lessonId}`);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function getQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
  return apiClient.get<Quiz[]>(`/assessments/quizzes/by-lesson/${lessonId}/all`);
}

export async function getQuizById(quizId: string): Promise<Quiz> {
  return apiClient.get<Quiz>(`/assessments/quizzes/${quizId}`);
}

export async function getMyQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  return apiClient.get<QuizAttempt[]>(`/assessments/attempts/me/${quizId}`);
}

export async function submitQuizAttempt(quizId: string, answers: Record<string, string | number>): Promise<QuizAttempt> {
  return apiClient.post<QuizAttempt>(`/assessments/attempts`, {
    quizId,
    answers,
  });
}

export async function upsertQuizWithQuestions(payload: {
  quizId?: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  retakeCooldownHours?: number;
  isPublished?: boolean;
  questions: Array<{
    id?: string;
    type: string;
    stem: string;
    options?: string[];
    correctAnswer: string | number;
    explanation?: string;
    points?: number;
    orderIndex?: number;
  }>;
}): Promise<Quiz> {
  return apiClient.post<Quiz>(`/assessments/quizzes/upsert`, payload);
}

export async function generateAndSaveAiQuiz(payload: {
  lessonId: string;
  moduleId?: string;
  questionCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionTypes?: ('multiple-choice' | 'true-false' | 'short-answer')[];
  focusAreas?: string[];
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  title?: string;
  description?: string;
  onlyIfMissing?: boolean;
}): Promise<Quiz> {
  return apiClient.post<Quiz>(`/assessments/ai/generate-quiz-and-save`, payload);
}

export interface GradeResult {
  total: number;
  correct: number;
  score: number;
  results: Array<{ questionId: string; isCorrect: boolean; graded: boolean; explanation?: string | null }>;
}

export async function gradeQuestions(
  items: Array<{ questionId: string; answer: string | number }>,
): Promise<GradeResult> {
  return apiClient.post<GradeResult>(`/assessments/grade`, { items });
}
