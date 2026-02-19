import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, MoreThan } from 'typeorm';
import { UserRole, CourseStatus } from '@mindelta/shared';
import { UsersService } from '../users/users.service';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { Quiz } from '../assessments/entities/quiz.entity';
import { ExportJob, ExportJobStatus, ExportJobType } from './entities/export-job.entity';
import { SystemSetting } from './entities/system-setting.entity';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { InstructorApplication, InstructorApplicationStatus } from '../instructor/entities/instructor-application.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AnalyticsEvent) private readonly analyticsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(InstructorApplication) private readonly appRepo: Repository<InstructorApplication>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Quiz) private readonly quizRepo: Repository<Quiz>,
    private readonly notifications: NotificationsService,
    @InjectRepository(ExportJob) private readonly exportJobRepo: Repository<ExportJob>,
    @InjectRepository(SystemSetting) private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  async listUsers() {
    const items = await this.usersService.findAll();
    return { items, total: items.length };
  }

  // Settings & Feature Flags
  async getSettings() {
    const rows = await this.settingRepo.find();
    const settings: Record<string, any> = {};
    for (const r of rows) {
      settings[r.key] = this.parseValue(r.value);
    }
    // Provide defaults for common flags if missing
    const defaults: Record<string, any> = {
      'feature.aiCompanionEnabled': true,
      'feature.assessmentsEnabled': true,
      'feature.analyticsEnabled': true,
      'feature.preDownloadEnabled': false,
      'feature.checklistNotificationsEnabled': true,
      'checklistNotifications.thresholds': [1, 50, 100],
    };
    for (const k of Object.keys(defaults)) {
      if (settings[k] === undefined) settings[k] = defaults[k];
    }
    return { settings };
  }

  async setSettings(payload: { settings: Record<string, any> }) {
    const entries = Object.entries(payload?.settings || {});
    for (const [key, val] of entries) {
      let row = await this.settingRepo.findOne({ where: { key } });
      if (!row) {
        row = this.settingRepo.create({ key, value: this.stringifyValue(val) });
      } else {
        row.value = this.stringifyValue(val);
      }
      await this.settingRepo.save(row);
    }
    return this.getSettings();
  }

  private parseValue(v: string | null): any {
    if (v === null || v === undefined) return null;
    try { return JSON.parse(v); } catch { return v; }
  }

  private stringifyValue(v: any): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  }

  private toCsv(rows: (string | number | boolean | null | undefined)[][]) {
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    return rows.map((r) => r.map(esc).join(',')).join('\n');
  }

  async generateUsersCsv() {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' as any } as any });
    const rows: any[] = [[
      'ID', 'Name', 'Email', 'Role', 'Active', 'Created At',
    ]];
    for (const u of users) {
      rows.push([u.id, u.name, u.email, u.role, u.isActive ? 'active' : 'inactive', u.createdAt?.toISOString()]);
    }
    return this.toCsv(rows);
  }

  // Async Export Jobs
  async createExportJob(type: ExportJobType, params: Record<string, any> | null) {
    const job = this.exportJobRepo.create({ type, params: params || null, status: ExportJobStatus.PENDING });
    const saved = await this.exportJobRepo.save(job);
    // Kick off processing, but don't await
    // In a real system, enqueue to a job queue. Here, use setImmediate.
    setImmediate(() => {
      this.processExportJob(saved.id).catch(() => void 0);
    });
    return saved;
  }

  async getExportJob(id: string) {
    return this.exportJobRepo.findOne({ where: { id } });
  }

  private async ensureStorageDir(dir: string) {
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
    }
  }

  private async processExportJob(id: string) {
    const job = await this.exportJobRepo.findOne({ where: { id } });
    if (!job) return;
    job.status = ExportJobStatus.PROCESSING;
    await this.exportJobRepo.save(job);

    try {
      // Generate CSV content based on job.type
      let csv = '';
      if (job.type === 'users') {
        csv = await this.generateUsersCsv();
      } else if (job.type === 'engagement') {
        csv = await this.generateEngagementCsv(job.params?.courseId);
      } else if (job.type === 'quiz-outcomes') {
        csv = await this.generateQuizOutcomesCsv(job.params?.quizId, job.params?.lessonId);
      } else {
        throw new Error('Unsupported export type');
      }

      const storageRoot = path.resolve(process.cwd(), 'storage', 'exports');
      await this.ensureStorageDir(storageRoot);
      const filename = `${job.type}-${job.id}.csv`;
      const filePath = path.join(storageRoot, filename);
      await fsp.writeFile(filePath, csv, 'utf8');

      job.status = ExportJobStatus.COMPLETED;
      job.filePath = filePath;
      job.completedAt = new Date();
      await this.exportJobRepo.save(job);
    } catch (err: any) {
      job.status = ExportJobStatus.FAILED;
      job.error = err?.message || String(err);
      await this.exportJobRepo.save(job);
    }
  }

  async generateEngagementCsv(courseId?: string) {
    // Join enrollments with course and user
    const qb = this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoin('e.user', 'u')
      .innerJoin('e.course', 'c')
      .select([
        'e.id AS id',
        'u.name AS userName',
        'u.email AS userEmail',
        'c.id AS courseId',
        'c.title AS courseTitle',
        'e.progressPercent AS progress',
        'e.completedAt AS completedAt',
        'e.enrolledAt AS enrolledAt',
      ]);
    if (courseId) qb.where('c.id = :courseId', { courseId });
    const rowsData = await qb.getRawMany();
    const rows: any[] = [[
      'Enrollment ID', 'User Name', 'User Email', 'Course ID', 'Course Title', 'Progress %', 'Completed At', 'Enrolled At',
    ]];
    for (const r of rowsData) {
      rows.push([
        r.id, r.userName, r.userEmail, r.courseId, r.courseTitle, r.progress, r.completedAt ? new Date(r.completedAt).toISOString() : '', r.enrolledAt ? new Date(r.enrolledAt).toISOString() : ''
      ]);
    }
    return this.toCsv(rows);
  }

  async generateQuizOutcomesCsv(quizId?: string, lessonId?: string) {
    // Resolve by quizId or by lessonId -> quizzes
    let quizIds: string[] = [];
    if (quizId) {
      quizIds = [quizId];
    } else if (lessonId) {
      const quizzes = await this.quizRepo.find({ where: { lessonId } });
      quizIds = quizzes.map((q) => q.id);
    }

    const qb = this.attemptRepo
      .createQueryBuilder('a')
      .innerJoin('a.user', 'u')
      .innerJoin('a.quiz', 'q')
      .select([
        'a.id AS id',
        'u.name AS userName',
        'u.email AS userEmail',
        'q.id AS quizId',
        'q.title AS quizTitle',
        'a.score AS score',
        'a.maxScore AS maxScore',
        'a.passed AS passed',
        'a.timeSpentSeconds AS timeSpentSeconds',
        'a.startedAt AS startedAt',
        'a.completedAt AS completedAt',
      ]);
    if (quizIds.length > 0) qb.where('q.id IN (:...quizIds)', { quizIds });
    const rowsData = await qb.getRawMany();
    const rows: any[] = [[
      'Attempt ID', 'User Name', 'User Email', 'Quiz ID', 'Quiz Title', 'Score', 'Max Score', 'Passed', 'Time Spent (s)', 'Started At', 'Completed At',
    ]];
    for (const r of rowsData) {
      rows.push([
        r.id, r.userName, r.userEmail, r.quizId, r.quizTitle, r.score, r.maxScore, r.passed ? 'yes' : 'no', r.timeSpentSeconds, r.startedAt ? new Date(r.startedAt).toISOString() : '', r.completedAt ? new Date(r.completedAt).toISOString() : ''
      ]);
    }
    return this.toCsv(rows);
  }

  async createUser(data: { email: string; name: string; role: UserRole; password?: string }) {
    const password = data.password || 'TempPassword@123';
    const user = await this.usersService.create({
      email: data.email,
      name: data.name,
      password,
      role: data.role,
    } as any);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async changeUserRole(id: string, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    user.role = role;
    await this.userRepo.save(user);
    return { id: user.id, role: user.role };
  }

  async activateUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    user.isActive = true;
    await this.userRepo.save(user);
    return { id: user.id, isActive: user.isActive };
  }

  async deactivateUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    user.isActive = false;
    await this.userRepo.save(user);
    return { id: user.id, isActive: user.isActive };
  }

  async resetUserPassword(id: string, password: string) {
    await this.usersService.updatePassword(id, password);
    return { id, message: 'Password reset successfully' };
  }

  async deleteUser(id: string) {
    await this.userRepo.delete(id);
    return { id, message: 'User deleted successfully' };
  }

  async updateUser(id: string, data: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    
    if (data.email) user.email = data.email;
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.jobTitle !== undefined) user.jobTitle = data.jobTitle;
    if (data.role) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    
    await this.userRepo.save(user);
    return user;
  }

  async bulkUserAction(userIds: string[], action: 'activate' | 'deactivate' | 'delete', role?: UserRole) {
    const results = [];
    for (const id of userIds) {
      try {
        if (action === 'activate') {
          await this.activateUser(id);
        } else if (action === 'deactivate') {
          await this.deactivateUser(id);
        } else if (action === 'delete') {
          await this.deleteUser(id);
        }
        results.push({ id, success: true });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return { results, total: userIds.length, successful: results.filter(r => r.success).length };
  }

  async getApprovalQueue() {
    // Courses awaiting review: use DRAFT as pending state for now
    const items = await this.courseRepo.find({
      where: { status: In([CourseStatus.DRAFT]) },
      relations: ['instructor'],
      order: { updatedAt: 'DESC' },
      take: 50,
    });
    return { items };
  }

  async approveCourse(courseId: string, comment?: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['instructor'] });
    if (!course) return { status: 'not_found', courseId };
    course.status = CourseStatus.PUBLISHED;
    await this.courseRepo.save(course);
    // Notify instructor
    if (course.instructor?.email) {
      try {
        await this.notifications.sendEmail(
          course.instructor.email,
          'Your course has been approved',
          `<p>Hello ${course.instructor.name || ''},</p><p>Your course <strong>${course.title}</strong> has been approved and published.</p>`
        );
      } catch {}
    }
    return { status: 'approved', courseId, comment };
  }

  async rejectCourse(courseId: string, comment?: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['instructor'] });
    if (!course) return { status: 'not_found', courseId };
    // Keep as DRAFT; send reason
    if (course.instructor?.email) {
      const body = `<p>Hello ${course.instructor.name || ''},</p>
        <p>Your course <strong>${course.title}</strong> was not approved.</p>
        ${comment ? `<p>Reviewer comment: ${comment}</p>` : ''}`;
      try { await this.notifications.sendEmail(course.instructor.email, 'Course review feedback', body); } catch {}
    }
    return { status: 'rejected', courseId, comment };
  }

  // Instructor applications
  async listInstructorApplications(status?: InstructorApplicationStatus) {
    const where = status ? { status } : {};
    const apps = await this.appRepo.find({ where, order: { createdAt: 'DESC' } });
    return { items: apps, total: apps.length };
  }

  async approveInstructorApplication(id: string, reviewerComment?: string) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) return { status: 'not_found', id };
    app.status = InstructorApplicationStatus.APPROVED;
    await this.appRepo.save(app);
    // If user exists, upgrade role to INSTRUCTOR
    const user = await this.userRepo.findOne({ where: { email: app.email } });
    if (user && user.role !== (UserRole as any).INSTRUCTOR) {
      user.role = UserRole.INSTRUCTOR as any;
      await this.userRepo.save(user);
    }
    // Notify applicant
    try {
      await this.notifications.sendEmail(
        app.email,
        'Your instructor application was approved',
        `<p>Hi ${app.fullName},</p><p>Your application to teach on Mindelta has been approved.</p>`
      );
    } catch {}
    return { status: 'approved', id };
  }

  async rejectInstructorApplication(id: string, reviewerComment?: string) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) return { status: 'not_found', id };
    app.status = InstructorApplicationStatus.REJECTED;
    await this.appRepo.save(app);
    try {
      await this.notifications.sendEmail(
        app.email,
        'Your instructor application was not approved',
        `<p>Hi ${app.fullName},</p><p>We appreciate your interest. Unfortunately, your application was not approved at this time.</p>${reviewerComment ? `<p>Reviewer comment: ${reviewerComment}</p>` : ''}`
      );
    } catch {}
    return { status: 'rejected', id };
  }

  async getMetrics() {
    // Time windows
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const start30 = new Date(now.getTime() - 30 * dayMs);

    // Load 30d analytics for DAU/MAU (unique users with any event)
    const qb = this.analyticsRepo.createQueryBuilder('e')
      .where('e.createdAt >= :start', { start: start30 });
    const events = await qb.getMany();

    // DAU/MAU
    const uniqueByDay = new Map<string, Set<string>>();
    const unique30 = new Set<string>();
    for (const e of events) {
      if (!e.userId) continue;
      const day = new Date(e.createdAt);
      const key = day.toISOString().slice(0, 10);
      if (!uniqueByDay.has(key)) uniqueByDay.set(key, new Set());
      uniqueByDay.get(key)!.add(e.userId);
      unique30.add(e.userId);
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    const dau = uniqueByDay.get(todayKey)?.size || 0;
    const mau = unique30.size;

    const totalCourses = await this.courseRepo.count();
    const totalLearners = await this.userRepo.count();

    const enrollments = await this.enrollmentRepo.find({
      where: { enrolledAt: MoreThan(start30) },
      relations: ['course'],
    });
    const monthlyRevenue = enrollments.reduce((sum, e) => sum + Number(e.course?.price || 0), 0);

    // Build a simple timeseries of daily signups/completions (using event types if present)
    const signups: Record<string, number> = {};
    const completions: Record<string, number> = {};
    for (const e of events) {
      const key = new Date(e.createdAt).toISOString().slice(0, 10);
      // If you track SIGNUP event type, increment here; otherwise this stays zero
      if (!(key in signups)) signups[key] = 0;
      if (!(key in completions)) completions[key] = 0;
      // Example mapping: treat QUIZ_COMPLETED as a proxy for completion signal
      if ((e as any).eventType === 'QUIZ_COMPLETED') completions[key]++;
    }

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * dayMs);
      const k = d.toISOString().slice(0, 10);
      return { date: k, signups: signups[k] || 0, completions: completions[k] || 0 };
    });

    return { dau, mau, totalCourses, totalLearners, monthlyRevenue, series: last30Days };
  }
}
