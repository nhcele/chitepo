import { apiClient } from './client';

export interface GamificationBadge {
  code: string;
  name: string;
  description: string;
  threshold: number;
}

export interface GamificationSummary {
  userId: string;
  points: number;
  stats: { lessons: number; courses: number; liveSessions: number };
  badges: GamificationBadge[];
  nextBadge: GamificationBadge | null;
  suggestions: string[];
  cohortNormalization?: Array<{
    cohortId: string;
    cohortName: string;
    averagePoints: number;
    percentile: number;
    normalizedScore: number;
    memberCount: number;
  }>;
}

export async function getGamificationSummary(userId: string): Promise<GamificationSummary> {
  return apiClient.get<GamificationSummary>(`/api/gamification/summary/${userId}`);
}

export async function recomputeGamification(userId: string): Promise<GamificationSummary> {
  return apiClient.post<GamificationSummary>(`/api/gamification/recompute/${userId}`, {});
}

export async function awardGamification(
  userId: string,
  deltaPoints: number,
  badgeCodes?: string[],
): Promise<GamificationSummary> {
  return apiClient.post<GamificationSummary>(`/api/gamification/award`, {
    userId,
    deltaPoints,
    badgeCodes,
  });
}
