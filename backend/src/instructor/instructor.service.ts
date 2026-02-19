import { Injectable, HttpException, HttpStatus, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics/analytics.service';
import { InstructorApplication, InstructorApplicationStatus } from './entities/instructor-application.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { CourseStatus } from '@mindelta/shared';

@Injectable()
export class InstructorService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectRepository(InstructorApplication) private readonly appRepo: Repository<InstructorApplication>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Progress) private readonly progressRepo: Repository<Progress>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(body: any) {
    // Accept current frontend payload which nests agreements
    const agreeTos = body.agreements?.tos ?? body.agreeTos ?? false;
    const agreeOwnership = body.agreements?.ownership ?? body.agreeOwnership ?? false;
    const agreeRevenueShare = body.agreements?.revenue ?? body.agreeRevenueShare ?? false;
    const app = this.appRepo.create({
      fullName: body.fullName,
      email: body.email,
      bio: body.bio,
      sampleVideoUrl: body.sampleVideoUrl,
      socials: body.socials,
      agreeTos,
      agreeOwnership,
      agreeRevenueShare,
      status: InstructorApplicationStatus.PENDING,
    });
    const saved = await this.appRepo.save(app);
    // Send confirmation email (best-effort)
    try {
      await this.notifications.sendEmail(
        saved.email,
        'We received your instructor application',
        `<p>Hi ${saved.fullName},</p><p>Thanks for applying to teach on Mindelta. Our team will review your application and get back within 3 business days.</p>`
      );
    } catch {}
    return { status: 'received', id: saved.id };
  }

  async listMyCourses(instructorId: string, userRole?: string) {
    if (!instructorId) {
      throw new Error('Instructor ID is required');
    }
    
    let items: Course[];
    let total: number;
    
    // If user is admin or super_admin, return all courses
    if (userRole === 'admin' || userRole === 'super_admin') {
      [items, total] = await this.courseRepo.findAndCount({
        order: { createdAt: 'DESC' },
        relations: ['instructor', 'modules'],
      });
    } else {
      // Otherwise, return only instructor's courses
      [items, total] = await this.courseRepo.findAndCount({
        where: { instructorId },
        order: { createdAt: 'DESC' },
        relations: ['instructor', 'modules'],
      });
    }
    
    // Get actual enrollment counts for each course
    const itemsWithActualCounts = await Promise.all(
      items.map(async (course) => {
        const enrollmentCount = await this.enrollmentRepo.count({
          where: { courseId: course.id },
        });
        
        // Override the stale totalEnrollments with actual count
        return {
          ...course,
          totalEnrollments: enrollmentCount,
        };
      }),
    );
    
    return { items: itemsWithActualCounts, total };
  }

  async createCourse(body: any, instructorId: string): Promise<Course> {
    const course = this.courseRepo.create({
      ...body,
      instructorId,
      difficulty: body.difficulty || 'beginner',
      price: body.price || 0,
      status: CourseStatus.DRAFT,
    });
    
    const result = await this.courseRepo.save(course);
    const savedCourse = Array.isArray(result) ? result[0] : result;
    
    // Send notification to instructor
    try {
      await this.notifications.sendEmail(
        'instructor@mindelta.com', // This should be fetched from user table
        'Course Created Successfully',
        `<p>Your course "${savedCourse.title}" has been created as a draft. You can now add modules and lessons.</p>`
      );
    } catch {}
    
    return savedCourse;
  }

  async getCourse(id: string, userId: string, userRole?: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['instructor', 'modules', 'modules.lessons'],
    });
    
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    
    // Allow admins and super_admins to view any course
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      // Regular instructors can only view their own courses
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You can only view your own courses');
      }
    }
    
    // Manually add contentUrl to lessons since it's a virtual property
    if (course.modules) {
      course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons = module.lessons.map(lesson => ({
            ...lesson,
            contentUrl: lesson.videoUrl || lesson.content,
            durationSeconds: lesson.durationSeconds,
          }));
        }
      });
    }
    
    return course;
  }

  async updateCourse(id: string, body: any, instructorId: string, userRole?: string) {
    if (!instructorId) {
      throw new Error('Instructor ID is required');
    }
    
    const course = await this.courseRepo.findOne({
      where: { id },
    });
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // Allow admins and super_admins to update any course
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      // Regular instructors can only update their own courses
      if (course.instructorId !== instructorId) {
        throw new BadRequestException('You can only update your own courses');
      }
    }
    
    // Don't allow status updates through this method
    const { status, ...updateData } = body;
    
    Object.assign(course, updateData);
    const updatedCourse = await this.courseRepo.save(course);
    
    return updatedCourse;
  }

  async submitForReview(id: string, instructorId: string) {
    if (!instructorId) {
      throw new Error('Instructor ID is required');
    }
    
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['modules', 'modules.lessons'],
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    if (course.instructorId !== instructorId) {
      throw new BadRequestException('You can only submit your own courses for review');
    }
    
    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException('Only draft courses can be submitted for review');
    }
    
    // Basic validation before submission
    if (!course.title || !course.description) {
      throw new BadRequestException('Course must have a title and description');
    }
    
    if (!course.modules || course.modules.length === 0) {
      throw new BadRequestException('Course must have at least one module');
    }
    
    // Check if modules have lessons
    const hasLessons = course.modules.some(module => module.lessons && module.lessons.length > 0);
    if (!hasLessons) {
      throw new BadRequestException('Course must have at least one lesson');
    }
    
    course.status = CourseStatus.REVIEW;
    const updatedCourse = await this.courseRepo.save(course);
    
    // Send notification to admin for review
    try {
      await this.notifications.sendEmail(
        'admin@mindelta.com',
        'Course Submitted for Review',
        `<p>A new course "${course.title}" has been submitted for review by instructor ${instructorId}.</p><p>Please review the course content and approve or reject it.</p>`
      );
    } catch {}
    
    return updatedCourse;
  }

  async getCourseAnalytics(courseId: string) {
    const summary = await this.analyticsService.getCourseSummary(courseId);
    return summary;
  }

  async getInstructorMetrics(instructorId: string) {
    const publishedCourses = await this.courseRepo.count({ where: { instructorId, status: CourseStatus.PUBLISHED } });
    const totalLearners = await this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoin(Course, 'c', 'c.id = e.course_id')
      .where('c.instructor_id = :instructorId', { instructorId })
      .getCount();
    const enrollments = await this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.course', 'c')
      .where('c.instructor_id = :instructorId', { instructorId })
      .getMany();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const monthlyRevenue = enrollments
      .filter((e) => e.enrolledAt && e.enrolledAt >= since)
      .reduce((sum, e) => sum + Number(e.course?.price || 0), 0);
    return { publishedCourses, totalLearners, monthlyRevenue };
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return this.courseRepo.find({
      where: { instructorId },
      relations: ['modules'],
    });
  }

  async createDraftCourse(createCourseDto: any, instructorId: string): Promise<Course> {
    const course = this.courseRepo.create({
      ...createCourseDto,
      instructorId,
      status: CourseStatus.DRAFT,
    });
    const saved = await this.courseRepo.save(course);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getInstructorStats(instructorId: string) {
    const courses = await this.courseRepo.find({ where: { instructorId } });
    const enrollments = await this.enrollmentRepo.find({
      where: { course: { instructorId } },
      relations: ['course'],
    });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === CourseStatus.PUBLISHED).length;
    const totalEnrollments = enrollments.length;
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);

    return {
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue,
    };
  }

  async createApplication(createApplicationDto: any, userId: string): Promise<InstructorApplication> {
    const application = this.appRepo.create({
      ...createApplicationDto,
      userId,
      status: InstructorApplicationStatus.PENDING,
    });
    const saved = await this.appRepo.save(application);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getApplications(): Promise<InstructorApplication[]> {
    return this.appRepo.find({
      relations: ['user'],
    });
  }

  async approveApplication(applicationId: string): Promise<InstructorApplication> {
    const application = await this.appRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    
    application.status = InstructorApplicationStatus.APPROVED;
    const saved = await this.appRepo.save(application);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async rejectApplication(applicationId: string, reason?: string): Promise<InstructorApplication> {
    const application = await this.appRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    
    application.status = InstructorApplicationStatus.REJECTED;
    const saved = await this.appRepo.save(application);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Get all students enrolled in a course with their progress
   */
  async getCourseStudents(courseId: string, instructorId: string, userRole?: string) {
    // Verify instructor owns the course
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Allow admins and super_admins to view any course students
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      if (course.instructorId !== instructorId) {
        throw new ForbiddenException('You can only view students for your own courses');
      }
    }

    // Get all enrollments for this course
    const enrollments = await this.enrollmentRepo.find({
      where: { courseId },
      relations: ['user'],
      order: { enrolledAt: 'DESC' },
    });

    // Get progress data for each student
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        let progressRecords = [];
        let totalWatchTime = 0;
        let completedLessons = 0;
        let averageScore = 0;
        let totalLessons = 0;

        // Try to get progress records, but handle gracefully if table doesn't exist
        try {
          progressRecords = await this.progressRepo.find({
            where: { userId: enrollment.userId, courseId },
            order: { lastAccessed: 'DESC' },
          });

          totalWatchTime = progressRecords.reduce((sum, p) => sum + (p.watchTime || 0), 0);
          completedLessons = progressRecords.filter((p) => p.completed).length;
          averageScore = progressRecords.length > 0
            ? progressRecords.reduce((sum, p) => sum + (Number(p.score) || 0), 0) / progressRecords.length
            : 0;
          totalLessons = progressRecords.length;
        } catch (error) {
          // Progress table doesn't exist or query failed - use enrollment data only
          console.warn(`Could not fetch progress for user ${enrollment.userId}:`, error.message);
        }

        const lastActivity = progressRecords.length > 0
          ? progressRecords[0].lastAccessed || enrollment.lastLessonSeenAt
          : enrollment.lastLessonSeenAt;

        return {
          enrollmentId: enrollment.id,
          studentId: enrollment.userId,
          student: {
            id: enrollment.user?.id,
            name: enrollment.user?.name,
            email: enrollment.user?.email,
          },
          enrolledAt: enrollment.enrolledAt,
          progressPercentage: enrollment.progressPercentage || 0,
          completedAt: enrollment.completedAt,
          lastActivity,
          totalWatchTime,
          completedLessons,
          averageScore,
          totalLessons,
        };
      }),
    );

    return {
      courseId,
      courseTitle: course.title,
      totalStudents: studentsWithProgress.length,
      students: studentsWithProgress,
    };
  }

  /**
   * Get detailed progress for a specific student in a course
   */
  async getStudentProgress(courseId: string, studentId: string, instructorId: string, userRole?: string) {
    // Verify instructor owns the course
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Allow admins and super_admins to view any student progress
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      if (course.instructorId !== instructorId) {
        throw new ForbiddenException('You can only view student progress for your own courses');
      }
    }

    // Get enrollment
    const enrollment = await this.enrollmentRepo.findOne({
      where: { courseId, userId: studentId },
      relations: ['user'],
    });

    if (!enrollment) {
      throw new HttpException('Student is not enrolled in this course', HttpStatus.NOT_FOUND);
    }

    // Get all progress records with error handling
    let progressRecords = [];
    try {
      progressRecords = await this.progressRepo.find({
        where: { userId: studentId, courseId },
        order: { lastAccessed: 'DESC' },
      });
    } catch (error) {
      console.warn(`Could not fetch progress records for student ${studentId}:`, error.message);
    }

    // Get course modules and lessons
    const courseWithModules = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });

    // Map progress to lessons
    const lessonProgress = courseWithModules?.modules?.flatMap((module) =>
      module.lessons?.map((lesson) => {
        const progress = progressRecords.find((p) => p.lessonId === lesson.id);
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleTitle: module.title,
          orderIndex: lesson.orderIndex,
          completed: progress?.completed || false,
          watchTime: progress?.watchTime || 0,
          score: progress?.score ? Number(progress.score) : null,
          attempts: progress?.attempts || 0,
          lastAccessed: progress?.lastAccessed || null,
          completionDate: progress?.completionDate || null,
        };
      }) || [],
    ) || [];

    // Calculate statistics
    const totalWatchTime = progressRecords.reduce((sum, p) => sum + (p.watchTime || 0), 0);
    const completedLessons = progressRecords.filter((p) => p.completed).length;
    const totalLessons = lessonProgress.length;
    const averageScore = progressRecords.length > 0
      ? progressRecords.reduce((sum, p) => sum + (Number(p.score) || 0), 0) / progressRecords.length
      : 0;

    return {
      student: {
        id: enrollment.user?.id,
        name: enrollment.user?.name,
        email: enrollment.user?.email,
      },
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        progressPercentage: enrollment.progressPercent,
        completedAt: enrollment.completedAt,
        lastLessonSeenAt: enrollment.lastLessonSeenAt,
      },
      statistics: {
        totalWatchTime, // in seconds
        totalWatchTimeFormatted: this.formatWatchTime(totalWatchTime),
        completedLessons,
        totalLessons,
        completionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        averageScore,
        totalProgressRecords: progressRecords.length,
      },
      lessonProgress,
    };
  }

  /**
   * Get progress summary for all students in a course
   */
  async getCourseProgressSummary(courseId: string, instructorId: string) {
    // Verify instructor owns the course
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You can only view progress for your own courses');
    }

    // Get all enrollments
    const enrollments = await this.enrollmentRepo.find({
      where: { courseId },
    });

    // Get all progress records
    const allProgress = await this.progressRepo.find({
      where: { courseId },
    });

    // Calculate aggregate statistics
    const totalStudents = enrollments.length;
    const completedStudents = enrollments.filter((e) => e.completedAt).length;
    const activeStudents = enrollments.filter(
      (e) => !e.completedAt && e.lastLessonSeenAt && 
      new Date(e.lastLessonSeenAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Active in last 7 days
    ).length;

    const averageProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length
      : 0;

    const totalWatchTime = allProgress.reduce((sum, p) => sum + (p.watchTime || 0), 0);
    const averageWatchTime = totalStudents > 0 ? totalWatchTime / totalStudents : 0;

    const studentsWithScores = allProgress.filter((p) => p.score !== null);
    const averageScore = studentsWithScores.length > 0
      ? studentsWithScores.reduce((sum, p) => sum + Number(p.score), 0) / studentsWithScores.length
      : 0;

    return {
      courseId,
      courseTitle: course.title,
      summary: {
        totalStudents,
        completedStudents,
        activeStudents,
        completionRate: totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
        averageProgress,
        averageWatchTime: this.formatWatchTime(averageWatchTime),
        averageScore,
      },
    };
  }

  private formatWatchTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
