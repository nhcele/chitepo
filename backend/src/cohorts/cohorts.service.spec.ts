import { Test, TestingModule } from '@nestjs/testing';
import { CohortsService } from './cohorts.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrainingCohort, CohortEnrollment, CohortStatus, CohortTrack, CohortQuarter } from './entities/training-cohort.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { SystemSetting } from '../admin/entities/system-setting.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('CohortsService', () => {
  let service: CohortsService;
  let cohortRepository: jest.Mocked<Repository<TrainingCohort>>;
  let enrollmentRepository: jest.Mocked<Repository<CohortEnrollment>>;
  let settingsRepository: jest.Mocked<Repository<SystemSetting>>;

  const mockCohort: TrainingCohort = {
    id: 'cohort-123',
    name: 'Test Cohort',
    track: CohortTrack.DCC_TRAINING,
    quarter: CohortQuarter.Q1,
    year: 2025,
    status: CohortStatus.OPEN_FOR_ENROLLMENT,
    description: 'Test Description',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-15'),
    enrollmentOpenDate: new Date('2024-12-01'),
    enrollmentCloseDate: new Date('2025-01-10'),
    maxParticipants: 100,
    currentParticipants: 50,
    isMandatory: false,
    isVirtual: false,
    courseIds: ['course-1', 'course-2'],
    cost: 0,
    prerequisites: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as TrainingCohort;

  const mockEnrollment: CohortEnrollment = {
    id: 'enrollment-123',
    cohortId: 'cohort-123',
    userId: 'user-123',
    status: 'enrolled',
    enrolledAt: new Date(),
    completedAt: null,
    attendancePercentage: 0,
    finalScore: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as CohortEnrollment;

  beforeEach(async () => {
    const mockCohortRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockEnrollmentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const mockSettingsRepo = {
      findOne: jest.fn(),
    };

    const mockNotificationsService = {
      sendEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CohortsService,
        {
          provide: getRepositoryToken(TrainingCohort),
          useValue: mockCohortRepo,
        },
        {
          provide: getRepositoryToken(CohortEnrollment),
          useValue: mockEnrollmentRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(SystemSetting),
          useValue: mockSettingsRepo,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<CohortsService>(CohortsService);
    cohortRepository = module.get(getRepositoryToken(TrainingCohort)) as jest.Mocked<Repository<TrainingCohort>>;
    enrollmentRepository = module.get(getRepositoryToken(CohortEnrollment)) as jest.Mocked<Repository<CohortEnrollment>>;
    settingsRepository = module.get(getRepositoryToken(SystemSetting)) as jest.Mocked<Repository<SystemSetting>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllCohorts', () => {
    it('should return all active cohorts', async () => {
      const cohorts = [mockCohort];
      cohortRepository.find.mockResolvedValue(cohorts);

      const result = await service.getAllCohorts();

      expect(result).toEqual(cohorts);
      expect(cohortRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['instructor', 'enrollments'],
        order: { startDate: 'ASC' },
      });
    });

    it('should filter by track when provided', async () => {
      const cohorts = [mockCohort];
      cohortRepository.find.mockResolvedValue(cohorts);

      const result = await service.getAllCohorts({ track: CohortTrack.DCC_TRAINING });

      expect(result).toEqual(cohorts);
      expect(cohortRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, track: CohortTrack.DCC_TRAINING },
        relations: ['instructor', 'enrollments'],
        order: { startDate: 'ASC' },
      });
    });
  });

  describe('getCohortById', () => {
    it('should return cohort by id', async () => {
      cohortRepository.findOne.mockResolvedValue(mockCohort);

      const result = await service.getCohortById('cohort-123');

      expect(result).toEqual(mockCohort);
      expect(cohortRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cohort-123' },
        relations: ['instructor', 'enrollments', 'enrollments.user'],
      });
    });

    it('should throw error when cohort not found', async () => {
      cohortRepository.findOne.mockResolvedValue(null);

      await expect(service.getCohortById('nonexistent'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('enrollInCohort', () => {
    it('should enroll user in cohort', async () => {
      const userId = 'user-123';
      const cohortId = 'cohort-123';
      const now = new Date('2025-01-05'); // Within enrollment period
      jest.useFakeTimers().setSystemTime(now);

      cohortRepository.findOne.mockResolvedValue(mockCohort);
      enrollmentRepository.findOne.mockResolvedValue(null);
      enrollmentRepository.create.mockReturnValue(mockEnrollment as any);
      enrollmentRepository.save.mockResolvedValue(mockEnrollment);
      cohortRepository.save.mockResolvedValue({
        ...mockCohort,
        currentParticipants: 51,
      } as any);

      const result = await service.enrollInCohort(userId, cohortId);

      expect(result).toEqual(mockEnrollment);
      expect(enrollmentRepository.create).toHaveBeenCalledWith({
        cohortId,
        userId,
        status: 'enrolled',
        enrolledAt: expect.any(Date),
      });

      jest.useRealTimers();
    });

    it('should throw error when cohort not found', async () => {
      cohortRepository.findOne.mockResolvedValue(null);

      await expect(service.enrollInCohort('user-123', 'nonexistent'))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when cohort is full', async () => {
      const fullCohort = {
        ...mockCohort,
        currentParticipants: 100,
        maxParticipants: 100,
      };
      cohortRepository.findOne.mockResolvedValue(fullCohort);

      await expect(service.enrollInCohort('user-123', 'cohort-123'))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when already enrolled', async () => {
      cohortRepository.findOne.mockResolvedValue(mockCohort);
      enrollmentRepository.findOne.mockResolvedValue(mockEnrollment);

      await expect(service.enrollInCohort('user-123', 'cohort-123'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('withdrawFromCohort', () => {
    it('should withdraw user from cohort', async () => {
      const userId = 'user-123';
      const cohortId = 'cohort-123';

      enrollmentRepository.findOne.mockResolvedValue(mockEnrollment);
      enrollmentRepository.save.mockResolvedValue({
        ...mockEnrollment,
        status: 'withdrawn',
      } as any);
      cohortRepository.findOne.mockResolvedValue(mockCohort);
      cohortRepository.save.mockResolvedValue({
        ...mockCohort,
        currentParticipants: 49,
      } as any);

      await service.withdrawFromCohort(userId, cohortId);

      expect(enrollmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockEnrollment.id, status: 'withdrawn' })
      );
      expect(cohortRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockCohort.id, currentParticipants: expect.any(Number) })
      );
    });

    it('should throw error when enrollment not found', async () => {
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(service.withdrawFromCohort('user-123', 'cohort-123'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('getCohortStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const enrollments = [
        { ...mockEnrollment, status: 'active', attendancePercentage: 80, finalScore: 85 },
        { ...mockEnrollment, id: 'enrollment-2', status: 'completed', attendancePercentage: 90, finalScore: 90 },
        { ...mockEnrollment, id: 'enrollment-3', status: 'withdrawn', attendancePercentage: 50 },
      ];

      cohortRepository.findOne.mockResolvedValue(mockCohort);
      enrollmentRepository.find.mockResolvedValue(enrollments as any);

      const result = await service.getCohortStatistics('cohort-123');

      expect(result.statistics.totalEnrolled).toBe(3);
      expect(result.statistics.active).toBe(1);
      expect(result.statistics.completed).toBe(1);
      expect(result.statistics.withdrawn).toBe(1);
      expect(result.statistics.averageAttendance).toBeGreaterThan(0);
    });
  });
});


