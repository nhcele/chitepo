import { apiClient } from './client';

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export async function generateQuizQuestions(courseContent: string, count: number = 3): Promise<GeneratedQuestion[]> {
  const res = await apiClient.post<{ questions: GeneratedQuestion[] }>(
    '/api/ai-companion/generate-quiz',
    { courseContent, count },
    { timeout: 60000 } // 60 seconds for AI generation
  );
  return res.questions || [];
}

export type AiMode = 'answer' | 'summarize' | 'explain';

export interface ChatRequest {
  lessonId: string;
  mode: AiMode;
  level?: 5 | 15 | 25;
  message?: string;
}

export interface ChatResponse {
  text: string;
  sources: string[];
  remaining: number;
}

export async function aiChat(req: ChatRequest): Promise<ChatResponse> {
  return apiClient.post<ChatResponse>('/api/ai-companion/chat', req);
}

export async function getAiUsage(): Promise<{ remaining: number; limit: number }> {
  return apiClient.get<{ remaining: number; limit: number }>('/api/ai-companion/usage');
}

export async function provideFeedback(data: {
  userAnswer: string;
  correctAnswer: string;
  question: string;
}): Promise<{ feedback: string }> {
  return apiClient.post<{ feedback: string }>('/api/ai-companion/feedback', data);
}

export async function suggestLearningPath(data: {
  userProfile: any;
  completedCourses: string[];
}): Promise<{ suggestions: string[] }> {
  return apiClient.post<{ suggestions: string[] }>('/api/ai-companion/learning-path', data);
}

export async function explainConcept(data: {
  concept: string;
  context?: string;
}): Promise<{ explanation: string }> {
  return apiClient.post<{ explanation: string }>('/api/ai-companion/explain', data);
}

export interface LearningRecommendation {
  type: 'course' | 'lesson' | 'exercise' | 'resource';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ProgressInsight {
  area: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
  nextSteps: string[];
}

export async function getPersonalizedRecommendations(userId: string): Promise<LearningRecommendation[]> {
  return apiClient.get<LearningRecommendation[]>(`/api/ai-companion/recommendations/${userId}`);
}

export async function getProgressInsights(userId: string): Promise<ProgressInsight[]> {
  return apiClient.get<ProgressInsight[]>(`/api/ai-companion/insights/${userId}`);
}

export async function adaptDifficulty(data: {
  userId: string;
  lessonId: string;
  performance: number;
}): Promise<{ adjustedLevel: number; reasoning: string }> {
  return apiClient.post<{ adjustedLevel: number; reasoning: string }>('/api/ai-companion/adaptive-difficulty', data);
}
