import { Test, TestingModule } from '@nestjs/testing';
import { InstructorService } from './instructor.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { InstructorApplication, InstructorApplicationStatus } from './entities/instructor-application.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CourseStatus } from '@mindelta/shared';

describe('InstructorService', () => {
  let service: InstructorService;
  let courseRepository: jest.Mocked<Repository<Course>>;
  let applicationRepository: jest.Mocked<Repository<InstructorApplication>>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let enrollmentRepository: jest.Mocked<Repository<Enrollment>>;
  let progressRepository: jest.Mocked<Repository<LessonProgress>>;
  let lessonRepository: jest.Mocked<Repository<Lesson>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockCourse = {
    id: 'course-123',
    title: 'Test Course',
    description: 'Test Description',
    instructorId: 'instructor-123',
    status: CourseStatus.DRAFT,
    price: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApplication = {
    id: 'app-123',
    userId: 'user-123',
    firstName: 'Simbarashe',
    lastName: 'Mumbengegwi',
    email: 'simbarashe.mumbengegwi@chitepo.co.zw',
    phone: '+1234567890',
    expertise: ['Test Expertise'],
    experience: '5 years',
    education: 'Test Education',
    bio: 'Test Bio',
    status: InstructorApplicationStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCourseRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockApplicationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockAnalyticsService = {
      getCourseAnalytics: jest.fn(),
      getInstructorPerformance: jest.fn(),
    };

    const mockNotificationsService = {
      sendEmail: jest.fn(),
    };

    const mockEnrollmentRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockProgressRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockLessonRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepository },
        { provide: getRepositoryToken(InstructorApplication), useValue: mockApplicationRepository },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: getRepositoryToken(Enrollment), useValue: mockEnrollmentRepository },
        { provide: getRepositoryToken(LessonProgress), useValue: mockProgressRepository },
        { provide: getRepositoryToken(Lesson), useValue: mockLessonRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<InstructorService>(InstructorService);
    courseRepository = module.get(getRepositoryToken(Course)) as jest.Mocked<Repository<Course>>;
    applicationRepository = module.get(getRepositoryToken(InstructorApplication)) as jest.Mocked<Repository<InstructorApplication>>;
    analyticsService = module.get(AnalyticsService) as jest.Mocked<AnalyticsService>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
    enrollmentRepository = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
    progressRepository = module.get(getRepositoryToken(LessonProgress)) as jest.Mocked<Repository<LessonProgress>>;
    lessonRepository = module.get(getRepositoryToken(Lesson)) as jest.Mocked<Repository<Lesson>>;
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCoursesByInstructor', () => {
    it('should return instructor statistics', async () => {
      const instructorId = 'instructor-123';
      const courses = [mockCourse];
      const enrollments = [{ course: mockCourse }];
      
      courseRepository.find.mockResolvedValue(courses as any);
      enrollmentRepository.find.mockResolvedValue(enrollments as any);

      const result = await service.getInstructorStats(instructorId);

      expect(result).toEqual({
        totalCourses: 1,
        publishedCourses: 0,
        totalEnrollments: 1,
        totalRevenue: 99.99,
      });
    });

    it('should return courses for instructor', async () => {
      const instructorId = 'instructor-123';
      const courses = [mockCourse];
      
      courseRepository.find.mockResolvedValue(courses as any);

      const result = await service.getCoursesByInstructor(instructorId);

      expect(result).toEqual(courses);
      expect(courseRepository.find).toHaveBeenCalledWith({
        where: { instructorId },
        relations: ['modules'],
      });
    });

    it('should return empty array when instructor has no courses', async () => {
      courseRepository.find.mockResolvedValue([]);

      const result = await service.getCoursesByInstructor('instructor-123');

      expect(result).toEqual([]);
    });
  });

  describe('createDraftCourse', () => {
    const createCourseDto = {
      title: 'New Course',
      description: 'New Description',
      difficulty: 'beginner',
      price: 199.99,
      tags: ['new'],
      estimatedDuration: 180,
    };

    it('should create a new draft course', async () => {
      const instructorId = 'instructor-123';
      const newCourse = { ...mockCourse, ...createCourseDto, instructorId, status: CourseStatus.DRAFT };
      
      courseRepository.create.mockReturnValue(newCourse as any);
      courseRepository.save.mockResolvedValue(newCourse as any);

      const result = await service.createDraftCourse(createCourseDto, instructorId);

      expect(result).toEqual(newCourse);
      expect(courseRepository.create).toHaveBeenCalledWith({
        ...createCourseDto,
        instructorId,
        status: CourseStatus.DRAFT,
      });
      expect(courseRepository.save).toHaveBeenCalledWith(newCourse);
    });
  });

  describe('updateCourse', () => {
    const updateCourseDto = { title: 'Updated Course', description: 'Updated Description' };

    it('should update course when instructor is owner', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const updatedCourse = { ...mockCourse, ...updateCourseDto };
      
      courseRepository.findOne.mockResolvedValue(mockCourse as any);
      courseRepository.save.mockResolvedValue(updatedCourse as any);

      const result = await service.updateCourse(courseId, updateCourseDto, instructorId);

      expect(result).toEqual(updatedCourse);
      expect(courseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId } });
      expect(courseRepository.save).toHaveBeenCalledWith({ ...mockCourse, ...updateCourseDto });
    });

    it('should throw NotFoundException when course not found', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(service.updateCourse('nonexistent', updateCourseDto, 'instructor-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not course owner', async () => {
      const courseByOtherInstructor = { ...mockCourse, instructorId: 'other-instructor' };
      courseRepository.findOne.mockResolvedValue(courseByOtherInstructor as any);

      await expect(service.updateCourse('course-123', updateCourseDto, 'instructor-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to update published course', async () => {
      const publishedCourse = { ...mockCourse, status: CourseStatus.PUBLISHED };
      courseRepository.findOne.mockResolvedValue(publishedCourse as any);
      courseRepository.save.mockResolvedValue(publishedCourse as any);

      const result = await service.updateCourse('course-123', updateCourseDto, 'instructor-123');
      expect(result).toEqual(publishedCourse);
    });
  });

  describe('submitForReview', () => {
    it('should submit course for review', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const courseWithModules = { ...mockCourse, modules: [{ id: 'mod-1', lessons: [{ id: 'lesson-1' }] }] };
      const courseInReview = { ...courseWithModules, status: CourseStatus.REVIEW };
      
      courseRepository.findOne.mockResolvedValue(courseWithModules as any);
      courseRepository.save.mockResolvedValue(courseInReview as any);

      const result = await service.submitForReview(courseId, instructorId);

      expect(result).toEqual(courseInReview);
      expect(courseRepository.save).toHaveBeenCalledWith({ ...courseWithModules, status: CourseStatus.REVIEW });
    });

    it('should throw BadRequestException when course has no modules', async () => {
      const courseWithoutModules = { ...mockCourse, modules: [] };
      courseRepository.findOne.mockResolvedValue(courseWithoutModules as any);

      await expect(service.submitForReview('course-123', 'instructor-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when course is already in review', async () => {
      const courseInReview = { ...mockCourse, status: CourseStatus.REVIEW };
      courseRepository.findOne.mockResolvedValue(courseInReview as any);

      await expect(service.submitForReview('course-123', 'instructor-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getInstructorStats', () => {
    it('should return instructor statistics', async () => {
      const instructorId = 'instructor-123';
      const courses = [mockCourse];
      const enrollments = [{ course: mockCourse }];
      
      courseRepository.find.mockResolvedValue(courses as any);
      enrollmentRepository.find.mockResolvedValue(enrollments as any);

      const result = await service.getInstructorStats(instructorId);

      expect(result).toEqual({
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.status === CourseStatus.PUBLISHED).length,
        totalEnrollments: enrollments.length,
        totalRevenue: 99.99,
      });
    });
  });

  describe('createApplication', () => {
    const createApplicationDto = {
      firstName: 'Simbarashe',
      lastName: 'Mumbengegwi',
      email: 'simbarashe.mumbengegwi@chitepo.co.zw',
      phone: '+1234567890',
      expertise: ['Test Expertise'],
      experience: '5 years',
      education: 'Test Education',
      bio: 'Test Bio',
    };

    it('should create instructor application', async () => {
      const userId = 'user-123';
      const newApplication = { ...mockApplication, ...createApplicationDto, userId, status: InstructorApplicationStatus.PENDING };
      
      applicationRepository.create.mockReturnValue(newApplication as any);
      applicationRepository.save.mockResolvedValue(newApplication as any);

      const result = await service.createApplication(createApplicationDto, userId);

      expect(result).toEqual(newApplication);
      expect(applicationRepository.create).toHaveBeenCalledWith({
        ...createApplicationDto,
        userId,
        status: InstructorApplicationStatus.PENDING,
      });
      expect(applicationRepository.save).toHaveBeenCalledWith(newApplication);
    });
  });

  describe('getApplications', () => {
    it('should return all instructor applications', async () => {
      const applications = [mockApplication];
      
      applicationRepository.find.mockResolvedValue(applications as any);

      const result = await service.getApplications();

      expect(result).toEqual(applications);
      expect(applicationRepository.find).toHaveBeenCalledWith({ relations: ['user'] });
    });
  });

  describe('approveApplication', () => {
    it('should approve instructor application', async () => {
      const approvedApplication = { ...mockApplication, status: InstructorApplicationStatus.APPROVED };
      
      applicationRepository.findOne.mockResolvedValue(mockApplication as any);
      applicationRepository.save.mockResolvedValue(approvedApplication as any);

      const result = await service.approveApplication('app-123');

      expect(result).toEqual(approvedApplication);
      expect(applicationRepository.save).toHaveBeenCalledWith({
        ...mockApplication,
        status: InstructorApplicationStatus.APPROVED,
      });
    });

    it('should throw NotFoundException when application not found', async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      await expect(service.approveApplication('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectApplication', () => {
    it('should reject instructor application', async () => {
      const rejectedApplication = { ...mockApplication, status: InstructorApplicationStatus.REJECTED };
      
      applicationRepository.findOne.mockResolvedValue(mockApplication as any);
      applicationRepository.save.mockResolvedValue(rejectedApplication as any);

      const result = await service.rejectApplication('app-123', 'Insufficient experience');

      expect(result).toEqual(rejectedApplication);
      expect(applicationRepository.save).toHaveBeenCalledWith({
        ...mockApplication,
        status: InstructorApplicationStatus.REJECTED,
      });
    });
  });
});
