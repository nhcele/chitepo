import { apiClient } from './client';
import {
  AssessmentAttemptView,
  AttemptItem,
  LearningObjective,
  QuestionBankItem,
  Quiz,
  QuizAttempt,
  QuizItemAnalysis,
} from '@mindelta/shared';

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

export interface QuizAssessmentSummary {
  quizId: string;
  totalAttempts: number;
  inProgressAttempts: number;
  pendingGradingAttempts: number;
  finalizedAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number;
  averageScore: number | null;
  averageTimeSpentSeconds: number | null;
}

export async function getQuizAssessmentSummary(quizId: string): Promise<QuizAssessmentSummary> {
  return apiClient.get<QuizAssessmentSummary>(`/assessments/quizzes/${quizId}/summary`);
}

export async function getQuizItemAnalysis(quizId: string): Promise<QuizItemAnalysis> {
  return apiClient.get<QuizItemAnalysis>(`/assessments/quizzes/${quizId}/item-analysis`);
}

export async function listLearningObjectives(courseId: string): Promise<LearningObjective[]> {
  return apiClient.get<LearningObjective[]>(`/assessments/objectives`, { params: { courseId } });
}

export async function upsertLearningObjective(payload: {
  id?: string;
  courseId: string;
  code?: string;
  title: string;
  description?: string;
}): Promise<LearningObjective> {
  return apiClient.post<LearningObjective>(`/assessments/objectives`, payload);
}

export async function listQuestionBankItems(params: {
  courseId: string;
  objectiveId?: string;
  search?: string;
  includeArchived?: boolean;
}): Promise<QuestionBankItem[]> {
  return apiClient.get<QuestionBankItem[]>(`/assessments/question-bank`, { params });
}

export async function upsertQuestionBankItem(payload: {
  id?: string;
  courseId: string;
  objectiveId?: string | null;
  questionType?: string;
  type?: string;
  questionText?: string;
  stem?: string;
  options?: string[] | null;
  correctAnswer: string | number;
  explanation?: string | null;
  points?: number;
  difficulty?: string | null;
  tags?: string[] | null;
}): Promise<QuestionBankItem> {
  return apiClient.post<QuestionBankItem>(`/assessments/question-bank`, payload);
}

export async function archiveQuestionBankItem(id: string, courseId: string): Promise<{ status: string }> {
  return apiClient.post<{ status: string }>(`/assessments/question-bank/${id}/archive`, { courseId });
}

export async function importQuestionBankItemToQuiz(
  id: string,
  payload: { quizId: string; orderIndex?: number },
): Promise<any> {
  return apiClient.post(`/assessments/question-bank/${id}/import`, payload);
}

export async function getMyQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  return apiClient.get<QuizAttempt[]>(`/assessments/attempts/me/${quizId}`);
}

export async function submitQuizAttempt(quizId: string, answers: Record<string, string | number | (string | number)[]>): Promise<QuizAttempt> {
  return apiClient.post<QuizAttempt>(`/assessments/attempts`, {
    quizId,
    answers,
  });
}

export async function startAssessmentAttempt(quizId: string, idempotencyKey?: string): Promise<AssessmentAttemptView> {
  return apiClient.post<AssessmentAttemptView>(`/assessments/attempts/start`, {
    quizId,
    idempotencyKey,
  });
}

export async function resumeAssessmentAttempt(attemptId: string): Promise<AssessmentAttemptView> {
  return apiClient.get<AssessmentAttemptView>(`/assessments/attempts/${attemptId}`);
}

export async function saveAttemptAnswer(
  attemptId: string,
  questionId: string,
  answer: string | number | (string | number)[] | null,
  expectedRevision?: number,
): Promise<AttemptItem> {
  return apiClient.put<AttemptItem>(`/assessments/attempts/${attemptId}/answers/${questionId}`, {
    answer,
    expectedRevision,
  });
}

export async function submitAssessmentAttempt(attemptId: string, idempotencyKey?: string): Promise<QuizAttempt> {
  return apiClient.post<QuizAttempt>(`/assessments/attempts/${attemptId}/submit`, {
    idempotencyKey,
  });
}

export async function listPendingGradingAttempts(quizId?: string): Promise<AssessmentAttemptView[]> {
  return apiClient.get<AssessmentAttemptView[]>(`/assessments/grading/pending`, {
    params: quizId ? { quizId } : undefined,
  });
}

export async function getAttemptForGrading(attemptId: string): Promise<AssessmentAttemptView> {
  return apiClient.get<AssessmentAttemptView>(`/assessments/attempts/${attemptId}/grading`);
}

export async function gradeAttemptItem(
  attemptId: string,
  itemId: string,
  grade: { pointsEarned: number; isCorrect?: boolean; feedback?: string },
): Promise<QuizAttempt> {
  return apiClient.post<QuizAttempt>(`/assessments/attempts/${attemptId}/items/${itemId}/grade`, grade);
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
    objectiveId?: string | null;
    bankItemId?: string | null;
    difficulty?: string | null;
    tags?: string[] | null;
  }>;
}): Promise<Quiz> {
  return apiClient.post<Quiz>(`/assessments/quizzes/upsert`, payload);
}

export async function publishQuiz(quizId: string): Promise<Quiz> {
  return apiClient.post<Quiz>(`/assessments/quizzes/${quizId}/publish`);
}

export async function unpublishQuiz(quizId: string): Promise<Quiz> {
  return apiClient.post<Quiz>(`/assessments/quizzes/${quizId}/unpublish`);
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

export interface KnowledgeCheckQuiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    stem: string;
    type: string;
    options?: string[];
    orderIndex?: number;
  }>;
}

export interface KnowledgeCheckAnswerResult {
  questionId: string;
  isCorrect: boolean;
  explanation: string | null;
  correctAnswer: string | null;
}

export async function getKnowledgeCheck(lessonId: string): Promise<KnowledgeCheckQuiz | null> {
  try {
    return await apiClient.get<KnowledgeCheckQuiz>(`/assessments/lessons/${lessonId}/knowledge-check`);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function submitKnowledgeCheckAnswer(
  lessonId: string,
  payload: { questionId: string; answer: string | number },
): Promise<KnowledgeCheckAnswerResult> {
  return apiClient.post<KnowledgeCheckAnswerResult>(`/assessments/lessons/${lessonId}/knowledge-check/submit`, payload);
}
