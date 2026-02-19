import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType } from '@mindelta/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserGamification } from './entities/user-gamification.entity';
import { CohortEnrollment } from '../cohorts/entities/training-cohort.entity';

export interface Badge {
  code: string;
  name: string;
  description: string;
  threshold: number;
}

export interface GamificationStats {
  lessons: number;
  courses: number;
  liveSessions: number;
}

export interface CohortNormalization {
  cohortId: string;
  cohortName: string;
  averagePoints: number;
  percentile: number;
  normalizedScore: number;
  memberCount: number;
}

@Injectable()
export class GamificationService {
  private badges: Badge[] = [
    { code: 'starter', name: 'Starter', description: 'Earn 50 points', threshold: 50 },
    { code: 'pro', name: 'Pro', description: 'Earn 150 points', threshold: 150 },
    { code: 'expert', name: 'Expert', description: 'Earn 300 points', threshold: 300 },
  ];

  private readonly maxDailyPoints = 300;
  private readonly pointRules: Record<string, { points: number; dailyCap: number; minIntervalSeconds: number }> = {
    [AnalyticsEventType.LESSON_COMPLETED]: { points: 10, dailyCap: 200, minIntervalSeconds: 30 },
    [AnalyticsEventType.COURSE_COMPLETED]: { points: 20, dailyCap: 60, minIntervalSeconds: 60 },
    [AnalyticsEventType.LIVE_SESSION_JOINED]: { points: 5, dailyCap: 20, minIntervalSeconds: 300 },
    [AnalyticsEventType.LIVE_SESSION_ATTENDANCE_RECORDED]: { points: 5, dailyCap: 20, minIntervalSeconds: 300 },
  };

  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectRepository(UserGamification)
    private readonly userGamificationRepository: Repository<UserGamification>,
    @InjectRepository(CohortEnrollment)
    private readonly cohortEnrollmentRepository: Repository<CohortEnrollment>,
  ) {}

  async getUserSummary(userId: string) {
    return this.aggregateUser(userId, { full: false });
  }

  async recompute(userId: string) {
    return this.aggregateUser(userId, { full: true });
  }

  async aggregateAllUsers() {
    const records = await this.userGamificationRepository.find({ select: ['userId'] });
    let processed = 0;
    for (const record of records) {
      await this.aggregateUser(record.userId, { full: false });
      processed += 1;
    }
    return { processed };
  }

  async award(userId: string, deltaPoints: number, badgeCodes: string[] = []) {
    const record = await this.getOrCreateRecord(userId);

    record.points = Math.max(0, (record.points || 0) + deltaPoints);

    const earnedBadges = this.badges.filter((b) => record.points >= b.threshold);
    const badgeSet = new Set([...(record.badges || []).map((b) => b.code), ...badgeCodes, ...earnedBadges.map((b) => b.code)]);
    record.badges = Array.from(badgeSet).map((code) => ({ code, awardedAt: new Date().toISOString() }));

    await this.userGamificationRepository.save(record);

    const nextBadge = this.badges.find((b) => record.points < b.threshold) || null;
    const stats = record.stats || { lessons: 0, courses: 0, liveSessions: 0 };
    const cohortNormalization = await this.buildCohortNormalization(userId, record.points);

    return {
      userId,
      points: record.points,
      stats,
      badges: earnedBadges,
      nextBadge,
      suggestions: this.buildSuggestions(stats, nextBadge?.threshold ?? null),
      cohortNormalization,
    };
  }

  private async aggregateUser(userId: string, options: { full: boolean }) {
    const record = await this.getOrCreateRecord(userId);
    const since = options.full ? undefined : record.lastAggregatedAt || undefined;

    const events = await this.analyticsService.getEventsByUserSince(userId, since, 10000);
    const { pointsDelta, statsDelta, lastEventAt } = this.calculateDelta(events);

    if (options.full) {
      record.points = pointsDelta;
      record.stats = statsDelta;
    } else {
      const existingStats = record.stats || { lessons: 0, courses: 0, liveSessions: 0 };
      record.points = Math.max(0, (record.points || 0) + pointsDelta);
      record.stats = {
        lessons: existingStats.lessons + statsDelta.lessons,
        courses: existingStats.courses + statsDelta.courses,
        liveSessions: existingStats.liveSessions + statsDelta.liveSessions,
      };
    }

    if (lastEventAt) {
      record.lastAggregatedAt = lastEventAt;
    } else if (!record.lastAggregatedAt) {
      record.lastAggregatedAt = new Date();
    }

    const earnedBadges = this.badges.filter((b) => record.points >= b.threshold);
    record.badges = earnedBadges.map((b) => ({ code: b.code, awardedAt: new Date().toISOString() }));

    await this.userGamificationRepository.save(record);

    const nextBadge = this.badges.find((b) => record.points < b.threshold) || null;
    const stats = record.stats || { lessons: 0, courses: 0, liveSessions: 0 };
    const cohortNormalization = await this.buildCohortNormalization(userId, record.points);

    return {
      userId,
      points: record.points,
      stats,
      badges: earnedBadges,
      nextBadge,
      suggestions: this.buildSuggestions(stats, nextBadge?.threshold ?? null),
      cohortNormalization,
    };
  }

  private calculateDelta(events: any[]) {
    const sorted = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const dailyTotals = new Map<string, number>();
    const dailyTypeTotals = new Map<string, Map<string, number>>();
    const lastEventByType = new Map<string, Date>();
    const liveSessionSeen = new Set<string>();

    let pointsDelta = 0;
    const statsDelta: GamificationStats = { lessons: 0, courses: 0, liveSessions: 0 };
    let lastEventAt: Date | null = null;

    for (const e of sorted) {
      lastEventAt = e.createdAt;
      const type = String(e.eventType);
      const rule = this.pointRules[type];
      if (!rule) continue;

      if (
        type === AnalyticsEventType.LIVE_SESSION_JOINED ||
        type === AnalyticsEventType.LIVE_SESSION_ATTENDANCE_RECORDED
      ) {
        if (e.sessionId && liveSessionSeen.has(e.sessionId)) continue;
        if (e.sessionId) liveSessionSeen.add(e.sessionId);
      }

      const last = lastEventByType.get(type);
      if (last) {
        const diffSeconds = (e.createdAt.getTime() - last.getTime()) / 1000;
        if (diffSeconds < rule.minIntervalSeconds) continue;
      }
      lastEventByType.set(type, e.createdAt);

      const dayKey = this.formatDayKey(e.createdAt);
      const dayTotal = dailyTotals.get(dayKey) || 0;
      if (dayTotal >= this.maxDailyPoints) continue;

      const typeTotals = dailyTypeTotals.get(dayKey) || new Map<string, number>();
      const typeTotal = typeTotals.get(type) || 0;
      if (typeTotal >= rule.dailyCap) continue;

      const add = Math.min(rule.points, this.maxDailyPoints - dayTotal, rule.dailyCap - typeTotal);
      if (add <= 0) continue;

      pointsDelta += add;
      dailyTotals.set(dayKey, dayTotal + add);
      typeTotals.set(type, typeTotal + add);
      dailyTypeTotals.set(dayKey, typeTotals);

      if (type === AnalyticsEventType.LESSON_COMPLETED) statsDelta.lessons += 1;
      if (type === AnalyticsEventType.COURSE_COMPLETED) statsDelta.courses += 1;
      if (
        type === AnalyticsEventType.LIVE_SESSION_JOINED ||
        type === AnalyticsEventType.LIVE_SESSION_ATTENDANCE_RECORDED
      ) {
        statsDelta.liveSessions += 1;
      }
    }

    return { pointsDelta, statsDelta, lastEventAt };
  }

  private async getOrCreateRecord(userId: string): Promise<UserGamification> {
    let record = await this.userGamificationRepository.findOne({ where: { userId } });
    if (!record) {
      record = this.userGamificationRepository.create({
        userId,
        points: 0,
        badges: [],
        stats: { lessons: 0, courses: 0, liveSessions: 0 },
        lastAggregatedAt: null,
      });
      record = await this.userGamificationRepository.save(record);
    }
    return record;
  }

  private async buildCohortNormalization(userId: string, points: number): Promise<CohortNormalization[]> {
    const enrollments = await this.cohortEnrollmentRepository.find({
      where: { userId },
      relations: ['cohort'],
    });
    if (enrollments.length === 0) return [];

    const cohortIds = enrollments.map((e) => e.cohortId);
    const cohortMembers = await this.cohortEnrollmentRepository.find({
      where: { cohortId: In(cohortIds) },
    });

    const membersByCohort = new Map<string, Set<string>>();
    const allMemberIds = new Set<string>();
    cohortMembers.forEach((member) => {
      if (!membersByCohort.has(member.cohortId)) {
        membersByCohort.set(member.cohortId, new Set());
      }
      membersByCohort.get(member.cohortId)!.add(member.userId);
      allMemberIds.add(member.userId);
    });

    const gamificationRecords = await this.userGamificationRepository.find({
      where: { userId: In(Array.from(allMemberIds)) },
    });
    const pointsByUser = new Map<string, number>();
    gamificationRecords.forEach((g) => pointsByUser.set(g.userId, g.points || 0));

    return enrollments.map((enrollment) => {
      const members = Array.from(membersByCohort.get(enrollment.cohortId) || []);
      const memberPoints = members.map((id) => pointsByUser.get(id) || 0);
      const total = memberPoints.reduce((sum, p) => sum + p, 0);
      const averagePoints = memberPoints.length > 0 ? total / memberPoints.length : 0;
      const percentile =
        memberPoints.length > 0
          ? (memberPoints.filter((p) => p <= points).length / memberPoints.length) * 100
          : 0;
      const normalizedScore = averagePoints > 0 ? (points / averagePoints) * 100 : 100;

      return {
        cohortId: enrollment.cohortId,
        cohortName: enrollment.cohort?.name || 'Cohort',
        averagePoints,
        percentile,
        normalizedScore,
        memberCount: memberPoints.length,
      };
    });
  }

  private buildSuggestions(stats: GamificationStats, nextThreshold: number | null) {
    const suggestions = [] as string[];
    if (nextThreshold) {
      suggestions.push(`Earn ${nextThreshold} points to reach the next badge`);
    }
    if (stats.lessons < 5) {
      suggestions.push('Complete 5 lessons to unlock more points');
    }
    if (stats.courses < 1) {
      suggestions.push('Finish a course to boost your score');
    }
    if (stats.liveSessions < 2) {
      suggestions.push('Join two live sessions to increase engagement');
    }
    return suggestions;
  }

  private formatDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}