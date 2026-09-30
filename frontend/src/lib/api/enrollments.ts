import { apiClient } from './client';
import { Enrollment } from '@mindelta/shared';

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  return apiClient.post<Enrollment>(`/courses/${courseId}/enroll`);
}

export async function getMyEnrollmentForCourse(courseId: string): Promise<Enrollment | null> {
  try {
    return await apiClient.get<Enrollment>(`/courses/${courseId}/enrollment`);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function listMyEnrollments(): Promise<Enrollment[]> {
  return apiClient.get<Enrollment[]>(`/me/enrollments`);
}

export async function updateEnrollmentProgress(enrollmentId: string, lastLessonSeenAt?: Date): Promise<Enrollment> {
  return apiClient.patch<Enrollment>(`/enrollments/${enrollmentId}/progress`, {
    lastLessonSeenAt: lastLessonSeenAt ? lastLessonSeenAt.toISOString() : undefined,
  });
}

export interface ContinuePoint {
  courseId: string;
  moduleId: string | null;
  moduleTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  videoPositionSeconds: number;
  isCompleted: boolean;
}

export async function getEnrollmentContinuePoint(enrollmentId: string): Promise<ContinuePoint> {
  return apiClient.get<ContinuePoint>(`/me/enrollments/${enrollmentId}/continue`);
}
