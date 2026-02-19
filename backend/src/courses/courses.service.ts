import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseModule as CourseModuleJoin } from './entities/course-module.entity';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create(createCourseDto);
    return this.coursesRepository.save(course);
  }

  // ---------- Many-to-many Course <-> Module linking ----------
  async linkModuleToCourse(courseId: string, moduleId: string, sortOrder: number, isRequired = true, requesterId?: string): Promise<CourseModuleJoin> {
    // ensure course and module exist
    const course = await this.coursesRepository.findOne({ where: { id: courseId } });
    if (!course) throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
    if (!module) throw new HttpException('Module not found', HttpStatus.NOT_FOUND);

    // Access control: check if requester can link this module
    if (requesterId && module.visibility === 'private' && module.authorId !== requesterId) {
      throw new HttpException('Access denied: Cannot link private module', HttpStatus.FORBIDDEN);
    }

    let link = await this.courseModuleRepo.findOne({ where: { courseId, moduleId } });
    if (!link) {
      link = this.courseModuleRepo.create({ courseId, moduleId, sortOrder, isRequired });
    } else {
      link.sortOrder = sortOrder;
      link.isRequired = isRequired;
    }
    return this.courseModuleRepo.save(link);
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
    const mod = await this.moduleRepository.findOne({ where: { id: moduleId } });
    if (!mod) throw new HttpException('Module not found', HttpStatus.NOT_FOUND);
    const lesson = this.lessonRepository.create({
      moduleId,
      title: (payload as any).title ?? 'Untitled Lesson',
      orderIndex: (payload as any).order_within_module ?? 0,
      type: (payload as any).type ?? 'video',
      videoUrl: (payload as any).video_url ?? (payload as any).videoUrl ?? (payload as any).contentUrl ?? null,
      durationSeconds: (payload as any).durationSeconds ?? 0,
      isPreview: (payload as any).isPreview ?? false,
      content: (payload as any).content ?? null,
    } as any);
    const saved = await (this.lessonRepository.save(lesson as any) as unknown as Promise<Lesson>);
    return saved;
  }

  async updateLesson(lessonId: string, patch: Partial<Lesson>): Promise<Lesson> {
    // Map contentUrl to videoUrl since contentUrl is a virtual property
    const updateData: any = { ...patch };
    if ('contentUrl' in updateData) {
      updateData.videoUrl = updateData.contentUrl;
      delete updateData.contentUrl;
    }
    
    await this.lessonRepository.update(lessonId, updateData);
    const updated = await this.lessonRepository.findOne({ where: { id: lessonId } });
    if (!updated) throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    return updated;
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
    const original = await this.moduleRepository.findOne({ 
      where: { id: moduleId }, 
      relations: ['lessons'] 
    });
    if (!original) throw new HttpException('Module not found', HttpStatus.NOT_FOUND);

    // Create snapshot copy
    const snapshot = this.moduleRepository.create({
      title: `${original.title} (Snapshot)`,
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

    // Copy lessons
    if (original.lessons?.length) {
      for (const lesson of original.lessons) {
        const lessonCopy = this.lessonRepository.create({
          moduleId: savedSnapshot.id,
          title: lesson.title,
          type: lesson.type,
          orderIndex: lesson.orderIndex,
          durationSeconds: lesson.durationSeconds,
          isPreview: lesson.isPreview,
          content: lesson.content,
          contentUrl: lesson.contentUrl,
        });
        await this.lessonRepository.save(lessonCopy);
      }
    }

    return savedSnapshot;
  }

  async snapshotCourseModules(courseId: string): Promise<{ status: string; snapshots: number }> {
    // When publishing a course, create snapshots of all linked modules
    const courseModules = await this.courseModuleRepo.find({ 
      where: { courseId },
      relations: ['module']
    });

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

    return { status: 'ok', snapshots: snapshotCount };
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
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules', 'modules.lessons'],
    });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    
    return course;
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

}
