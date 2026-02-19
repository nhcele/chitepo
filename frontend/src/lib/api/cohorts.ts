import { apiClient } from './client';
import { User, UserRole } from '@mindelta/shared';

export type CohortStatus =
  | 'upcoming'
  | 'open_for_enrollment'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CohortQuarter = 'q1' | 'q2' | 'q3' | 'q4';

export type CohortTrack =
  | 'dcc_training'
  | 'local_government'
  | 'rural_development'
  | 'traditional_leadership'
  | 'judicial_officers'
  | 'general_ideology'
  | 'diaspora_virtual';

export type CohortPacingMode = 'cohort_paced' | 'self_paced' | 'hybrid';

export interface OnboardingChecklistItem {
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface CohortEnrollment {
  id: string;
  cohortId: string;
  userId: string;
  mentorId?: string | null;
  status: 'enrolled' | 'active' | 'completed' | 'withdrawn' | 'failed';
  enrolledAt?: string;
  completedAt?: string | null;
  attendancePercentage?: number | null;
  finalScore?: number | null;
  onboardingChecklist?: OnboardingChecklistItem[] | null;
  notes?: string | null;
  user?: User;
}

export interface TrainingCohort {
  id: string;
  name: string;
  track: CohortTrack;
  quarter: CohortQuarter;
  year: number;
  status: CohortStatus;
  description?: string;
  startDate: string;
  endDate: string;
  enrollmentOpenDate: string;
  enrollmentCloseDate: string;
  maxParticipants: number;
  currentParticipants: number;
  isMandatory: boolean;
  mandatoryFor?: string;
  isVirtual: boolean;
  meetingSchedule?: string;
  venue?: string;
  pacingMode?: CohortPacingMode;
  weeklyTargetMinutes?: number | null;
  instructorId?: string;
  courseIds?: string[];
  cost: number;
  prerequisites?: string[];
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  instructor?: User;
  enrollments?: CohortEnrollment[];
}

export async function listCohorts(filters?: {
  track?: CohortTrack;
  quarter?: CohortQuarter;
  year?: number;
  status?: CohortStatus;
}): Promise<TrainingCohort[]> {
  const res = await apiClient.get<TrainingCohort[]>('/cohorts', { params: filters || {} });
  return res || [];
}

export async function getCohort(cohortId: string): Promise<TrainingCohort> {
  return apiClient.get<TrainingCohort>(`/cohorts/${cohortId}`);
}

export async function assignMentor(
  cohortId: string,
  userId: string,
  mentorId: string,
): Promise<CohortEnrollment> {
  return apiClient.post<CohortEnrollment>(`/cohorts/${cohortId}/mentor`, {
    userId,
    mentorId,
  });
}

export async function updateOnboardingChecklist(
  cohortId: string,
  userId: string,
  checklist: OnboardingChecklistItem[],
): Promise<CohortEnrollment> {
  return apiClient.patch<CohortEnrollment>(`/cohorts/${cohortId}/onboarding/${userId}`, {
    checklist,
  });
}

export async function updateCohortPacing(
  cohortId: string,
  payload: { pacingMode?: CohortPacingMode; weeklyTargetMinutes?: number | null },
): Promise<TrainingCohort> {
  return apiClient.patch<TrainingCohort>(`/cohorts/${cohortId}/pacing`, payload);
}

export function getUserLabel(user: User | undefined): string {
  if (!user) return 'Unknown user';
  const role = user.role ? ` • ${user.role.replace('_', ' ')}` : '';
  return `${user.name || user.email}${role}`;
}

export function isMentorRole(role: UserRole): boolean {
  return role === UserRole.INSTRUCTOR || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}
