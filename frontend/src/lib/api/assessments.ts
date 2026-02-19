import { apiClient } from './client';
import { Quiz, QuizAttempt } from '@mindelta/shared';

export async function getQuizByLesson(lessonId: string): Promise<Quiz | null> {
  try {
    return await apiClient.get<Quiz>(`/api/assessments/quizzes/by-lesson/${lessonId}`);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function getQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
  return apiClient.get<Quiz[]>(`/api/assessments/quizzes/by-lesson/${lessonId}/all`);
}

export async function getQuizById(quizId: string): Promise<Quiz> {
  return apiClient.get<Quiz>(`/api/assessments/quizzes/${quizId}`);
}

export async function getMyQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  return apiClient.get<QuizAttempt[]>(`/api/assessments/attempts/me/${quizId}`);
}

export async function submitQuizAttempt(quizId: string, answers: Record<string, string | number>): Promise<QuizAttempt> {
  return apiClient.post<QuizAttempt>(`/api/assessments/attempts`, {
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
  return apiClient.post<Quiz>(`/api/assessments/quizzes/upsert`, payload);
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
  return apiClient.post<Quiz>(`/api/assessments/ai/generate-quiz-and-save`, payload);
}
