import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { EnrollmentsService } from './enrollments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { CertificatesService } from '../certificates/certificates.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HttpException } from '@nestjs/common';

const mockEnrollmentRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockCourseRepo = () => ({
  findOne: jest.fn(),
  increment: jest.fn(),
});

const mockUserRepo = () => ({
  findOne: jest.fn(),
});

const mockDataSource = () => ({
  query: jest.fn(),
});

const mockCertificatesService = () => ({});
const mockAnalyticsService = () => ({ trackEvent: jest.fn() });
const mockNotificationsService = () => ({});

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollmentRepo: ReturnType<typeof mockEnrollmentRepo>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: getRepositoryToken(Enrollment), useValue: mockEnrollmentRepo() },
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo() },
        { provide: getRepositoryToken(User), useValue: mockUserRepo() },
        { provide: DataSource, useValue: mockDataSource() },
        { provide: CertificatesService, useValue: mockCertificatesService() },
        { provide: AnalyticsService, useValue: mockAnalyticsService() },
        { provide: NotificationsService, useValue: mockNotificationsService() },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    enrollmentRepo = module.get(getRepositoryToken(Enrollment));
    dataSource = module.get(DataSource);
  });

  describe('getContinuePoint', () => {
    it('returns the first incomplete lesson with its stored video position', async () => {
      enrollmentRepo.findOne.mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'course-1',
      });

      dataSource.query.mockResolvedValue([
        {
          lessonId: 'lesson-1',
          lessonTitle: 'Lesson 1',
          moduleId: 'module-1',
          moduleTitle: 'Module 1',
          moduleOrder: 0,
          lessonOrder: 0,
          isCompleted: 1,
          lastPositionSeconds: 0,
          watchPercent: 100,
        },
        {
          lessonId: 'lesson-2',
          lessonTitle: 'Lesson 2',
          moduleId: 'module-1',
          moduleTitle: 'Module 1',
          moduleOrder: 0,
          lessonOrder: 1,
          isCompleted: 0,
          lastPositionSeconds: 142,
          watchPercent: 25,
        },
      ]);

      const result = await service.getContinuePoint('user-1', 'enrollment-1');

      expect(result.lessonId).toBe('lesson-2');
      expect(result.lessonTitle).toBe('Lesson 2');
      expect(result.moduleTitle).toBe('Module 1');
      expect(result.videoPositionSeconds).toBe(142);
      expect(result.isCompleted).toBe(false);
    });

    it('starts at the beginning when there is no progress', async () => {
      enrollmentRepo.findOne.mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'course-1',
      });

      dataSource.query.mockResolvedValue([
        {
          lessonId: 'lesson-1',
          lessonTitle: 'Lesson 1',
          moduleId: 'module-1',
          moduleTitle: 'Module 1',
          moduleOrder: 0,
          lessonOrder: 0,
          isCompleted: 0,
          lastPositionSeconds: 0,
          watchPercent: 0,
        },
      ]);

      const result = await service.getContinuePoint('user-1', 'enrollment-1');

      expect(result.lessonId).toBe('lesson-1');
      expect(result.videoPositionSeconds).toBe(0);
      expect(result.isCompleted).toBe(false);
    });

    it('returns the last lesson when every lesson is completed', async () => {
      enrollmentRepo.findOne.mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'course-1',
      });

      dataSource.query.mockResolvedValue([
        {
          lessonId: 'lesson-1',
          lessonTitle: 'Lesson 1',
          moduleId: 'module-1',
          moduleTitle: 'Module 1',
          isCompleted: 1,
          lastPositionSeconds: 0,
          watchPercent: 100,
        },
        {
          lessonId: 'lesson-2',
          lessonTitle: 'Lesson 2',
          moduleId: 'module-1',
          moduleTitle: 'Module 1',
          isCompleted: 1,
          lastPositionSeconds: 0,
          watchPercent: 100,
        },
      ]);

      const result = await service.getContinuePoint('user-1', 'enrollment-1');

      expect(result.lessonId).toBe('lesson-2');
      expect(result.isCompleted).toBe(true);
      expect(result.videoPositionSeconds).toBe(0);
    });

    it('throws when the enrollment does not exist', async () => {
      enrollmentRepo.findOne.mockResolvedValue(null);

      await expect(service.getContinuePoint('user-1', 'enrollment-1')).rejects.toThrow(HttpException);
    });

    it('throws when the enrollment belongs to another user', async () => {
      enrollmentRepo.findOne.mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-2',
        courseId: 'course-1',
      });

      await expect(service.getContinuePoint('user-1', 'enrollment-1')).rejects.toThrow(HttpException);
    });
  });
});
