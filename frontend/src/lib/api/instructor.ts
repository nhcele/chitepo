import { apiClient } from './client';

export interface InstructorCourse {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface Paginated<T> { items: T[]; total: number }

// New DTOs for Course Builder v2 (manual + reuse)
export interface ModuleDTO {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  estimated_duration_min?: number;
  tags?: string[];
  author_id?: string;
  visibility?: 'public' | 'private' | 'shared';
  usageCount?: number; // optional: times reused across courses
}

export interface LessonDTO {
  id: string;
  module_id: string;
  title: string;
  content?: string;
  contentUrl?: string;
  content_json?: any;
  video_url?: string;
  videoDuration?: number;
  durationSeconds?: number;
  durationMinutes?: number;
  estimatedDurationMin?: number;
  isPublished?: boolean;
  hasQuiz?: boolean;
  quiz_json?: any;
  transcript?: string;
  resourceLinks?: Array<{ title: string; url: string }>;
  completionMode?: 'required' | 'optional' | 'manual';
  minimumWatchPercent?: number;
  minimumQuizScore?: number;
  order_within_module?: number;
}

export interface CourseModuleLinkDTO {
  course_id: string;
  module_id: string;
  sort_order: number;
  is_required?: boolean;
}

export async function instructorApply(payload: any): Promise<{ status: string }>
{
  return apiClient.post(`/instructor/apply`, payload);
}

export async function instructorListCourses(): Promise<Paginated<InstructorCourse>> {
  return apiClient.get<Paginated<InstructorCourse>>(`/instructor/courses`);
}

export async function instructorGetCourse(id: string): Promise<InstructorCourse> {
  return apiClient.get<InstructorCourse>(`/instructor/courses/${id}`);
}

export async function instructorCreateCourse(payload: Partial<InstructorCourse>): Promise<InstructorCourse> {
  return apiClient.post<InstructorCourse>(`/instructor/courses`, payload);
}

export async function instructorUpdateCourse(id: string, payload: Partial<InstructorCourse>): Promise<InstructorCourse> {
  return apiClient.patch<InstructorCourse>(`/instructor/courses/${id}`, payload);
}

export async function instructorSubmitCourse(id: string): Promise<{ status: string }>{
  return apiClient.post<{ status: string }>(`/instructor/courses/${id}/submit`, {});
}

export async function instructorGetCourseAnalytics(courseId: string): Promise<any> {
  return apiClient.get<any>(`/instructor/analytics/${courseId}`);
}

export interface InstructorActivityDTO {
  id: string;
  type: 'enrollment' | 'completion' | 'review' | 'purchase' | 'lesson';
  title: string;
  description: string;
  course?: string;
  timestamp: string;
}

export interface InstructorMetricsDTO {
  publishedCourses: number;
  totalLearners: number;
  monthlyRevenue: number;
  averageRating?: number | null;
  coursePerformance?: Array<{ name: string; students: number; completion: number; revenue: number }>;
  recentActivity?: InstructorActivityDTO[];
}

export async function instructorGetMetrics(): Promise<InstructorMetricsDTO> {
  return apiClient.get<InstructorMetricsDTO>(`/instructor/metrics`);
}

// ---------- Module Library & Lessons (safe stubs) ----------
export async function listModules(params?: { search?: string; author_id?: string; page?: number; pageSize?: number }): Promise<Paginated<ModuleDTO>> {
  // Backend endpoint suggestion: GET /modules?search=&author_id=&page=&pageSize=
  return apiClient.get<Paginated<ModuleDTO>>(`/modules`, { params });
}

export async function createModule(payload: Partial<ModuleDTO>): Promise<ModuleDTO> {
  // POST /modules
  return apiClient.post<ModuleDTO>(`/modules`, payload);
}

export async function linkCourseModule(courseId: string, payload: { module_id: string; sort_order: number; is_required?: boolean }): Promise<CourseModuleLinkDTO> {
  // POST /courses/{id}/modules
  return apiClient.post<CourseModuleLinkDTO>(`/courses/${courseId}/modules`, payload);
}

export async function updateCourseModule(courseId: string, moduleId: string, payload: { sort_order?: number; is_required?: boolean }): Promise<CourseModuleLinkDTO> {
  // PATCH /courses/{id}/modules/{mid}
  return apiClient.patch<CourseModuleLinkDTO>(`/courses/${courseId}/modules/${moduleId}`, payload);
}

export async function unlinkCourseModule(courseId: string, moduleId: string): Promise<{ status: string }> {
  // DELETE /courses/{id}/modules/{mid}
  return apiClient.delete<{ status: string }>(`/courses/${courseId}/modules/${moduleId}`);
}

export async function createLesson(moduleId: string, payload: Partial<LessonDTO>): Promise<LessonDTO> {
  // POST /modules/{id}/lessons
  return apiClient.post<LessonDTO>(`/modules/${moduleId}/lessons`, payload);
}

export async function updateLesson(lessonId: string, payload: Partial<LessonDTO>): Promise<LessonDTO> {
  // PATCH /lessons/{id}
  return apiClient.patch<LessonDTO>(`/lessons/${lessonId}`, payload);
}

export async function deleteLesson(lessonId: string): Promise<{ status: string }> {
  // DELETE /lessons/{id}
  return apiClient.delete<{ status: string }>(`/lessons/${lessonId}`);
}

export async function reorderLessons(moduleId: string, lessons: { lessonId: string; orderIndex: number }[]): Promise<{ status: string }> {
  // POST /lessons/reorder
  return apiClient.post<{ status: string }>(`/lessons/reorder`, { moduleId, lessons });
}

export async function snapshotModule(moduleId: string): Promise<ModuleDTO> {
  // POST /modules/{id}/snapshot
  return apiClient.post<ModuleDTO>(`/modules/${moduleId}/snapshot`, {});
}

export async function snapshotCourseModules(courseId: string): Promise<{ status: string; snapshots: number }> {
  // POST /courses/{id}/snapshot-modules
  return apiClient.post<{ status: string; snapshots: number }>(`/courses/${courseId}/snapshot-modules`, {});
}

// ---------- AI outline (safe stub) ----------
export async function generateCourseOutline(prompt: string): Promise<{ modules: Array<{ title: string; lessons: Array<{ title: string }> }> }>{
  // POST /courses/ai-generate { prompt }
  return apiClient.post(`/courses/ai-generate`, { prompt });
}
