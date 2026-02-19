import { apiClient } from './client';

export interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  matchScore: number;
  reason: string;
  estimatedDuration: number;
  skills: string[];
  tags: string[];
}

export interface LearningPathRecommendation {
  courseId: string;
  title: string;
  order: number;
  reason: string;
  prerequisites: string[];
}

export interface NextBestModuleRecommendation {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  nextLesson?: {
    lessonId: string;
    title: string;
    orderIndex: number;
    type: string;
    hasQuiz: boolean;
  };
  reason: string;
  aiReason?: string;
  tips?: string[];
  source: 'rules' | 'rules+ai';
}

export interface NextBestModuleResponse {
  recommendation: NextBestModuleRecommendation | null;
  reason?: string;
}

export const recommendationsApi = {
  getPersonalized: async (limit: number = 10): Promise<CourseRecommendation[]> => {
    return apiClient.get<CourseRecommendation[]>('/recommendations/personalized', {
      params: { limit },
    });
  },

  getLearningPath: async (): Promise<LearningPathRecommendation[]> => {
    return apiClient.get<LearningPathRecommendation[]>('/recommendations/learning-path');
  },

  getStrugglingStudentRecommendations: async (): Promise<CourseRecommendation[]> => {
    return apiClient.get<CourseRecommendation[]>('/recommendations/struggling');
  },

  getNextBestModule: async (courseId?: string): Promise<NextBestModuleResponse> => {
    return apiClient.get<NextBestModuleResponse>('/recommendations/next-module', {
      params: courseId ? { courseId } : {},
    });
  },
};

