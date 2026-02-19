import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseModule } from './entities/course-module.entity';
import { User } from '../users/entities/user.entity';
import { HttpException } from '@nestjs/common';
import { CourseStatus, CourseDifficulty } from '@mindelta/shared';

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: jest.Mocked<Repository<Course>>;
  let moduleRepository: jest.Mocked<Repository<Module>>;
  let lessonRepository: jest.Mocked<Repository<Lesson>>;
  let courseModuleRepository: jest.Mocked<Repository<CourseModule>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockCourse = {
    id: 'course-123',
    title: 'Test Course',
    description: 'Test Description',
    instructorId: 'instructor-123',
    status: CourseStatus.DRAFT,
    difficulty: CourseDifficulty.BEGINNER,
    price: 99.99,
    tags: ['test'],
    estimatedDuration: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModule = {
    id: 'module-123',
    courseId: 'course-123',
    title: 'Test Module',
    orderIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLesson = {
    id: 'lesson-123',
    moduleId: 'module-123',
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
      const instructorId = 'instructor-123';
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

      const result = await service.findOne('course-123');

      expect(result).toEqual(mockCourse);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'course-123' },
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

      const result = await service.update('course-123', updateCourseDto);

      expect(courseRepository.update).toHaveBeenCalledWith('course-123', updateCourseDto);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'course-123' },
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

      await service.remove('course-123');

      expect(courseRepository.delete).toHaveBeenCalledWith('course-123');
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

      const result = await service.publish('course-123');

      expect(result).toEqual(publishedCourse);
      expect(courseRepository.update).toHaveBeenCalledWith('course-123', {
        status: CourseStatus.PUBLISHED,
      });
    });

    it('should throw when course is not draft', async () => {
      const publishedCourse = { ...mockCourse, status: CourseStatus.PUBLISHED };
      courseRepository.findOne.mockResolvedValue(publishedCourse as any);

      await expect(service.publish('course-123'))
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
        'course.title ILIKE :query OR course.description ILIKE :query',
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
});
