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

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  watchPercent: number;
  lastPositionSeconds: number;
  watchedSeconds: number;
  activeSeconds: number;
  bestQuizScore?: number | null;
  quizAttempts: number;
  lastQuizAttemptAt?: string | null;
  completedAt?: string | null;
}

export async function checkLessonAccess(courseId: string, lessonId: string): Promise<LessonAccessResponse> {
  const res = await apiClient.get<LessonAccessResponse>(`/courses/${courseId}/lessons/${lessonId}/access`);
  return res;
}

export async function updateLessonProgress(lessonId: string, data: {
  watchPercent?: number;
  lastPositionSeconds?: number;
  watchedSeconds?: number;
  activeSeconds?: number;
  manualComplete?: boolean;
}): Promise<LessonProgress> {
  const res = await apiClient.post<LessonProgress>(`/courses/lessons/${lessonId}/progress`, data);
  return res;
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  const res = await apiClient.get<LessonProgress | null>(`/courses/lessons/${lessonId}/progress`);
  return res;
}

export type CourseLessonProgressMap = Record<string, Pick<LessonProgress, 'isCompleted' | 'watchPercent' | 'lastPositionSeconds' | 'watchedSeconds'>>;

export async function getCourseLessonProgress(courseId: string): Promise<CourseLessonProgressMap> {
  const res = await apiClient.get<CourseLessonProgressMap>(`/courses/${courseId}/lesson-progress`);
  return res;
}
