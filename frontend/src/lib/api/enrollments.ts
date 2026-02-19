import { apiClient } from './client';
import { Enrollment } from '@mindelta/shared';

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  return apiClient.post<Enrollment>(`/api/courses/${courseId}/enroll`);
}

export async function getMyEnrollmentForCourse(courseId: string): Promise<Enrollment | null> {
  try {
    return await apiClient.get<Enrollment>(`/api/courses/${courseId}/enrollment`);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function listMyEnrollments(): Promise<Enrollment[]> {
  return apiClient.get<Enrollment[]>(`/api/me/enrollments`);
}

export async function updateEnrollmentProgress(enrollmentId: string, progressPercent: number, lastLessonSeenAt?: Date): Promise<Enrollment> {
  return apiClient.patch<Enrollment>(`/api/enrollments/${enrollmentId}/progress`, {
    progressPercent,
    lastLessonSeenAt: lastLessonSeenAt ? lastLessonSeenAt.toISOString() : undefined,
  });
}
