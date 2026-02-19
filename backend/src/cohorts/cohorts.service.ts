import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrainingCohort,
  CohortEnrollment,
  CohortStatus,
  CohortQuarter,
  CohortTrack,
  CohortPacingMode,
} from './entities/training-cohort.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemSetting } from '../admin/entities/system-setting.entity';

@Injectable()
export class CohortsService {
  constructor(
    @InjectRepository(TrainingCohort)
    private cohortRepository: Repository<TrainingCohort>,
    @InjectRepository(CohortEnrollment)
    private enrollmentRepository: Repository<CohortEnrollment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SystemSetting)
    private settingsRepository: Repository<SystemSetting>,
    private notificationsService: NotificationsService,
  ) {}

  // Get all cohorts with optional filtering
  async getAllCohorts(filters?: {
    track?: CohortTrack;
    quarter?: CohortQuarter;
    year?: number;
    status?: CohortStatus;
  }): Promise<TrainingCohort[]> {
    const where: any = { isActive: true };

    if (filters) {
      if (filters.track) where.track = filters.track;
      if (filters.quarter) where.quarter = filters.quarter;
      if (filters.year) where.year = filters.year;
      if (filters.status) where.status = filters.status;
    }

    return this.cohortRepository.find({
      where,
      relations: ['instructor', 'enrollments'],
      order: { startDate: 'ASC' },
    });
  }

  // Get cohorts by quarter and year
  async getCohortsByQuarter(quarter: CohortQuarter, year: number): Promise<TrainingCohort[]> {
    return this.cohortRepository.find({
      where: {
        quarter,
        year,
        isActive: true,
      },
      relations: ['instructor'],
      order: { startDate: 'ASC' },
    });
  }

  // Get cohorts by track
  async getCohortsByTrack(track: CohortTrack): Promise<TrainingCohort[]> {
    return this.cohortRepository.find({
      where: {
        track,
        isActive: true,
      },
      relations: ['instructor'],
      order: { startDate: 'ASC' },
    });
  }

  // Get upcoming cohorts (open for enrollment or starting soon)
  async getUpcomingCohorts(): Promise<TrainingCohort[]> {
    const now = new Date();

    return this.cohortRepository.find({
      where: [
        { status: CohortStatus.OPEN_FOR_ENROLLMENT, isActive: true },
        { status: CohortStatus.UPCOMING, isActive: true },
      ],
      relations: ['instructor'],
      order: { startDate: 'ASC' },
    });
  }

  // Get single cohort by ID
  async getCohortById(cohortId: string): Promise<TrainingCohort> {
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
      relations: ['instructor', 'enrollments', 'enrollments.user'],
    });

    if (!cohort) {
      throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
    }

    return cohort;
  }

  // Enroll user in cohort
  async enrollInCohort(userId: string, cohortId: string): Promise<CohortEnrollment> {
    // Check if cohort exists
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
    }

    // Check if cohort is open for enrollment
    const now = new Date();
    if (cohort.status !== CohortStatus.OPEN_FOR_ENROLLMENT) {
      throw new HttpException('Cohort is not open for enrollment', HttpStatus.BAD_REQUEST);
    }

    if (now < cohort.enrollmentOpenDate || now > cohort.enrollmentCloseDate) {
      throw new HttpException('Enrollment period has ended', HttpStatus.BAD_REQUEST);
    }

    // Check if cohort is full
    if (cohort.currentParticipants >= cohort.maxParticipants) {
      throw new HttpException('Cohort is full', HttpStatus.BAD_REQUEST);
    }

    // Check if user already enrolled
    const existing = await this.enrollmentRepository.findOne({
      where: { cohortId, userId },
    });

    if (existing) {
      throw new HttpException('Already enrolled in this cohort', HttpStatus.CONFLICT);
    }

    // Create enrollment
    const enrollment = this.enrollmentRepository.create({
      cohortId,
      userId,
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    await this.enrollmentRepository.save(enrollment);

    // Update cohort participant count
    cohort.currentParticipants += 1;
    await this.cohortRepository.save(cohort);

    return enrollment;
  }

  // Get user's cohort enrollments
  async getUserEnrollments(userId: string): Promise<CohortEnrollment[]> {
    return this.enrollmentRepository.find({
      where: { userId },
      relations: ['cohort'],
    });
  }

  async assignMentor(cohortId: string, userId: string, mentorId: string): Promise<CohortEnrollment> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { cohortId, userId } });
    if (!enrollment) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    enrollment.mentorId = mentorId;
    return this.enrollmentRepository.save(enrollment);
  }

  async updateOnboardingChecklist(
    cohortId: string,
    userId: string,
    checklist: Array<{ title: string; completed: boolean; completedAt?: Date }> = [],
  ): Promise<CohortEnrollment> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { cohortId, userId } });
    if (!enrollment) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    const previousChecklist = enrollment.onboardingChecklist || [];
    const previousCompleted = previousChecklist.filter((item) => item.completed).length;
    const previousTotal = previousChecklist.length;

    enrollment.onboardingChecklist = checklist;
    const saved = await this.enrollmentRepository.save(enrollment);

    const nextCompleted = checklist.filter((item) => item.completed).length;
    const nextTotal = checklist.length;
    await this.notifyOnChecklistMilestones(enrollment, {
      previousCompleted,
      previousTotal,
      nextCompleted,
      nextTotal,
    });

    return saved;
  }

  async updateOnboardingTemplate(
    cohortId: string,
    template: Array<{ title: string }> = [],
  ): Promise<TrainingCohort> {
    const cohort = await this.cohortRepository.findOne({ where: { id: cohortId } });
    if (!cohort) {
      throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
    }

    cohort.onboardingTemplate = template;
    return this.cohortRepository.save(cohort);
  }

  async updateCohortPacing(
    cohortId: string,
    payload: { pacingMode?: CohortPacingMode; weeklyTargetMinutes?: number | null },
  ): Promise<TrainingCohort> {
    const cohort = await this.cohortRepository.findOne({ where: { id: cohortId } });
    if (!cohort) {
      throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
    }

    if (payload.pacingMode) {
      cohort.pacingMode = payload.pacingMode;
    }

    if (payload.weeklyTargetMinutes !== undefined) {
      const nextValue =
        payload.weeklyTargetMinutes === null ? null : Math.max(0, Math.round(payload.weeklyTargetMinutes));
      cohort.weeklyTargetMinutes = nextValue;
    }

    return this.cohortRepository.save(cohort);
  }

  async applyOnboardingTemplate(
    cohortId: string,
    options?: { overwrite?: boolean },
  ): Promise<{ updated: number }> {
    const cohort = await this.cohortRepository.findOne({ where: { id: cohortId } });
    if (!cohort) {
      throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
    }

    const template = cohort.onboardingTemplate || [];
    if (template.length === 0) {
      return { updated: 0 };
    }

    const enrollments = await this.enrollmentRepository.find({ where: { cohortId } });
    let updated = 0;

    for (const enrollment of enrollments) {
      const existing = enrollment.onboardingChecklist || [];
      if (existing.length > 0 && !options?.overwrite) {
        const merged = template.map((item) => {
          const match = existing.find((e) => e.title === item.title);
          return match ? match : { title: item.title, completed: false };
        });
        enrollment.onboardingChecklist = merged;
      } else {
        enrollment.onboardingChecklist = template.map((item) => ({
          title: item.title,
          completed: false,
        }));
      }
      await this.enrollmentRepository.save(enrollment);
      updated += 1;
    }

    return { updated };
  }

  private async notifyOnChecklistMilestones(
    enrollment: CohortEnrollment,
    progress: { previousCompleted: number; previousTotal: number; nextCompleted: number; nextTotal: number },
  ): Promise<void> {
    const { previousCompleted, previousTotal, nextCompleted, nextTotal } = progress;
    if (nextTotal === 0) return;

    const notificationsEnabled = await this.getBooleanSetting(
      'feature.checklistNotificationsEnabled',
      true,
    );
    if (!notificationsEnabled) return;

    const thresholds = await this.getNumberArraySetting('checklistNotifications.thresholds', [1, 50, 100]);
    if (thresholds.length === 0) return;

    const previousPercent = Math.floor((previousCompleted / nextTotal) * 100);
    const nextPercent = Math.floor((nextCompleted / nextTotal) * 100);
    const crossed = thresholds
      .filter((t) => t >= 0 && t <= 100)
      .sort((a, b) => a - b)
      .find((t) => previousPercent < t && nextPercent >= t);

    if (!crossed) return;

    const learner = await this.userRepository.findOne({ where: { id: enrollment.userId } });
    const mentor = enrollment.mentorId
      ? await this.userRepository.findOne({ where: { id: enrollment.mentorId } })
      : null;

    const learnerName = learner?.name || 'Learner';
    const mentorName = mentor?.name || 'Mentor';

    const milestoneLabel = crossed === 100 ? 'completed' : crossed === 1 ? 'first steps' : `${crossed}% complete`;

    if (learner?.email) {
      const subject = `Onboarding checklist update: ${milestoneLabel}`;
      const html = `
        <h1>Nice progress, ${learnerName}!</h1>
        <p>Your onboarding checklist is now <strong>${milestoneLabel}</strong>.</p>
        <p>Keep the momentum going and reach full completion.</p>
      `;
      try {
        await this.notificationsService.sendEmail(learner.email, subject, html);
      } catch {}
    }

    if (mentor?.email) {
      const subject = `Mentee onboarding progress: ${milestoneLabel}`;
      const html = `
        <h1>Update for your mentee</h1>
        <p>${learnerName} has reached <strong>${milestoneLabel}</strong> on their onboarding checklist.</p>
        <p>Consider sending encouragement or checking in for any blockers.</p>
      `;
      try {
        await this.notificationsService.sendEmail(mentor.email, subject, html);
      } catch {}
    }
  }

  private async getBooleanSetting(key: string, fallback: boolean): Promise<boolean> {
    const row = await this.settingsRepository.findOne({ where: { key } });
    if (!row || row.value === null) return fallback;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value === 'true';
    }
  }

  private async getNumberArraySetting(key: string, fallback: number[]): Promise<number[]> {
    const row = await this.settingsRepository.findOne({ where: { key } });
    if (!row || row.value === null) return fallback;
    try {
      const parsed = JSON.parse(row.value);
      return Array.isArray(parsed) ? parsed.map((v) => Number(v)).filter((v) => !Number.isNaN(v)) : fallback;
    } catch {
      return fallback;
    }
  }

  // Get cohort statistics
  async getCohortStatistics(cohortId: string): Promise<any> {
    const cohort = await this.getCohortById(cohortId);

    const enrollments = await this.enrollmentRepository.find({
      where: { cohortId },
    });

    const totalEnrolled = enrollments.length;
    const active = enrollments.filter((e) => e.status === 'active').length;
    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const withdrawn = enrollments.filter((e) => e.status === 'withdrawn').length;

    const averageAttendance =
      enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + Number(e.attendancePercentage), 0) /
          enrollments.length
        : 0;

    const completedWithScores = enrollments.filter(
      (e) => e.status === 'completed' && e.finalScore !== null,
    );
    const averageScore =
      completedWithScores.length > 0
        ? completedWithScores.reduce((sum, e) => sum + Number(e.finalScore), 0) /
          completedWithScores.length
        : 0;

    return {
      cohort: {
        id: cohort.id,
        name: cohort.name,
        track: cohort.track,
        quarter: cohort.quarter,
        year: cohort.year,
        status: cohort.status,
      },
      statistics: {
        totalEnrolled,
        maxParticipants: cohort.maxParticipants,
        utilizationRate: (totalEnrolled / cohort.maxParticipants) * 100,
        active,
        completed,
        withdrawn,
        averageAttendance: Number(averageAttendance.toFixed(2)),
        averageScore: Number(averageScore.toFixed(2)),
        completionRate: totalEnrolled > 0 ? (completed / totalEnrolled) * 100 : 0,
      },
    };
  }

  // Withdraw from cohort
  async withdrawFromCohort(userId: string, cohortId: string): Promise<CohortEnrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { cohortId, userId },
    });

    if (!enrollment) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    if (enrollment.status === 'completed' || enrollment.status === 'withdrawn') {
      throw new HttpException('Cannot withdraw from completed or already withdrawn cohort', HttpStatus.BAD_REQUEST);
    }

    enrollment.status = 'withdrawn';
    await this.enrollmentRepository.save(enrollment);

    // Update cohort participant count
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
    });

    if (cohort) {
      cohort.currentParticipants = Math.max(0, cohort.currentParticipants - 1);
      await this.cohortRepository.save(cohort);
    }

    return enrollment;
  }

  // Get calendar view of cohorts
  async getCalendarView(year: number): Promise<any> {
    const cohorts = await this.cohortRepository.find({
      where: { year, isActive: true },
      relations: ['instructor'],
      order: { startDate: 'ASC' },
    });

    // Group by quarter
    const calendar = {
      year,
      quarters: {
        q1: cohorts.filter((c) => c.quarter === CohortQuarter.Q1),
        q2: cohorts.filter((c) => c.quarter === CohortQuarter.Q2),
        q3: cohorts.filter((c) => c.quarter === CohortQuarter.Q3),
        q4: cohorts.filter((c) => c.quarter === CohortQuarter.Q4),
      },
      summary: {
        totalCohorts: cohorts.length,
        openForEnrollment: cohorts.filter((c) => c.status === CohortStatus.OPEN_FOR_ENROLLMENT)
          .length,
        inProgress: cohorts.filter((c) => c.status === CohortStatus.IN_PROGRESS).length,
        completed: cohorts.filter((c) => c.status === CohortStatus.COMPLETED).length,
        totalParticipants: cohorts.reduce((sum, c) => sum + c.currentParticipants, 0),
        totalCapacity: cohorts.reduce((sum, c) => sum + c.maxParticipants, 0),
      },
    };

    return calendar;
  }
}

