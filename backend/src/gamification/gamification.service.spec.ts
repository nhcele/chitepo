import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { UserGamification } from './entities/user-gamification.entity';
import { CohortEnrollment } from '../cohorts/entities/training-cohort.entity';
import { AnalyticsEventType } from '@mindelta/shared';
import { Repository } from 'typeorm';

describe('GamificationService', () => {
  let service: GamificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: AnalyticsService,
          useValue: {
            getEventsByUserSince: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserGamification),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          } as Partial<Repository<UserGamification>>,
        },
        {
          provide: getRepositoryToken(CohortEnrollment),
          useValue: {
            find: jest.fn(),
          } as Partial<Repository<CohortEnrollment>>,
        },
      ],
    }).compile();

    service = module.get(GamificationService);
  });

  const buildEvent = (eventType: AnalyticsEventType, createdAt: Date, sessionId?: string) => ({
    eventType,
    createdAt,
    sessionId,
  });

  it('applies min-interval rules for repeated lesson completions', () => {
    const base = new Date('2026-02-07T10:00:00Z');
    const events = [
      buildEvent(AnalyticsEventType.LESSON_COMPLETED, new Date(base.getTime() + 0 * 1000)),
      buildEvent(AnalyticsEventType.LESSON_COMPLETED, new Date(base.getTime() + 10 * 1000)),
      buildEvent(AnalyticsEventType.LESSON_COMPLETED, new Date(base.getTime() + 40 * 1000)),
      buildEvent(AnalyticsEventType.LESSON_COMPLETED, new Date(base.getTime() + 70 * 1000)),
    ];

    const result = (service as any).calculateDelta(events);

    expect(result.pointsDelta).toBe(30);
    expect(result.statsDelta.lessons).toBe(3);
  });

  it('enforces daily caps for a single event type', () => {
    const base = new Date('2026-02-07T12:00:00Z');
    const events = Array.from({ length: 30 }, (_, index) =>
      buildEvent(AnalyticsEventType.LESSON_COMPLETED, new Date(base.getTime() + index * 40 * 1000)),
    );

    const result = (service as any).calculateDelta(events);

    expect(result.pointsDelta).toBe(200);
    expect(result.statsDelta.lessons).toBe(20);
  });

  it('dedupes live session points by sessionId', () => {
    const base = new Date('2026-02-07T14:00:00Z');
    const events = [
      buildEvent(AnalyticsEventType.LIVE_SESSION_JOINED, new Date(base.getTime() + 0 * 1000), 'session-1'),
      buildEvent(AnalyticsEventType.LIVE_SESSION_JOINED, new Date(base.getTime() + 600 * 1000), 'session-1'),
      buildEvent(AnalyticsEventType.LIVE_SESSION_ATTENDANCE_RECORDED, new Date(base.getTime() + 900 * 1000), 'session-1'),
      buildEvent(AnalyticsEventType.LIVE_SESSION_JOINED, new Date(base.getTime() + 1200 * 1000), 'session-2'),
    ];

    const result = (service as any).calculateDelta(events);

    expect(result.pointsDelta).toBe(10);
    expect(result.statsDelta.liveSessions).toBe(2);
  });
});
