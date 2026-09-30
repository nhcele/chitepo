import { Test, TestingModule } from '@nestjs/testing';
import { CertificationsService } from './certifications.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CertificationPathway, PathwayType } from './entities/certification-pathway.entity';
import { UserCertification, CertificationStatus } from './entities/user-certification.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CertificationsService', () => {
  let service: CertificationsService;
  let pathwayRepository: jest.Mocked<Repository<CertificationPathway>>;
  let userCertRepository: jest.Mocked<Repository<UserCertification>>;
  let courseRepository: jest.Mocked<Repository<Course>>;
  let enrollmentRepository: jest.Mocked<Repository<Enrollment>>;

  const mockPathway: CertificationPathway = {
    id: 'pathway-123',
    name: 'Test Pathway',
    type: PathwayType.GENERAL_EDUCATION,
    level: 1,
    levelTitle: 'Beginner',
    description: 'Test Description',
    minimumCourses: 3,
    requiredCourses: ['course-1', 'course-2', 'course-3'],
    orderIndex: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as CertificationPathway;

  const mockUserCert: UserCertification = {
    id: 'usercert-123',
    userId: 'user-123',
    pathwayId: 'pathway-123',
    status: CertificationStatus.IN_PROGRESS,
    coursesRequired: 3,
    coursesCompleted: 1,
    startedAt: new Date(),
    completedAt: null,
    certificateUrl: null,
    certificateNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    pathway: mockPathway,
  } as UserCertification;

  const mockEnrollment: Enrollment = {
    id: 'enrollment-123',
    userId: 'user-123',
    courseId: 'course-1',
    enrolledAt: new Date(),
    completedAt: new Date(),
    progressPercentage: 100,
    certificateIssued: false,
    lastLessonSeenAt: new Date(),
  } as unknown as Enrollment;

  beforeEach(async () => {
    const mockPathwayRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockUserCertRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockCourseRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockEnrollmentRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationsService,
        {
          provide: getRepositoryToken(CertificationPathway),
          useValue: mockPathwayRepo,
        },
        {
          provide: getRepositoryToken(UserCertification),
          useValue: mockUserCertRepo,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepo,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepo,
        },
      ],
    }).compile();

    service = module.get<CertificationsService>(CertificationsService);
    pathwayRepository = module.get(getRepositoryToken(CertificationPathway)) as jest.Mocked<Repository<CertificationPathway>>;
    userCertRepository = module.get(getRepositoryToken(UserCertification)) as jest.Mocked<Repository<UserCertification>>;
    courseRepository = module.get(getRepositoryToken(Course)) as jest.Mocked<Repository<Course>>;
    enrollmentRepository = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPathways', () => {
    it('should return all active pathways', async () => {
      const pathways = [mockPathway];
      pathwayRepository.find.mockResolvedValue(pathways);

      const result = await service.getAllPathways();

      expect(result).toEqual(pathways);
      expect(pathwayRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { type: 'ASC', orderIndex: 'ASC' },
      });
    });
  });

  describe('getPathwaysByType', () => {
    it('should return pathways filtered by type', async () => {
      const pathways = [mockPathway];
      pathwayRepository.find.mockResolvedValue(pathways);

      const result = await service.getPathwaysByType(PathwayType.GENERAL_EDUCATION);

      expect(result).toEqual(pathways);
      expect(pathwayRepository.find).toHaveBeenCalledWith({
        where: { type: PathwayType.GENERAL_EDUCATION, isActive: true },
        order: { level: 'ASC' },
      });
    });
  });

  describe('enrollInPathway', () => {
    it('should enroll user in pathway', async () => {
      const userId = 'user-123';
      const pathwayId = 'pathway-123';

      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      userCertRepository.findOne.mockResolvedValue(null);
      userCertRepository.create.mockReturnValue(mockUserCert as any);
      userCertRepository.save.mockResolvedValue(mockUserCert);

      const result = await service.enrollInPathway(userId, pathwayId);

      expect(result).toEqual(mockUserCert);
      expect(pathwayRepository.findOne).toHaveBeenCalledWith({
        where: { id: pathwayId, isActive: true },
      });
      expect(userCertRepository.create).toHaveBeenCalledWith({
        userId,
        pathwayId,
        status: CertificationStatus.IN_PROGRESS,
        coursesRequired: mockPathway.minimumCourses,
        startedAt: expect.any(Date),
      });
    });

    it('should throw error when pathway not found', async () => {
      pathwayRepository.findOne.mockResolvedValue(null);

      await expect(service.enrollInPathway('user-123', 'nonexistent'))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when already enrolled', async () => {
      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      userCertRepository.findOne.mockResolvedValue(mockUserCert);

      await expect(service.enrollInPathway('user-123', 'pathway-123'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('checkCertificationEligibility', () => {
    it('should return eligible when requirements met', async () => {
      const userId = 'user-123';
      const completedEnrollments = [
        { ...mockEnrollment, courseId: 'course-1' },
        { ...mockEnrollment, courseId: 'course-2' },
        { ...mockEnrollment, courseId: 'course-3' },
      ];

      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      enrollmentRepository.find.mockResolvedValue(completedEnrollments as any);

      const result = await service.checkCertificationEligibility(userId, 'pathway-123');

      expect(result.eligible).toBe(true);
      expect(result.requiredCoursesCompleted).toBe(3);
      expect(result.coursesCompleted).toBe(3);
    });

    it('should return not eligible when requirements not met', async () => {
      const userId = 'user-123';
      const completedEnrollments = [
        { ...mockEnrollment, courseId: 'course-1' },
      ];

      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      enrollmentRepository.find.mockResolvedValue(completedEnrollments as any);

      const result = await service.checkCertificationEligibility(userId, 'pathway-123');

      expect(result.eligible).toBe(false);
      expect(result.requiredCoursesCompleted).toBe(1);
      expect(result.coursesCompleted).toBe(1);
    });
  });

  describe('getUserCertificationProgress', () => {
    it('should calculate progress correctly', async () => {
      const userId = 'user-123';
      const userCerts = [mockUserCert];
      const completedEnrollments = [
        { ...mockEnrollment, courseId: 'course-1' },
      ];

      userCertRepository.find.mockResolvedValue(userCerts);
      enrollmentRepository.find.mockResolvedValue(completedEnrollments as any);

      const result = await service.getUserCertificationProgress(userId);

      expect(result).toHaveLength(1);
      expect(result[0].progressPercentage).toBeGreaterThan(0);
      expect(result[0].coursesCompleted).toBe(1);
      expect(result[0].coursesRequired).toBe(3);
    });
  });

  describe('awardCertification', () => {
    it('should award certification when eligible', async () => {
      const userId = 'user-123';
      const pathwayId = 'pathway-123';
      const completedEnrollments = [
        { ...mockEnrollment, courseId: 'course-1' },
        { ...mockEnrollment, courseId: 'course-2' },
        { ...mockEnrollment, courseId: 'course-3' },
      ];

      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      userCertRepository.findOne.mockResolvedValue(mockUserCert);
      enrollmentRepository.find.mockResolvedValue(completedEnrollments as any);
      userCertRepository.save.mockResolvedValue({
        ...mockUserCert,
        status: CertificationStatus.COMPLETED,
        completedAt: new Date(),
        certificateNumber: 'CERT-123',
      } as any);

      const result = await service.awardCertification(userId, pathwayId);

      expect(result.status).toBe(CertificationStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(result.certificateNumber).toBeDefined();
    });

    it('should throw error when not eligible', async () => {
      const userId = 'user-123';
      const pathwayId = 'pathway-123';
      const completedEnrollments = [
        { ...mockEnrollment, courseId: 'course-1' },
      ];

      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      userCertRepository.findOne.mockResolvedValue(mockUserCert);
      enrollmentRepository.find.mockResolvedValue(completedEnrollments as any);

      await expect(service.awardCertification(userId, pathwayId))
        .rejects.toThrow(HttpException);
    });
  });
});


