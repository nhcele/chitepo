import { Course } from '@mindelta/shared';
import { apiClient } from './client';

export async function listCourses(): Promise<Course[]> {
  // Backend returns an array directly
  const res = await apiClient.get<Course[]>('/api/courses');
  return res;
}

export async function getCourse(id: string): Promise<Course> {
  const res = await apiClient.get<Course>(`/api/courses/${id}`);
  return res;
}

export async function searchCourses(q: string): Promise<Course[]> {
  const res = await apiClient.get<Course[]>(`/api/courses/search`, { params: { q } });
  return res;
}
