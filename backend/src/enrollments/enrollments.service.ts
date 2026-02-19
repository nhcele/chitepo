import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { CertificatesService } from '../certificates/certificates.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsEventType, CreateAnalyticsEventDto, CreateCertificateDto, CourseStatus } from '@mindelta/shared';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly certificatesService: CertificatesService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async enroll(userId: string, courseId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.UNAUTHORIZED);
    }

    if (!courseId) {
      throw new HttpException('Course ID is required', HttpStatus.BAD_REQUEST);
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Check if course is published
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new HttpException(
        `Course is not published. Current status: ${course.status}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Check if already enrolled (idempotent)
    let enrollment = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
    if (enrollment) {
      return enrollment; // Return existing enrollment
    }

    // Create new enrollment
    enrollment = this.enrollmentRepo.create({
      userId,
      courseId,
      progressPercent: 0,
      enrolledAt: new Date(),
    });

    const saved = await this.enrollmentRepo.save(enrollment);

    // increment course totalEnrollments
    await this.courseRepo.increment({ id: courseId }, 'totalEnrollments', 1);

    // send notification (best effort)
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        await this.notificationsService.sendCourseEnrollmentEmail(user.email, user.name || 'Learner', course.title);
      }
    } catch {}

    // analytics
    try {
      const event: CreateAnalyticsEventDto = {
        eventType: AnalyticsEventType.COURSE_ENROLLED,
        userId,
        courseId,
        sessionId: 'server',
        metadata: { courseTitle: course.title },
      };
      await this.analyticsService.trackEvent(event);
    } catch {}

    return saved;
  }

  async listMyEnrollments(userId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.UNAUTHORIZED);
    }
    try {
      // Use raw query to avoid any entity relation issues
      // Note: created_at and updated_at don't exist in the database schema
      const enrollments = await this.dataSource.query(
        `SELECT 
          id,
          user_id as userId,
          course_id as courseId,
          enrolled_at as enrolledAt,
          completed_at as completedAt,
          progress_percentage as progressPercentage,
          last_lesson_seen_at as lastLessonSeenAt
        FROM enrollments 
        WHERE user_id = ?
        ORDER BY enrolled_at DESC`,
        [userId]
      );
      
      // Convert progressPercentage to number and add progressPercent
      return enrollments.map((e: any) => ({
        ...e,
        progressPercentage: Number(e.progressPercentage) || 0,
        progressPercent: Number(e.progressPercentage) || 0,
        enrolledAt: e.enrolledAt ? new Date(e.enrolledAt) : null,
        completedAt: e.completedAt ? new Date(e.completedAt) : null,
        lastLessonSeenAt: e.lastLessonSeenAt ? new Date(e.lastLessonSeenAt) : null,
      }));
    } catch (error: any) {
      console.error('Error listing enrollments:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        sql: error?.sql,
        parameters: error?.parameters,
      });
      throw new HttpException(
        error?.message || 'Failed to retrieve enrollments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getMyEnrollmentForCourse(userId: string, courseId: string) {
    return this.enrollmentRepo.findOne({ where: { userId, courseId } });
  }

  async updateProgress(enrollmentId: string, userId: string, progressPercent: number, lastLessonSeenAt?: Date) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.userId !== userId) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    const now = new Date();
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const becameComplete = !enrollment.completedAt && clamped >= 100;

    enrollment.progressPercent = clamped;
    if (lastLessonSeenAt) enrollment.lastLessonSeenAt = lastLessonSeenAt;
    if (becameComplete) enrollment.completedAt = now;

    const saved = await this.enrollmentRepo.save(enrollment);

    // Track completion event
    try {
      if (becameComplete) {
        const event: CreateAnalyticsEventDto = {
          eventType: AnalyticsEventType.COURSE_COMPLETED,
          userId,
          courseId: enrollment.courseId,
          sessionId: 'server',
          metadata: { progressPercent: clamped },
        };
        await this.analyticsService.trackEvent(event);
      }
    } catch {}

    // On completion issue certificate
    if (becameComplete) {
      try {
        const dto: CreateCertificateDto = {
          userId,
          courseId: enrollment.courseId,
          finalScore: 100,
          skillsTags: [],
        } as any;
        await this.certificatesService.create(dto);
      } catch (e) {
        // non-fatal
      }
    }

    return saved;
  }
}
