import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseModule as CourseModuleJoin } from './entities/course-module.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { CreateCourseDto, UpdateCourseDto, CourseStatus, CourseDifficulty, LessonType, UserRole } from '@mindelta/shared';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(CourseModuleJoin)
    private courseModuleRepo: Repository<CourseModuleJoin>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepo: Repository<LessonProgress>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ---------- Error Handling Helpers ----------
  private logError(context: string, error: any, metadata?: Record<string, any>) {
    console.error(`[CoursesService:${context}] Error:`, {
      message: error?.message,
      stack: error?.stack,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  private validateUUID(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new HttpException(
        `Invalid ${fieldName}: must be a valid UUID`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new HttpException(
        `${fieldName} is required`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new HttpException(
        `${fieldName} must be between ${min} and ${max}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    try {
      // Validate required fields
      this.validateRequired(createCourseDto.title, 'Course title');
      
      if (createCourseDto.title.length < 3) {
        throw new HttpException(
          'Course title must be at least 3 characters long',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (createCourseDto.title.length > 200) {
        throw new HttpException(
          'Course title must not exceed 200 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate price if provided
      if (createCourseDto.price !== undefined && createCourseDto.price < 0) {
        throw new HttpException(
          'Course price cannot be negative',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate estimated duration if provided
      if (createCourseDto.estimatedDuration !== undefined && createCourseDto.estimatedDuration < 0) {
        throw new HttpException(
          'Estimated duration cannot be negative',
          HttpStatus.BAD_REQUEST,
        );
      }

      const course = this.coursesRepository.create(createCourseDto);
      const saved = await this.coursesRepository.save(course);
      
      this.logError('create', null, { courseId: saved.id, title: saved.title });
      console.log(`[CoursesService:create] Course created successfully: ${saved.id}`);
      
      return saved;
    } catch (error) {
      this.logError('create', error, { dto: createCourseDto });
      throw error;
    }
  }

  // ---------- Many-to-many Course <-> Module linking ----------
  async linkModuleToCourse(courseId: string, moduleId: string, sortOrder: number, isRequired = true, requesterId?: string): Promise<CourseModuleJoin> {
    try {
      // Validate IDs
      this.validateUUID(courseId, 'Course ID');
      this.validateUUID(moduleId, 'Module ID');

      // Validate sort order
      if (typeof sortOrder !== 'number' || sortOrder < 0) {
        throw new HttpException(
          'Sort order must be a non-negative number',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Ensure course exists
      const course = await this.coursesRepository.findOne({ where: { id: courseId } });
      if (!course) {
        throw new HttpException(
          `Course not found with ID: ${courseId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Ensure module exists
      const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (!module) {
        throw new HttpException(
          `Module not found with ID: ${moduleId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Access control: check if requester can link this module
      if (requesterId && module.visibility === 'private' && module.authorId !== requesterId) {
        throw new HttpException(
          `Access denied: Cannot link private module "${module.title}" (owned by another user)`,
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if already linked
      let link = await this.courseModuleRepo.findOne({ where: { courseId, moduleId } });
      if (!link) {
        link = this.courseModuleRepo.create({ courseId, moduleId, sortOrder, isRequired });
        console.log(`[CoursesService:linkModuleToCourse] Linking module ${moduleId} to course ${courseId}`);
      } else {
        link.sortOrder = sortOrder;
        link.isRequired = isRequired;
        console.log(`[CoursesService:linkModuleToCourse] Updating existing link for module ${moduleId} in course ${courseId}`);
      }

      return this.courseModuleRepo.save(link);
    } catch (error) {
      this.logError('linkModuleToCourse', error, { courseId, moduleId, sortOrder, requesterId });
      throw error;
    }
  }

  async updateCourseModule(courseId: string, moduleId: string, patch: { sortOrder?: number; isRequired?: boolean }): Promise<CourseModuleJoin> {
    const link = await this.courseModuleRepo.findOne({ where: { courseId, moduleId } });
    if (!link) throw new HttpException('CourseModule link not found', HttpStatus.NOT_FOUND);
    if (typeof patch.sortOrder === 'number') link.sortOrder = patch.sortOrder;
    if (typeof patch.isRequired === 'boolean') link.isRequired = patch.isRequired;
    return this.courseModuleRepo.save(link);
  }

  async unlinkCourseModule(courseId: string, moduleId: string): Promise<{ status: string }> {
    await this.courseModuleRepo.delete({ courseId, moduleId });
    return { status: 'ok' };
  }

  // ---------- Module library with access controls ----------
  async listModules(params: { search?: string; authorId?: string; limit?: number; offset?: number; requesterId?: string }) {
    const qb = this.moduleRepository.createQueryBuilder('m');
    if (params.search) qb.andWhere('m.title ILIKE :q OR m.summary ILIKE :q', { q: `%${params.search}%` });
    
    // Visibility/licensing access control
    if (params.requesterId) {
      qb.andWhere(
        '(m.visibility = :public OR m.authorId = :requester OR m.visibility = :shared)',
        { public: 'public', requester: params.requesterId, shared: 'shared' }
      );
    } else {
      // No requester = only public modules
      qb.andWhere('m.visibility = :public', { public: 'public' });
    }
    
    if (params.authorId) qb.andWhere('m.authorId = :a', { a: params.authorId });
    qb.orderBy('m.updated_at', 'DESC');
    const items = await qb.take(params.limit ?? 20).skip(params.offset ?? 0).getMany();
    const total = await qb.getCount();
    return { items, total };
  }

  async createModule(payload: Partial<Module>): Promise<Module> {
    const mod = this.moduleRepository.create({
      title: payload.title!,
      summary: payload.summary ?? null,
      authorId: payload.authorId ?? null,
      visibility: (payload as any).visibility ?? 'private',
      thumbnail: payload.thumbnail ?? null,
      estimatedDurationMin: payload.estimatedDurationMin ?? null,
      tags: payload.tags ?? null,
      courseId: null,
      orderIndex: payload.orderIndex ?? 0,
    });
    return this.moduleRepository.save(mod);
  }

  // ---------- Lessons ----------
  async createLesson(moduleId: string, payload: Partial<Lesson>): Promise<Lesson> {
    try {
      // Validate module ID
      this.validateUUID(moduleId, 'Module ID');

      // Validate module exists
      const mod = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (!mod) {
        throw new HttpException(
          `Module not found with ID: ${moduleId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Validate lesson title
      const title = (payload as any).title || 'Untitled Lesson';
      if (title.length > 200) {
        throw new HttpException(
          'Lesson title must not exceed 200 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate completion mode
      const completionMode = (payload as any).completionMode || 'required';
      if (!['required', 'optional', 'manual'].includes(completionMode)) {
        throw new HttpException(
          'Completion mode must be one of: required, optional, manual',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate percentage fields
      if ((payload as any).minimumWatchPercent !== undefined && (payload as any).minimumWatchPercent !== null) {
        const watchPercent = Number((payload as any).minimumWatchPercent);
        if (!Number.isFinite(watchPercent) || watchPercent < 0 || watchPercent > 100) {
          throw new HttpException(
            'Minimum watch percent must be between 0 and 100',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if ((payload as any).minimumQuizScore !== undefined && (payload as any).minimumQuizScore !== null) {
        const quizScore = Number((payload as any).minimumQuizScore);
        if (!Number.isFinite(quizScore) || quizScore < 0 || quizScore > 100) {
          throw new HttpException(
            'Minimum quiz score must be between 0 and 100',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      
      // Handle duration normalization
      const rawDuration =
        (payload as any).durationSeconds ??
        (payload as any).videoDuration ??
        (payload as any).durationMinutes ??
        (payload as any).estimatedDurationMin ??
        null;
      const durationSeconds =
        rawDuration === null || rawDuration === undefined ? null : Number(rawDuration) * ((payload as any).durationMinutes || (payload as any).estimatedDurationMin ? 60 : 1);
      const normalizedDuration = Number.isFinite(durationSeconds) ? durationSeconds : null;

      const lesson = this.lessonRepository.create({
        moduleId,
        title,
        orderIndex: (payload as any).order_within_module ?? 0,
        type: (payload as any).type ?? 'video',
        videoUrl: (payload as any).video_url ?? (payload as any).videoUrl ?? (payload as any).contentUrl ?? null,
        videoDuration: normalizedDuration,
        isPreview: (payload as any).isPreview ?? false,
        isPublished: (payload as any).isPublished ?? false,
        hasQuiz: (payload as any).hasQuiz ?? false,
        content: (payload as any).content ?? null,
        transcript: (payload as any).transcript ?? null,
        resourceLinks: (payload as any).resourceLinks ?? null,
        completionMode: completionMode,
        minimumWatchPercent: (payload as any).minimumWatchPercent ?? null,
        minimumQuizScore: (payload as any).minimumQuizScore ?? null,
      } as any);
      
      const saved = await (this.lessonRepository.save(lesson as any) as unknown as Promise<Lesson>);
      console.log(`[CoursesService:createLesson] Lesson created successfully: ${saved.id} in module ${moduleId}`);
      
      return saved;
    } catch (error) {
      this.logError('createLesson', error, { moduleId, payload });
      throw error;
    }
  }

  async updateLesson(lessonId: string, patch: Partial<Lesson>): Promise<Lesson> {
    try {
      // Validate lesson ID
      this.validateUUID(lessonId, 'Lesson ID');

      // Check if lesson exists first
      const existing = await this.lessonRepository.findOne({ where: { id: lessonId } });
      if (!existing) {
        throw new HttpException(
          `Lesson not found with ID: ${lessonId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Map contentUrl to videoUrl since contentUrl is a virtual property
      const updateData: any = { ...patch };
      
      if ('contentUrl' in updateData) {
        updateData.videoUrl = updateData.contentUrl;
        delete updateData.contentUrl;
      }
      
      if ('durationSeconds' in updateData) {
        const raw = updateData.durationSeconds;
        const seconds = raw === null || raw === undefined ? null : Number(raw);
        updateData.videoDuration = Number.isFinite(seconds) ? seconds : null;
        delete updateData.durationSeconds;
      }
      
      if ('durationMinutes' in updateData || 'estimatedDurationMin' in updateData) {
        const minutes = Number(updateData.durationMinutes ?? updateData.estimatedDurationMin);
        updateData.videoDuration = Number.isFinite(minutes) ? minutes * 60 : null;
        delete updateData.durationMinutes;
        delete updateData.estimatedDurationMin;
      }
      
      if ('visibility' in updateData) {
        updateData.isPublished = updateData.visibility === 'Published';
        delete updateData.visibility;
      }
      
      // Validate percentage fields
      if ('minimumWatchPercent' in updateData) {
        const numericValue = Number(updateData.minimumWatchPercent);
        if (numericValue !== null && (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100)) {
          throw new HttpException(
            'Minimum watch percent must be between 0 and 100',
            HttpStatus.BAD_REQUEST,
          );
        }
        updateData.minimumWatchPercent = Number.isFinite(numericValue) ? numericValue : null;
      }
      
      if ('minimumQuizScore' in updateData) {
        const numericValue = Number(updateData.minimumQuizScore);
        if (numericValue !== null && (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100)) {
          throw new HttpException(
            'Minimum quiz score must be between 0 and 100',
            HttpStatus.BAD_REQUEST,
          );
        }
        updateData.minimumQuizScore = Number.isFinite(numericValue) ? numericValue : null;
      }

      // Validate completion mode if provided
      if ('completionMode' in updateData) {
        if (!['required', 'optional', 'manual'].includes(updateData.completionMode)) {
          throw new HttpException(
            'Completion mode must be one of: required, optional, manual',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      
      await this.lessonRepository.update(lessonId, updateData);
      const updated = await this.lessonRepository.findOne({ where: { id: lessonId } });
      
      console.log(`[CoursesService:updateLesson] Lesson updated successfully: ${lessonId}`);
      
      return updated!;
    } catch (error) {
      this.logError('updateLesson', error, { lessonId, patch });
      throw error;
    }
  }

  async deleteLesson(lessonId: string): Promise<{ status: string }> {
    await this.lessonRepository.delete(lessonId);
    return { status: 'ok' };
  }

  async reorderLessons(moduleId: string, lessonOrders: { lessonId: string; orderIndex: number }[]): Promise<{ status: string }> {
    // Update order indices for lessons in a module
    await Promise.all(
      lessonOrders.map(({ lessonId, orderIndex }) =>
        this.lessonRepository.update(lessonId, { orderIndex })
      )
    );
    return { status: 'ok' };
  }

  // ---------- Module snapshots for versioning ----------
  async snapshotModule(moduleId: string, authorId?: string): Promise<Module> {
    try {
      this.validateUUID(moduleId, 'Module ID');

      const original = await this.moduleRepository.findOne({ 
        where: { id: moduleId }, 
        relations: ['lessons'] 
      });
      
      if (!original) {
        throw new HttpException(
          `Module not found with ID: ${moduleId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Create snapshot copy with version timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const snapshot = this.moduleRepository.create({
        title: `${original.title} (Snapshot ${timestamp})`,
        summary: original.summary,
        authorId: authorId || original.authorId,
        visibility: 'private', // snapshots are always private
        thumbnail: original.thumbnail,
        estimatedDurationMin: original.estimatedDurationMin,
        tags: original.tags ? [...original.tags] : null,
        courseId: null, // snapshots are not directly linked to courses
        orderIndex: 0,
      });
      const savedSnapshot = await this.moduleRepository.save(snapshot);

      // Copy lessons with all metadata
      if (original.lessons?.length) {
        for (const lesson of original.lessons) {
          const lessonCopy = this.lessonRepository.create({
            moduleId: savedSnapshot.id,
            title: lesson.title,
            type: lesson.type,
            orderIndex: lesson.orderIndex,
            videoUrl: lesson.videoUrl,
            videoDuration: lesson.videoDuration,
            isPreview: lesson.isPreview,
            isPublished: lesson.isPublished,
            hasQuiz: lesson.hasQuiz,
            content: lesson.content,
            transcript: lesson.transcript,
            resourceLinks: lesson.resourceLinks ? [...lesson.resourceLinks] : null,
            completionMode: lesson.completionMode || 'required',
            minimumWatchPercent: lesson.minimumWatchPercent,
            minimumQuizScore: lesson.minimumQuizScore,
          } as any);
          await this.lessonRepository.save(lessonCopy);
        }
      }

      console.log(`[CoursesService:snapshotModule] Module snapshot created: ${savedSnapshot.id} from ${moduleId}`);

      return savedSnapshot;
    } catch (error) {
      this.logError('snapshotModule', error, { moduleId, authorId });
      throw error;
    }
  }

  async snapshotCourseModules(courseId: string): Promise<{ status: string; snapshots: number }> {
    try {
      this.validateUUID(courseId, 'Course ID');

      // When publishing a course, create snapshots of all linked modules
      const courseModules = await this.courseModuleRepo.find({ 
        where: { courseId },
        relations: ['module', 'module.lessons']
      });

      if (courseModules.length === 0) {
        console.log(`[CoursesService:snapshotCourseModules] No modules to snapshot for course ${courseId}`);
        return { status: 'ok', snapshots: 0 };
      }

      let snapshotCount = 0;
      for (const cm of courseModules) {
        if (cm.module) {
          const snapshot = await this.snapshotModule(cm.module.id);
          // Update the course-module link to point to the snapshot
          cm.moduleId = snapshot.id;
          await this.courseModuleRepo.save(cm);
          snapshotCount++;
        }
      }

      console.log(`[CoursesService:snapshotCourseModules] Created ${snapshotCount} snapshots for course ${courseId}`);

      return { status: 'ok', snapshots: snapshotCount };
    } catch (error) {
      this.logError('snapshotCourseModules', error, { courseId });
      throw error;
    }
  }

  // ---------- AI outline stub ----------
  async aiGenerateOutline(prompt: string) {
    // simple deterministic placeholder
    return {
      modules: [
        { title: 'Introduction', lessons: [{ title: 'Welcome' }, { title: 'What you will learn' }] },
        { title: 'Core Concepts', lessons: [{ title: 'Principle 1' }, { title: 'Principle 2' }] },
        { title: 'Capstone', lessons: [{ title: 'Project Walkthrough' }] },
      ],
      prompt,
    };
  }

  async findAll(): Promise<Course[]> {
    const courses = await this.coursesRepository.find({
      relations: ['instructor', 'modules'],
    });
    
    return courses;
  }

  async findByCategory(category: string): Promise<Course[]> {
    const courses = await this.coursesRepository.find({
      where: { category: category as any },
      relations: ['instructor', 'modules'],
    });
    
    return courses;
  }

  async findOne(id: string): Promise<Course> {
    try {
      this.validateUUID(id, 'Course ID');

      const course = await this.coursesRepository.findOne({
        where: { id },
        relations: ['instructor', 'modules', 'modules.lessons'],
      });
      
      if (!course) {
        throw new HttpException(
          `Course not found with ID: ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Transform and normalize data
      if (course.modules) {
        course.modules = course.modules.map((module) => {
          // Normalize module data
          if (module.lessons) {
            module.lessons = module.lessons.map((lesson) => {
              // Normalize lesson duration fields
              const normalized = { ...lesson } as any;
              
              // Map videoDuration to multiple field names for compatibility
              if (lesson.videoDuration !== undefined && lesson.videoDuration !== null) {
                normalized.durationSeconds = lesson.videoDuration;
                normalized.durationMinutes = Math.round(lesson.videoDuration / 60);
                normalized.estimatedDurationMin = Math.round(lesson.videoDuration / 60);
              }

              // Map videoUrl to contentUrl for frontend compatibility
              if (lesson.videoUrl) {
                normalized.contentUrl = lesson.videoUrl;
              }

              // Ensure resourceLinks is always an array
              if (!normalized.resourceLinks) {
                normalized.resourceLinks = [];
              }

              // Ensure completionMode has a default
              if (!normalized.completionMode) {
                normalized.completionMode = 'required';
              }

              return normalized;
            });
          }

          return module;
        });
      }

      console.log(`[CoursesService:findOne] Course retrieved successfully: ${id}`);
      
      return course;
    } catch (error) {
      this.logError('findOne', error, { courseId: id });
      throw error;
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    await this.coursesRepository.update(id, updateCourseDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.coursesRepository.delete(id);
  }

  async publish(id: string): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.DRAFT) {
      throw new HttpException('Only draft courses can be published', HttpStatus.BAD_REQUEST);
    }
    
    await this.coursesRepository.update(id, { status: CourseStatus.PUBLISHED });
    return this.findOne(id);
  }

  async findByInstructor(instructorId: string): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { instructorId },
      relations: ['modules'],
    });
  }

  async search(query: string): Promise<Course[]> {
    return this.coursesRepository
      .createQueryBuilder('course')
      .where('course.title ILIKE :query OR course.description ILIKE :query', {
        query: `%${query}%`,
      })
      .getMany();
  }

  // ---------- Lesson Access Control & Sequential Learning ----------
  async checkLessonAccess(userId: string, courseId: string, lessonId: string): Promise<{
    hasAccess: boolean;
    reason?: string;
    requiresPreviousLesson?: boolean;
    previousLessonId?: string;
    requiresQuizScore?: number;
    currentBestScore?: number;
  }> {
    // Get the lesson
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['module'],
    });
    if (!lesson) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }

    // Get the course with completion rules
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Check if user is enrolled
    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
    });

    // If not enrolled, only first lesson is accessible
    if (!enrollment) {
      const allLessons = course.modules
        .flatMap(m => m.lessons || [])
        .sort((a, b) => {
          const modA = course.modules.find(m => m.id === a.moduleId);
          const modB = course.modules.find(m => m.id === b.moduleId);
          if (modA && modB && modA.orderIndex !== modB.orderIndex) {
            return modA.orderIndex - modB.orderIndex;
          }
          return a.orderIndex - b.orderIndex;
        });

      const isFirstLesson = allLessons.length > 0 && allLessons[0].id === lessonId;
      if (isFirstLesson) {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        reason: 'You must enroll in this course to access this lesson',
      };
    }

    // If course has free progression, all lessons are accessible
    // Note: completionRules not yet implemented in Course entity, defaulting to sequential
    const progression = (course as any).completionRules?.progression || 'sequential';
    if (progression === 'free') {
      return { hasAccess: true };
    }

    // Sequential learning: check if previous lessons are completed
    const allLessons = course.modules
      .flatMap(m => m.lessons || [])
      .sort((a, b) => {
        const modA = course.modules.find(m => m.id === a.moduleId);
        const modB = course.modules.find(m => m.id === b.moduleId);
        if (modA && modB && modA.orderIndex !== modB.orderIndex) {
          return modA.orderIndex - modB.orderIndex;
        }
        return a.orderIndex - b.orderIndex;
      });

    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) {
      throw new HttpException('Lesson not found in course', HttpStatus.NOT_FOUND);
    }

    // First lesson is always accessible
    if (currentIndex === 0) {
      return { hasAccess: true };
    }

    // Check if previous lesson is completed
    const previousLesson = allLessons[currentIndex - 1];
    const previousProgress = await this.lessonProgressRepo.findOne({
      where: { userId, lessonId: previousLesson.id },
    });

    if (!previousProgress || !previousProgress.isCompleted) {
      return {
        hasAccess: false,
        reason: 'You must complete the previous lesson first',
        requiresPreviousLesson: true,
        previousLessonId: previousLesson.id,
      };
    }

    // Check if previous lesson had quiz requirements
    if (previousLesson.hasQuiz && previousLesson.minimumQuizScore) {
      const bestScore = previousProgress.bestQuizScore || 0;
      if (bestScore < previousLesson.minimumQuizScore) {
        return {
          hasAccess: false,
          reason: `You must score at least ${previousLesson.minimumQuizScore}% on the previous lesson's quiz`,
          requiresQuizScore: previousLesson.minimumQuizScore,
          currentBestScore: bestScore,
        };
      }
    }

    return { hasAccess: true };
  }

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    updates: {
      watchPercent?: number;
      quizScore?: number;
      isCompleted?: boolean;
    }
  ): Promise<LessonProgress> {
    let progress = await this.lessonProgressRepo.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      progress = this.lessonProgressRepo.create({
        userId,
        lessonId,
        watchPercent: 0,
        quizAttempts: 0,
      });
    }

    // Update watch percent
    if (updates.watchPercent !== undefined) {
      progress.watchPercent = Math.max(progress.watchPercent, updates.watchPercent);
    }

    // Update quiz score
    if (updates.quizScore !== undefined) {
      progress.quizAttempts += 1;
      progress.lastQuizAttemptAt = new Date();
      if (!progress.bestQuizScore || updates.quizScore > progress.bestQuizScore) {
        progress.bestQuizScore = updates.quizScore;
      }
    }

    // Update completion status
    if (updates.isCompleted !== undefined && updates.isCompleted) {
      progress.isCompleted = true;
      if (!progress.completedAt) {
        progress.completedAt = new Date();
      }
    }

    return this.lessonProgressRepo.save(progress);
  }

}
