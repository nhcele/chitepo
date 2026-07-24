import { Course } from '@mindelta/shared';
import { apiClient } from './client';

export async function listCourses(): Promise<Course[]> {
  // Backend returns an array directly
  const res = await apiClient.get<Course[]>('/courses');
  return res;
}

export async function getCourse(id: string): Promise<Course> {
  const res = await apiClient.get<Course>(`/courses/${id}`);
  return res;
}

export async function searchCourses(q: string): Promise<Course[]> {
  const res = await apiClient.get<Course[]>(`/courses/search`, { params: { q } });
  return res;
}

export interface LessonAccessResponse {
  hasAccess: boolean;
  reason?: string;
  requiresPreviousLesson?: boolean;
  previousLessonId?: string;
  requiresQuizScore?: number;
  currentBestScore?: number;
}

export async function checkLessonAccess(courseId: string, lessonId: string): Promise<LessonAccessResponse> {
  const res = await apiClient.get<LessonAccessResponse>(`/courses/${courseId}/lessons/${lessonId}/access`);
  return res;
}

export async function updateLessonProgress(lessonId: string, data: {
  watchPercent?: number;
  quizScore?: number;
  isCompleted?: boolean;
}): Promise<any> {
  const res = await apiClient.post(`/courses/lessons/${lessonId}/progress`, data);
  return res;
}
