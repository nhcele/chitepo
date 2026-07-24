import { apiClient } from './client';
import { AnalyticsEventType, CreateAnalyticsEventDto } from '@mindelta/shared';

export interface UserProgressSummary {
  totalEvents: number;
  lessonsCompleted: number;
  quizzesAttempted: number;
  lastActivity?: string;
  streakDays: number;
}

export async function getUserProgress(userId: string): Promise<UserProgressSummary> {
  // Backend returns the object directly; apiClient already returns response.data
  const res = await apiClient.get<UserProgressSummary>(`/analytics/user/${userId}/progress`);
  return res;
}

export async function trackEvent(partial: Partial<CreateAnalyticsEventDto> & { eventType: AnalyticsEventType }): Promise<void> {
  try {
    await apiClient.post(`/analytics/events`, partial);
  } catch (e) {
    // swallow errors — analytics should never break UX
  }
}

export { AnalyticsEventType };

export interface CourseSummary {
  courseId: string;
  enrollments: number;
  lessonCompletions: number;
  quizCompleted: number;
  passRate: number; // 0..1
  avgAttemptsPerLearner: number;
  active7d: number;
  active30d: number;
  lastActivity?: string;
}

export async function getCourseSummary(courseId: string): Promise<CourseSummary> {
  return apiClient.get<CourseSummary>(`/analytics/course/${courseId}/summary`);
}

export interface LiveSessionSummary {
  sessionId: string;
  counts: {
    joined: number;
    left: number;
    attendanceRecorded: number;
  };
  startedAt?: string;
  endedAt?: string;
}

export async function getLiveSessionSummary(sessionId: string): Promise<LiveSessionSummary> {
  return apiClient.get<LiveSessionSummary>(`/analytics/live-session/${sessionId}/summary`);
}

export interface InstructorSummary {
  instructorId: string;
  courseStats: Array<{
    courseId: string;
    enrollments: number;
    lessonCompletions: number;
    quizCompleted: number;
    passRate: number;
    avgAttemptsPerLearner: number;
    active30d: number;
  }>;
  totals: { enrollments: number; active30d: number };
}

export async function getInstructorSummary(instructorId: string): Promise<InstructorSummary> {
  return apiClient.get<InstructorSummary>(`/analytics/instructor/${instructorId}/summary`);
}
