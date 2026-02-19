import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TrainingCohort, CohortEnrollment, CohortStatus } from './entities/training-cohort.entity';
import { User } from '../users/entities/user.entity';
import { Certificate } from '../certificates/entities/certificate.entity';

export interface GraduationCriteria {
  minAttendancePercentage?: number;
  minFinalScore?: number;
  requiredCourses?: string[];
  completionDeadline?: Date;
}

export interface GraduationResult {
  userId: string;
  eligible: boolean;
  attendancePercentage: number;
  finalScore: number | null;
  completedCourses: string[];
  missingRequirements: string[];
  graduationDate?: Date;
}

@Injectable()
export class CohortGraduationService {
  constructor(
    @InjectRepository(TrainingCohort)
    private cohortRepository: Repository<TrainingCohort>,
    @InjectRepository(CohortEnrollment)
    private enrollmentRepository: Repository<CohortEnrollment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
  ) {}

  /**
   * Check graduation eligibility for a user in a cohort
   */
  async checkGraduationEligibility(
    cohortId: string,
    userId: string,
    criteria?: GraduationCriteria,
  ): Promise<GraduationResult> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { cohortId, userId },
      relations: ['cohort', 'user'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const cohort = enrollment.cohort;
    const defaultCriteria: GraduationCriteria = {
      minAttendancePercentage: 80,
      minFinalScore: 70,
      requiredCourses: cohort.courseIds || [],
      completionDeadline: cohort.endDate,
    };

    const finalCriteria = { ...defaultCriteria, ...criteria };

    const missingRequirements: string[] = [];
    let eligible = true;

    // Check attendance
    const attendancePercentage = Number(enrollment.attendancePercentage);
    if (
      finalCriteria.minAttendancePercentage &&
      attendancePercentage < finalCriteria.minAttendancePercentage
    ) {
      eligible = false;
      missingRequirements.push(
        `Attendance below ${finalCriteria.minAttendancePercentage}% (current: ${attendancePercentage.toFixed(1)}%)`,
      );
    }

    // Check final score
    const finalScore = enrollment.finalScore ? Number(enrollment.finalScore) : null;
    if (finalCriteria.minFinalScore && (!finalScore || finalScore < finalCriteria.minFinalScore)) {
      eligible = false;
      missingRequirements.push(
        `Final score below ${finalCriteria.minFinalScore}% (current: ${finalScore || 'N/A'})`,
      );
    }

    // Check required courses (simplified - would need course completion check)
    const completedCourses: string[] = []; // TODO: Check actual course completions
    if (finalCriteria.requiredCourses && finalCriteria.requiredCourses.length > 0) {
      const missingCourses = finalCriteria.requiredCourses.filter(
        (courseId) => !completedCourses.includes(courseId),
      );
      if (missingCourses.length > 0) {
        eligible = false;
        missingRequirements.push(`Missing ${missingCourses.length} required course(s)`);
      }
    }

    // Check deadline
    if (finalCriteria.completionDeadline && new Date() > finalCriteria.completionDeadline) {
      if (enrollment.status !== 'completed') {
        eligible = false;
        missingRequirements.push('Completion deadline has passed');
      }
    }

    return {
      userId,
      eligible,
      attendancePercentage,
      finalScore,
      completedCourses,
      missingRequirements,
      graduationDate: enrollment.completedAt || undefined,
    };
  }

  /**
   * Process graduation for a cohort (batch processing)
   */
  async processCohortGraduation(
    cohortId: string,
    criteria?: GraduationCriteria,
  ): Promise<GraduationResult[]> {
    const cohort = await this.cohortRepository.findOne({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { cohortId },
      relations: ['user'],
    });

    const results: GraduationResult[] = [];

    for (const enrollment of enrollments) {
      const result = await this.checkGraduationEligibility(
        cohortId,
        enrollment.userId,
        criteria,
      );
      results.push(result);

      // Auto-update enrollment status if eligible
      if (result.eligible && enrollment.status !== 'completed') {
        enrollment.status = 'completed';
        enrollment.completedAt = new Date();
        await this.enrollmentRepository.save(enrollment);
      }
    }

    return results;
  }

  /**
   * Get graduation statistics for a cohort
   */
  async getGraduationStats(cohortId: string): Promise<{
    totalEnrolled: number;
    eligible: number;
    ineligible: number;
    graduated: number;
    averageAttendance: number;
    averageScore: number;
    graduationRate: number;
  }> {
    const enrollments = await this.enrollmentRepository.find({
      where: { cohortId },
    });

    const totalEnrolled = enrollments.length;
    const graduated = enrollments.filter((e) => e.status === 'completed').length;

    const results = await this.processCohortGraduation(cohortId);
    const eligible = results.filter((r) => r.eligible).length;
    const ineligible = results.filter((r) => !r.eligible).length;

    const totalAttendance = enrollments.reduce(
      (sum, e) => sum + Number(e.attendancePercentage),
      0,
    );
    const averageAttendance = totalEnrolled > 0 ? totalAttendance / totalEnrolled : 0;

    const scores = enrollments
      .map((e) => e.finalScore)
      .filter((s) => s !== null) as number[];
    const averageScore =
      scores.length > 0 ? scores.reduce((sum, s) => sum + Number(s), 0) / scores.length : 0;

    const graduationRate = totalEnrolled > 0 ? (graduated / totalEnrolled) * 100 : 0;

    return {
      totalEnrolled,
      eligible,
      ineligible,
      graduated,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
      graduationRate: Math.round(graduationRate * 100) / 100,
    };
  }

  /**
   * Generate graduation certificates for eligible students
   */
  async generateGraduationCertificates(cohortId: string): Promise<Certificate[]> {
    const results = await this.processCohortGraduation(cohortId);
    const eligibleUsers = results.filter((r) => r.eligible).map((r) => r.userId);

    const certificates: Certificate[] = [];

    for (const userId of eligibleUsers) {
      // Check if certificate already exists for this cohort
      // Note: Cohort certificates use empty string for courseId since the entity requires a value
      const existing = await this.certificateRepository.findOne({
        where: { userId, courseId: '' },
      });

      if (!existing) {
        // Create cohort graduation certificate
        const certificate = this.certificateRepository.create({
          userId,
          courseId: '', // Cohort certificates use empty string for courseId
          issuedAt: new Date(),
          serial: this.generateSerialNumber(),
        });

        const saved: Certificate = await this.certificateRepository.save(certificate);
        certificates.push(saved);
      }
    }

    return certificates;
  }

  private generateSerialNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `COHORT-${timestamp}-${random}`.toUpperCase();
  }
}

