import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseModule } from './entities/course-module.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { HttpException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CourseStatus, CourseDifficulty } from '@mindelta/shared';

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: jest.Mocked<Repository<Course>>;
  let moduleRepository: jest.Mocked<Repository<Module>>;
  let lessonRepository: jest.Mocked<Repository<Lesson>>;
  let courseModuleRepository: jest.Mocked<Repository<CourseModule>>;
  let lessonProgressRepository: jest.Mocked<Repository<LessonProgress>>;
  let enrollmentRepository: jest.Mocked<Repository<Enrollment>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockCourse = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Test Course',
    description: 'Test Description',
    instructorId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    status: CourseStatus.DRAFT,
    difficulty: CourseDifficulty.BEGINNER,
    price: 99.99,
    tags: ['test'],
    estimatedDuration: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModule = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Test Module',
    orderIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLesson = {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    moduleId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    title: 'Test Lesson',
    type: 'video',
    durationSeconds: 600,
    orderIndex: 1,
    isPreview: false,
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
      createQueryBuilder: jest.fn(),
    };

    const mockModuleRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockLessonRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockCourseModuleRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockLessonProgressRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockEnrollmentRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
        {
          provide: getRepositoryToken(Module),
          useValue: mockModuleRepository,
        },
        {
          provide: getRepositoryToken(Lesson),
          useValue: mockLessonRepository,
        },
        {
          provide: getRepositoryToken(CourseModule),
          useValue: mockCourseModuleRepository,
        },
        {
          provide: getRepositoryToken(LessonProgress),
          useValue: mockLessonProgressRepository,
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

    service = module.get<CoursesService>(CoursesService);
    courseRepository = module.get(getRepositoryToken(Course)) as jest.Mocked<Repository<Course>>;
    moduleRepository = module.get(getRepositoryToken(Module)) as jest.Mocked<Repository<Module>>;
    lessonRepository = module.get(getRepositoryToken(Lesson)) as jest.Mocked<Repository<Lesson>>;
    courseModuleRepository = module.get(getRepositoryToken(CourseModule)) as jest.Mocked<Repository<CourseModule>>;
    lessonProgressRepository = module.get(getRepositoryToken(LessonProgress)) as jest.Mocked<Repository<LessonProgress>>;
    enrollmentRepository = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCourseDto = {
      title: 'New Course',
      description: 'New Description',
      difficulty: CourseDifficulty.BEGINNER,
      price: 199.99,
      tags: ['new'],
      estimatedDuration: 180,
    };

    it('should create a new course', async () => {
      const newCourse = { ...mockCourse, ...createCourseDto };
      
      courseRepository.create.mockReturnValue(newCourse as any);
      courseRepository.save.mockResolvedValue(newCourse as any);

      const result = await service.create(createCourseDto);

      expect(result).toEqual(newCourse);
      expect(courseRepository.create).toHaveBeenCalledWith({
        ...createCourseDto,
      });
      expect(courseRepository.save).toHaveBeenCalledWith(newCourse);
    });
  });

  describe('findAll', () => {
    it('should return all published courses', async () => {
      const courses = [mockCourse];
      courseRepository.find.mockResolvedValue(courses as any);

      const result = await service.findAll();

      expect(result).toEqual(courses);
      expect(courseRepository.find).toHaveBeenCalledWith({
        relations: ['instructor', 'modules'],
      });
    });

    it('should return courses by instructor', async () => {
      const instructorId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
      const courses = [mockCourse];
      
      courseRepository.find.mockResolvedValue(courses as any);

      const result = await service.findByInstructor(instructorId);

      expect(result).toEqual(courses);
      expect(courseRepository.find).toHaveBeenCalledWith({
        where: { instructorId },
        relations: ['modules'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      courseRepository.findOne.mockResolvedValue(mockCourse as any);

      const result = await service.findOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(result).toEqual(mockCourse);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        relations: ['instructor', 'modules', 'modules.lessons'],
      });
    });

    it('should throw NotFoundException when course not found', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    const updateCourseDto = {
      title: 'Updated Course',
      description: 'Updated Description',
    };

    it('should update a course', async () => {
      const updatedCourse = { ...mockCourse, ...updateCourseDto };
      
      courseRepository.update.mockResolvedValue({ affected: 1 } as any);
      courseRepository.findOne.mockResolvedValue(updatedCourse as any);

      const result = await service.update('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', updateCourseDto);

      expect(courseRepository.update).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', updateCourseDto);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        relations: ['instructor', 'modules', 'modules.lessons'],
      });
      expect(result).toEqual(updatedCourse);
    });

    it('should throw when course not found', async () => {
      courseRepository.update.mockResolvedValue({ affected: 0 } as any);
      courseRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateCourseDto))
        .rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete a course', async () => {
      courseRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(courseRepository.delete).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });
  });

  describe('publish', () => {
    it('should publish a course', async () => {
      const draftCourse = { ...mockCourse, status: CourseStatus.DRAFT };
      const publishedCourse = { ...mockCourse, status: CourseStatus.PUBLISHED };
      
      courseRepository.findOne
        .mockResolvedValueOnce(draftCourse as any)
        .mockResolvedValueOnce(publishedCourse as any);
      courseRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.publish('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(result).toEqual(publishedCourse);
      expect(courseRepository.update).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', {
        status: CourseStatus.PUBLISHED,
      });
    });

    it('should throw when course is not draft', async () => {
      const publishedCourse = { ...mockCourse, status: CourseStatus.PUBLISHED };
      courseRepository.findOne.mockResolvedValue(publishedCourse as any);

      await expect(service.publish('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('search', () => {
    it('should search courses by query', async () => {
      const query = 'test';
      const courses = [mockCourse];
      
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(courses as any),
      };

      courseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.search(query);

      expect(result).toEqual(courses);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(course.title) LIKE LOWER(:query) OR LOWER(course.description) LIKE LOWER(:query)',
        { query: `%${query}%` }
      );
    });
  });

  describe('categorization', () => {
    it('should filter courses by category', async () => {
      const category = 'core';
      const courses = [{ ...mockCourse, category }];
      
      courseRepository.find.mockResolvedValue(courses as any);

      const result = await service.findByCategory(category as any);

      expect(result).toEqual(courses);
      expect(courseRepository.find).toHaveBeenCalledWith({
        where: { category },
        relations: ['instructor', 'modules'],
      });
    });

    it('should return empty array when no courses in category', async () => {
      courseRepository.find.mockResolvedValue([]);

      const result = await service.findByCategory('core' as any);

      expect(result).toEqual([]);
    });
  });

  describe('authorization helpers', () => {
    it('should allow course owners to manage a course', async () => {
      courseRepository.findOne.mockResolvedValue({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        instructorId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      } as any);

      await expect(
        (service as any).assertCanManageCourse(
          'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
          'learner',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ),
      ).resolves.toBeUndefined();
    });

    it('should allow admins to manage any course', async () => {
      await expect(
        (service as any).assertCanManageCourse(
          '00000000-0000-0000-0000-000000000000',
          'admin',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ),
      ).resolves.toBeUndefined();

      expect(courseRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject non-owners managing a course', async () => {
      courseRepository.findOne.mockResolvedValue({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        instructorId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      } as any);

      await expect(
        (service as any).assertCanManageCourse(
          '99999999-9999-9999-9999-999999999999',
          'learner',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject managing a non-existent course', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        (service as any).assertCanManageCourse(
          'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
          'learner',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLessonProgress', () => {
    beforeEach(() => {
      enrollmentRepository.findOne.mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      } as any);
      lessonRepository.find.mockResolvedValue([]);
    });

    it('creates progress with resume and watched time', async () => {
      lessonRepository.findOne.mockResolvedValue({
        ...mockLesson,
        module: { courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        videoDuration: 600,
      } as any);
      lessonProgressRepository.findOne.mockResolvedValue(null);
      lessonProgressRepository.create.mockImplementation((dto: any) => dto as any);
      lessonProgressRepository.save.mockImplementation((value: any) => Promise.resolve({ id: 'progress-1', ...value } as any));
      lessonProgressRepository.count.mockResolvedValue(1);

      const result = await service.updateLessonProgress('user-1', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', {
        lastPositionSeconds: 120,
        watchedSeconds: 120,
      });

      expect(result.lastPositionSeconds).toBe(120);
      expect(result.watchedSeconds).toBe(120);
      expect(result.watchPercent).toBe(20);
    });

    it('clamps position and watched time to the lesson duration', async () => {
      lessonRepository.findOne.mockResolvedValue({
        ...mockLesson,
        module: { courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        videoDuration: 600,
      } as any);
      lessonProgressRepository.findOne.mockResolvedValue(null);
      lessonProgressRepository.create.mockImplementation((dto: any) => dto as any);
      lessonProgressRepository.save.mockImplementation((value: any) => Promise.resolve({ id: 'progress-1', ...value } as any));
      lessonProgressRepository.count.mockResolvedValue(1);

      const result = await service.updateLessonProgress('user-1', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', {
        lastPositionSeconds: 9999,
        watchedSeconds: 9999,
      });

      expect(result.lastPositionSeconds).toBe(600);
      expect(result.watchedSeconds).toBe(600);
      expect(result.watchPercent).toBe(100);
    });

    it('keeps watched time monotonic', async () => {
      lessonRepository.findOne.mockResolvedValue({
        ...mockLesson,
        module: { courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        videoDuration: 600,
      } as any);
      lessonProgressRepository.findOne.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        watchPercent: 30,
        lastPositionSeconds: 180,
        watchedSeconds: 180,
        activeSeconds: 0,
        quizAttempts: 0,
      } as any);
      lessonProgressRepository.save.mockImplementation((value: any) => Promise.resolve({ id: 'progress-1', ...value } as any));
      lessonProgressRepository.count.mockResolvedValue(1);

      const result = await service.updateLessonProgress('user-1', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', {
        lastPositionSeconds: 120,
        watchedSeconds: 120,
      });

      expect(result.watchedSeconds).toBe(180);
      expect(result.watchPercent).toBe(30);
    });

    it('clamps reported active time to wall-clock elapsed plus grace', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      lessonRepository.findOne.mockResolvedValue({
        ...mockLesson,
        module: { courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        videoDuration: 600,
      } as any);
      lessonProgressRepository.findOne.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        watchPercent: 0,
        lastPositionSeconds: 0,
        watchedSeconds: 0,
        activeSeconds: 100,
        quizAttempts: 0,
        updatedAt: tenMinutesAgo,
      } as any);
      lessonProgressRepository.save.mockImplementation((value: any) => Promise.resolve({ id: 'progress-1', ...value } as any));
      lessonProgressRepository.count.mockResolvedValue(1);

      const result = await service.updateLessonProgress('user-1', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', {
        activeSeconds: 100000, // inflated value
      });

      // 10 min elapsed + 60 s grace = 660 max delta on top of existing 100
      expect(result.activeSeconds).toBeLessThanOrEqual(100 + 660);
      expect(result.activeSeconds).toBeGreaterThanOrEqual(100);
    });

    it('throws when lesson is not found', async () => {
      lessonRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateLessonProgress('user-1', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', { watchPercent: 50 }),
      ).rejects.toThrow(HttpException);
    });

    it('completes a manual lesson only when explicitly requested', async () => {
      lessonRepository.findOne.mockResolvedValue({
        ...mockLesson,
        module: { courseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        completionMode: 'manual',
        videoDuration: 600,
      } as any);
      lessonProgressRepository.findOne.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        watchPercent: 0,
        lastPositionSeconds: 0,
        watchedSeconds: 0,
        activeSeconds: 0,
        quizAttempts: 0,
      } as any);
      lessonProgressRepository.save.mockImplementation((value: any) => Promise.resolve({ id: 'progress-1', ...value } as any));
      lessonProgressRepository.count.mockResolvedValue(1);

      const result = await service.updateLessonProgress('user-1', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', {
        manualComplete: true,
      });

      expect(result.isCompleted).toBe(true);
    });
  });
});
