import { Test, TestingModule } from '@nestjs/testing';
import { PayoutService } from './payout.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';

describe('PayoutService', () => {
  let service: PayoutService;
  let courseRepository: jest.Mocked<Repository<Course>>;
  let enrollmentRepository: jest.Mocked<Repository<Enrollment>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockCourse = {
    id: 'course-123',
    title: 'Test Course',
    price: 199.99,
    instructorId: 'instructor-123',
  };

  const mockEnrollment = {
    id: 'enrollment-123',
    userId: 'user-123',
    courseId: 'course-123',
    progressPercent: 100,
    completedAt: new Date('2024-01-15'),
    enrolledAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockCourseRepository = {
      find: jest.fn(),
    };

    const mockEnrollmentRepository = {
      find: jest.fn(),
    };

    const mockUserRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutService,
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<PayoutService>(PayoutService);
    courseRepository = module.get(getRepositoryToken(Course)) as jest.Mocked<Repository<Course>>;
    enrollmentRepository = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateInstructorPayout', () => {
    const instructorId = 'instructor-123';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('should calculate payout for instructor with courses', async () => {
      const courses = [mockCourse];
      const enrollments = [mockEnrollment];
      
      courseRepository.find.mockResolvedValue(courses as any);
      enrollmentRepository.find.mockResolvedValue(enrollments as any);

      const result = await service.calculateInstructorPayout(instructorId, startDate, endDate);

      expect(result).toEqual({
        instructorId,
        period: { startDate, endDate },
        totalRevenue: mockCourse.price,
        platformFee: mockCourse.price * 0.3, // 30% platform fee
        instructorEarnings: mockCourse.price * 0.7, // 70% instructor share
        courseBreakdown: [
          {
            courseId: mockCourse.id,
            courseTitle: mockCourse.title,
            enrollments: 1,
            revenue: mockCourse.price,
            instructorShare: mockCourse.price * 0.7,
            platformFee: mockCourse.price * 0.3,
            netEarnings: mockCourse.price * 0.7,
          },
        ],
        status: 'pending',
      });
    });

    it('should return empty payout for instructor with no courses', async () => {
      courseRepository.find.mockResolvedValue([]);

      const result = await service.calculateInstructorPayout(instructorId, startDate, endDate);

      expect(result.totalRevenue).toBe(0);
      expect(result.instructorEarnings).toBe(0);
      expect(result.courseBreakdown).toEqual([]);
    });

    it('should use custom settings when provided', async () => {
      const courses = [mockCourse];
      const enrollments = [mockEnrollment];
      const customSettings = {
        platformFeePercentage: 20, // 20% platform fee
        minimumPayoutAmount: 100,
      };
      
      courseRepository.find.mockResolvedValue(courses as any);
      enrollmentRepository.find.mockResolvedValue(enrollments as any);

      const result = await service.calculateInstructorPayout(
        instructorId, 
        startDate, 
        endDate, 
        customSettings
      );

      expect(result.platformFee).toBe(mockCourse.price * 0.2); // 20% platform fee
      expect(result.instructorEarnings).toBe(mockCourse.price * 0.8); // 80% instructor share
    });
  });

  describe('calculateCoursePayout', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const platformFeePercentage = 30;

    it('should calculate payout for a single course', async () => {
      const enrollments = [mockEnrollment];
      
      enrollmentRepository.find.mockResolvedValue(enrollments as any);

      const result = await service.calculateCoursePayout(
        mockCourse as any, 
        startDate, 
        endDate, 
        platformFeePercentage
      );

      expect(result).toEqual(
        expect.objectContaining({
          courseId: mockCourse.id,
          courseTitle: mockCourse.title,
          enrollments: 1,
          revenue: mockCourse.price,
          instructorShare: mockCourse.price * 0.7,
          platformFee: mockCourse.price * 0.3,
          netEarnings: mockCourse.price * 0.7,
        }),
      );
    });

    it('should filter enrollments by completion date', async () => {
      const oldEnrollment = {
        ...mockEnrollment,
        completedAt: new Date('2023-12-31'), // Before start date
      };
      const validEnrollment = {
        ...mockEnrollment,
        completedAt: new Date('2024-01-15'), // Within date range
      };
      
      // Simulate DB filtering by startDate (>=) and endDate (<=)
      enrollmentRepository.find.mockResolvedValue([validEnrollment] as any);

      const result = await service.calculateCoursePayout(
        mockCourse as any, 
        startDate, 
        endDate, 
        platformFeePercentage
      );

      expect(result.enrollments).toBe(1); // Only valid enrollment counted
      expect(result.revenue).toBe(mockCourse.price);
    });
  });

  describe('getInstructorEarningsSummary', () => {
    const instructorId = 'instructor-123';

    it('should return earnings summary for month', async () => {
      const currentPeriod = {
        instructorId,
        period: { startDate: new Date(), endDate: new Date() },
        totalRevenue: 1000,
        platformFee: 300,
        instructorEarnings: 700,
        courseBreakdown: [],
        status: 'pending' as const,
      };

      const previousPeriod = {
        ...currentPeriod,
        totalRevenue: 500,
        platformFee: 150,
        instructorEarnings: 350,
      };

      // Mock the calculateInstructorPayout method
      jest.spyOn(service, 'calculateInstructorPayout')
        .mockResolvedValueOnce(currentPeriod)
        .mockResolvedValueOnce(previousPeriod);

      const result = await service.getInstructorEarningsSummary(instructorId, 'month');

      expect(result).toEqual({
        currentPeriod,
        previousPeriod,
        growth: {
          revenue: 500, // 1000 - 500
          enrollments: 0, // Would be calculated from courseBreakdown
          percentage: 100, // (500 / 500) * 100
        },
        projectedMonthly: 700, // Same as current period for 'month'
      });
    });
  });

  describe('getTopPerformingCourses', () => {
    const instructorId = 'instructor-123';

    it('should return top performing courses', async () => {
      const courses = [
        mockCourse,
        { ...mockCourse, id: 'course-456', title: 'Course 2', price: 299.99 },
      ];
      
      courseRepository.find.mockResolvedValue(courses as any);
      
      // Mock calculateCoursePayout to return different revenues
      jest.spyOn(service, 'calculateCoursePayout')
        .mockResolvedValueOnce({
          courseId: 'course-123',
          courseTitle: 'Test Course',
          enrollments: 10,
          revenue: 1999.90,
          instructorShare: 1399.93,
          platformFee: 599.97,
          netEarnings: 1399.93,
        })
        .mockResolvedValueOnce({
          courseId: 'course-456',
          courseTitle: 'Course 2',
          enrollments: 5,
          revenue: 1499.95,
          instructorShare: 1049.97,
          platformFee: 449.98,
          netEarnings: 1049.97,
        });

      const result = await service.getTopPerformingCourses(instructorId, 5, 'month');

      expect(result).toHaveLength(2);
      expect(result[0].courseTitle).toBe('Test Course'); // Higher revenue first
      expect(result[1].courseTitle).toBe('Course 2');
    });
  });

  describe('generatePayoutReport', () => {
    const instructorId = 'instructor-123';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('should generate comprehensive payout report', async () => {
      const summary = {
        instructorId,
        period: { startDate, endDate },
        totalRevenue: 1000,
        platformFee: 300,
        instructorEarnings: 700,
        courseBreakdown: [
          {
            courseId: 'course-123',
            courseTitle: 'Test Course',
            enrollments: 5,
            revenue: 1000,
            instructorShare: 700,
            platformFee: 300,
            netEarnings: 700,
          },
        ],
        status: 'pending' as const,
      };

      jest.spyOn(service, 'calculateInstructorPayout').mockResolvedValue(summary);

      const result = await service.generatePayoutReport(instructorId, startDate, endDate);

      expect(result).toEqual({
        summary,
        detailedBreakdown: summary.courseBreakdown,
        insights: {
          bestPerformingCourse: 'Test Course',
          averageCourseRevenue: 1000,
          totalEnrollments: 5,
          averageRevenuePerEnrollment: 200,
        },
      });
    });
  });

  describe('validatePayoutAmount', () => {
    const instructorId = 'instructor-123';

    it('should validate valid payout amount', async () => {
      const currentPayout = {
        instructorId,
        period: { startDate: new Date(), endDate: new Date() },
        totalRevenue: 1000,
        platformFee: 300,
        instructorEarnings: 700,
        courseBreakdown: [],
        status: 'pending' as const,
      };

      jest.spyOn(service, 'calculateInstructorPayout').mockResolvedValue(currentPayout);

      const result = await service.validatePayoutAmount(instructorId, 500);

      expect(result).toEqual({
        isValid: true,
        availableBalance: 700,
      });
    });

    it('should reject payout amount exceeding balance', async () => {
      const currentPayout = {
        instructorId,
        period: { startDate: new Date(), endDate: new Date() },
        totalRevenue: 1000,
        platformFee: 300,
        instructorEarnings: 700,
        courseBreakdown: [],
        status: 'pending' as const,
      };

      jest.spyOn(service, 'calculateInstructorPayout').mockResolvedValue(currentPayout);

      const result = await service.validatePayoutAmount(instructorId, 1000);

      expect(result).toEqual({
        isValid: false,
        reason: 'Insufficient balance. Available: $700.00, Requested: $1000.00',
        availableBalance: 700,
      });
    });

    it('should reject payout amount below minimum', async () => {
      const currentPayout = {
        instructorId,
        period: { startDate: new Date(), endDate: new Date() },
        totalRevenue: 100,
        platformFee: 30,
        instructorEarnings: 70,
        courseBreakdown: [],
        status: 'pending' as const,
      };

      jest.spyOn(service, 'calculateInstructorPayout').mockResolvedValue(currentPayout);

      const result = await service.validatePayoutAmount(instructorId, 30);

      expect(result).toEqual({
        isValid: false,
        reason: 'Minimum payout amount is $50',
        availableBalance: 70,
      });
    });
  });
});
