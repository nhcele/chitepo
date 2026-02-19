import { apiClient } from './client';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SessionType {
  PHYSICAL = 'physical',
  HYBRID = 'hybrid',
  VIRTUAL = 'virtual',
}

export interface ClassroomSession {
  id: string;
  title: string;
  description?: string;
  sessionCode: string;
  trainerId: string;
  courseId?: string;
  lessonId?: string;
  type: SessionType;
  status: SessionStatus;
  scheduledStart: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  venue?: string;
  maxParticipants: number;
  isSynchronized: boolean;
  allowRemoteJoin: boolean;
  settings?: {
    showProgressToTrainer?: boolean;
    allowQuestions?: boolean;
    recordSession?: boolean;
    autoAdvance?: boolean;
  };
  notes?: string;
  trainer?: {
    id: string;
    name: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  participants?: ClassroomSessionParticipant[];
}

export interface ClassroomSessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
  isPhysical: boolean;
  currentLessonId?: string;
  progressPercentage: number;
  lastActivityAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SessionStats {
  totalParticipants: number;
  physicalParticipants: number;
  remoteParticipants: number;
  averageProgress: number;
  maxParticipants: number;
  sessionStatus: SessionStatus;
}

export interface CreateSessionDto {
  title: string;
  description?: string;
  courseId?: string;
  lessonId?: string;
  type: SessionType;
  scheduledStart: string;
  scheduledEnd?: string;
  venue?: string;
  maxParticipants?: number;
  allowRemoteJoin?: boolean;
  settings?: any;
}

/**
 * Create a new classroom session (trainer only)
 */
export async function createSession(data: CreateSessionDto): Promise<ClassroomSession> {
  return apiClient.post<ClassroomSession>('/classroom-sessions', data);
}

/**
 * Get trainer's sessions
 */
export async function getTrainerSessions(filters?: {
  status?: SessionStatus;
  type?: SessionType;
  upcoming?: boolean;
}): Promise<ClassroomSession[]> {
  const params: any = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.type) params.type = filters.type;
  if (filters?.upcoming !== undefined) params.upcoming = filters.upcoming;

  return apiClient.get<ClassroomSession[]>('/classroom-sessions/trainer/my-sessions', {
    params,
  });
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<ClassroomSession> {
  return apiClient.get<ClassroomSession>(`/classroom-sessions/${sessionId}`);
}

/**
 * Get a session by code (for students to join)
 */
export async function getSessionByCode(sessionCode: string): Promise<ClassroomSession> {
  return apiClient.get<ClassroomSession>(`/classroom-sessions/code/${sessionCode}`);
}

/**
 * Join a session
 */
export async function joinSession(
  sessionCode: string,
  isPhysical: boolean = false,
): Promise<ClassroomSessionParticipant> {
  return apiClient.post<ClassroomSessionParticipant>('/classroom-sessions/join', {
    sessionCode,
    isPhysical,
  });
}

/**
 * Leave a session
 */
export async function leaveSession(sessionId: string): Promise<void> {
  await apiClient.post(`/classroom-sessions/${sessionId}/leave`);
}

/**
 * Start a session (trainer only)
 */
export async function startSession(sessionId: string): Promise<ClassroomSession> {
  return apiClient.post<ClassroomSession>(`/classroom-sessions/${sessionId}/start`);
}

/**
 * Pause a session (trainer only)
 */
export async function pauseSession(sessionId: string): Promise<ClassroomSession> {
  return apiClient.post<ClassroomSession>(`/classroom-sessions/${sessionId}/pause`);
}

/**
 * End a session (trainer only)
 */
export async function endSession(sessionId: string): Promise<ClassroomSession> {
  return apiClient.post<ClassroomSession>(`/classroom-sessions/${sessionId}/end`);
}

/**
 * Cancel a session (trainer only)
 */
export async function cancelSession(sessionId: string): Promise<ClassroomSession> {
  return apiClient.delete<ClassroomSession>(`/classroom-sessions/${sessionId}`);
}

/**
 * Update current lesson (trainer only)
 */
export async function updateCurrentLesson(
  sessionId: string,
  lessonId: string,
): Promise<ClassroomSession> {
  return apiClient.patch<ClassroomSession>(`/classroom-sessions/${sessionId}/lesson`, {
    lessonId,
  });
}

/**
 * Update participant progress
 */
export async function updateProgress(
  sessionId: string,
  progressPercentage: number,
  lessonId?: string,
): Promise<ClassroomSessionParticipant> {
  return apiClient.patch<ClassroomSessionParticipant>(`/classroom-sessions/${sessionId}/progress`, {
    progressPercentage,
    lessonId,
  });
}

/**
 * Get session participants (trainer only)
 */
export async function getSessionParticipants(
  sessionId: string,
): Promise<ClassroomSessionParticipant[]> {
  return apiClient.get<ClassroomSessionParticipant[]>(
    `/classroom-sessions/${sessionId}/participants`,
  );
}

/**
 * Get session statistics (trainer only)
 */
export async function getSessionStats(sessionId: string): Promise<SessionStats> {
  return apiClient.get<SessionStats>(`/classroom-sessions/${sessionId}/stats`);
}

/**
 * Update session settings (trainer only)
 */
export async function updateSessionSettings(
  sessionId: string,
  settings: any,
): Promise<ClassroomSession> {
  return apiClient.patch<ClassroomSession>(`/classroom-sessions/${sessionId}/settings`, settings);
}

