import { apiClient } from './client';

export interface Note {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  videoTimestampSeconds?: number;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lesson?: { id: string; title?: string };
  course?: { id: string; title?: string };
}

export interface CreateNoteDto {
  courseId?: string;
  lessonId?: string;
  videoTimestampSeconds?: number;
  title?: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteDto {
  videoTimestampSeconds?: number;
  title?: string;
  content?: string;
  tags?: string[];
}

export async function listMyNotes(params?: { courseId?: string; lessonId?: string }): Promise<Note[]> {
  const query = new URLSearchParams();
  if (params?.courseId) query.set('courseId', params.courseId);
  if (params?.lessonId) query.set('lessonId', params.lessonId);
  const qs = query.toString();
  return apiClient.get<Note[]>(`/me/notes${qs ? `?${qs}` : ''}`);
}

export async function createNote(dto: CreateNoteDto): Promise<Note> {
  return apiClient.post<Note>('/me/notes', dto);
}

export async function updateNote(noteId: string, dto: UpdateNoteDto): Promise<Note> {
  return apiClient.patch<Note>(`/me/notes/${noteId}`, dto);
}

export async function deleteNote(noteId: string): Promise<{ deleted: boolean }> {
  return apiClient.delete(`/me/notes/${noteId}`);
}
