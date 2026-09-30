import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { CohortEnrollment } from '../cohorts/entities/training-cohort.entity';

export interface DiasporaUserProfile {
  userId: string;
  region: string;
  country: string;
  city?: string;
  timezone?: string;
  memberSince: Date;
  totalCoursesCompleted: number;
  totalCertifications: number;
  totalCohortsCompleted: number;
  investmentAmount?: number;
  projectsInitiated: number;
  voterRegistrationsFacilitated: number;
  communityEngagementScore: number;
}

export interface DiasporaImpactMetrics {
  region: string;
  totalMembers: number;
  activeMembers: number;
  coursesCompleted: number;
  certificationsEarned: number;
  cohortsCompleted: number;
  totalInvestment: number;
  projectsInitiated: number;
  voterRegistrations: number;
  averageEngagementScore: number;
  growthRate: number;
}

@Injectable()
export class DiasporaImpactService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    @InjectRepository(CohortEnrollment)
    private cohortEnrollmentRepository: Repository<CohortEnrollment>,
  ) {}

  /**
   * Get diaspora user profile with impact metrics
   */
  async getDiasporaUserProfile(userId: string): Promise<DiasporaUserProfile | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Extract diaspora info from user metadata (would need to add fields to User entity)
    // For now, using a simplified approach
    const region = (user as any).diasporaRegion || 'unknown';
    const country = (user as any).diasporaCountry || 'unknown';

    // Get course completions
    const completedEnrollments = await this.enrollmentRepository.find({
      where: { userId, completedAt: { $ne: null } as any },
    });
    const totalCoursesCompleted = completedEnrollments.length;

    // Get certifications
    const certificates = await this.certificateRepository.find({
      where: { userId },
    });
    const totalCertifications = certificates.length;

    // Get cohort completions
    const completedCohorts = await this.cohortEnrollmentRepository.find({
      where: { userId, status: 'completed' },
    });
    const totalCohortsCompleted = completedCohorts.length;

    // Calculate engagement score (simplified)
    const communityEngagementScore =
      totalCoursesCompleted * 10 +
      totalCertifications * 20 +
      totalCohortsCompleted * 30;

    return {
      userId,
      region,
      country,
      memberSince: user.createdAt,
      totalCoursesCompleted,
      totalCertifications,
      totalCohortsCompleted,
      projectsInitiated: 0, // Would need separate tracking
      voterRegistrationsFacilitated: 0, // Would need separate tracking
      communityEngagementScore,
    };
  }

  /**
   * Get impact metrics by region
   */
  async getRegionalImpactMetrics(region: string): Promise<DiasporaImpactMetrics> {
    // Get all users in region (would need diaspora fields in User entity)
    // For now, using a placeholder approach
    const allUsers = await this.userRepository.find();
    const regionUsers = allUsers.filter(
      (u) => (u as any).diasporaRegion === region,
    );

    const totalMembers = regionUsers.length;
    const activeMembers = regionUsers.filter(
      (u) => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ).length;

    // Aggregate metrics
    let coursesCompleted = 0;
    let certificationsEarned = 0;
    let cohortsCompleted = 0;
    let totalInvestment = 0;
    let projectsInitiated = 0;
    let voterRegistrations = 0;
    let totalEngagementScore = 0;

    for (const user of regionUsers) {
      const profile = await this.getDiasporaUserProfile(user.id);
      if (profile) {
        coursesCompleted += profile.totalCoursesCompleted;
        certificationsEarned += profile.totalCertifications;
        cohortsCompleted += profile.totalCohortsCompleted;
        totalInvestment += profile.investmentAmount || 0;
        projectsInitiated += profile.projectsInitiated;
        voterRegistrations += profile.voterRegistrationsFacilitated;
        totalEngagementScore += profile.communityEngagementScore;
      }
    }

    const averageEngagementScore =
      totalMembers > 0 ? totalEngagementScore / totalMembers : 0;

    // Calculate growth rate (simplified - would need historical data)
    const growthRate = 0; // Placeholder

    return {
      region,
      totalMembers,
      activeMembers,
      coursesCompleted,
      certificationsEarned,
      cohortsCompleted,
      totalInvestment,
      projectsInitiated,
      voterRegistrations,
      averageEngagementScore: Math.round(averageEngagementScore * 100) / 100,
      growthRate,
    };
  }

  /**
   * Get all regional impact metrics
   */
  async getAllRegionalImpactMetrics(): Promise<DiasporaImpactMetrics[]> {
    const regions = [
      'south_africa',
      'east_africa',
      'uk_ireland',
      'europe_continental',
      'north_america',
      'latin_america',
      'australia',
      'china',
      'uae',
    ];

    const metrics: DiasporaImpactMetrics[] = [];

    for (const region of regions) {
      const metric = await this.getRegionalImpactMetrics(region);
      metrics.push(metric);
    }

    return metrics;
  }

  /**
   * Track diaspora investment
   */
  async trackInvestment(
    userId: string,
    amount: number,
    projectDescription?: string,
  ): Promise<void> {
    // Would need to create a diaspora_investments table
    // For now, this is a placeholder
    console.log(`Tracking investment: ${userId}, ${amount}, ${projectDescription}`);
  }

  /**
   * Track project initiation
   */
  async trackProject(userId: string, projectName: string, projectType: string): Promise<void> {
    // Would need to create a diaspora_projects table
    console.log(`Tracking project: ${userId}, ${projectName}, ${projectType}`);
  }

  /**
   * Track voter registration facilitation
   */
  async trackVoterRegistration(userId: string, count: number): Promise<void> {
    // Would need to create a voter_registrations table
    console.log(`Tracking voter registration: ${userId}, ${count}`);
  }
}

