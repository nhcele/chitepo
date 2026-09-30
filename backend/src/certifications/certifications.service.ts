import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CertificationPathway, PathwayType } from './entities/certification-pathway.entity';
import { UserCertification, CertificationStatus } from './entities/user-certification.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(CertificationPathway)
    private pathwayRepository: Repository<CertificationPathway>,
    @InjectRepository(UserCertification)
    private userCertRepository: Repository<UserCertification>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  // Get all certification pathways
  async getAllPathways(): Promise<CertificationPathway[]> {
    return this.pathwayRepository.find({
      where: { isActive: true },
      order: { type: 'ASC', orderIndex: 'ASC' },
    });
  }

  // Get pathways by type
  async getPathwaysByType(type: PathwayType): Promise<CertificationPathway[]> {
    return this.pathwayRepository.find({
      where: { type, isActive: true },
      order: { level: 'ASC' },
    });
  }

  // Get user's certification progress
  async getUserCertificationProgress(userId: string): Promise<any> {
    const userCertifications = await this.userCertRepository.find({
      where: { userId },
      relations: ['pathway'],
      order: { createdAt: 'DESC' },
    });

    const progressData = await Promise.all(
      userCertifications.map(async (userCert) => {
        const pathway = userCert.pathway;
        
        // Get completed courses
        const completedEnrollments = await this.enrollmentRepository.find({
          where: {
            userId,
            completedAt: Not(IsNull()),
          },
        });

        const completedCourseIds = completedEnrollments.map(e => e.courseId);
        
        // Calculate progress
        const progress = pathway.minimumCourses > 0
          ? (completedCourseIds.length / pathway.minimumCourses) * 100
          : 0;

        return {
          id: userCert.id,
          pathway: {
            id: pathway.id,
            name: pathway.name,
            type: pathway.type,
            level: pathway.level,
            levelTitle: pathway.levelTitle,
          },
          status: userCert.status,
          progressPercentage: Math.min(progress, 100),
          coursesCompleted: completedCourseIds.length,
          coursesRequired: pathway.minimumCourses,
          completedAt: userCert.completedAt,
          certificateUrl: userCert.certificateUrl,
          certificateNumber: userCert.certificateNumber,
        };
      })
    );

    return progressData;
  }

  // Enroll user in certification pathway
  async enrollInPathway(userId: string, pathwayId: string): Promise<UserCertification> {
    // Check if pathway exists
    const pathway = await this.pathwayRepository.findOne({
      where: { id: pathwayId, isActive: true },
    });

    if (!pathway) {
      throw new HttpException('Certification pathway not found', HttpStatus.NOT_FOUND);
    }

    // Check if user already enrolled
    const existing = await this.userCertRepository.findOne({
      where: { userId, pathwayId },
    });

    if (existing) {
      throw new HttpException('Already enrolled in this pathway', HttpStatus.CONFLICT);
    }

    // Create enrollment
    const userCert = this.userCertRepository.create({
      userId,
      pathwayId,
      status: CertificationStatus.IN_PROGRESS,
      coursesRequired: pathway.minimumCourses,
      startedAt: new Date(),
    });

    return this.userCertRepository.save(userCert);
  }

  // Check if user meets certification requirements
  async checkCertificationEligibility(userId: string, pathwayId: string): Promise<any> {
    const pathway = await this.pathwayRepository.findOne({
      where: { id: pathwayId },
    });

    if (!pathway) {
      throw new HttpException('Pathway not found', HttpStatus.NOT_FOUND);
    }

    // Get user's completed courses
    const completedEnrollments = await this.enrollmentRepository.find({
      where: {
        userId,
        completedAt: Not(IsNull()),
      },
    });

    const completedCourseIds = completedEnrollments.map(e => e.courseId);

    // Check if required courses are completed
    let requiredCoursesCompleted = 0;
    if (pathway.requiredCourses && pathway.requiredCourses.length > 0) {
      requiredCoursesCompleted = pathway.requiredCourses.filter(
        courseId => completedCourseIds.includes(courseId)
      ).length;
    }

    const eligible = requiredCoursesCompleted >= pathway.minimumCourses;

    return {
      eligible,
      pathway: {
        id: pathway.id,
        name: pathway.name,
        levelTitle: pathway.levelTitle,
      },
      coursesCompleted: completedCourseIds.length,
      coursesRequired: pathway.minimumCourses,
      requiredCoursesCompleted,
      missingCourses: pathway.minimumCourses - requiredCoursesCompleted,
    };
  }

  // Award certification to user
  async awardCertification(userId: string, pathwayId: string): Promise<UserCertification> {
    const userCert = await this.userCertRepository.findOne({
      where: { userId, pathwayId },
    });

    if (!userCert) {
      throw new HttpException('User not enrolled in this pathway', HttpStatus.NOT_FOUND);
    }

    // Check eligibility
    const eligibility = await this.checkCertificationEligibility(userId, pathwayId);
    if (!eligibility.eligible) {
      throw new HttpException('User does not meet certification requirements', HttpStatus.BAD_REQUEST);
    }

    // Update user certification
    userCert.status = CertificationStatus.AWARDED;
    userCert.completedAt = new Date();
    userCert.awardedAt = new Date();
    userCert.progressPercentage = 100;
    userCert.coursesCompleted = eligibility.coursesCompleted;
    userCert.certificateNumber = `CHIT-${pathwayId.substring(0, 8).toUpperCase()}-${Date.now()}`;

    return this.userCertRepository.save(userCert);
  }

  // Get recommended pathways for user based on completed courses
  async getRecommendedPathways(userId: string): Promise<any[]> {
    const completedEnrollments = await this.enrollmentRepository.find({
      where: {
        userId,
        completedAt: Not(IsNull()),
      },
    });

    const completedCourseIds = completedEnrollments.map(e => e.courseId);
    const allPathways = await this.getAllPathways();

    const recommendations = allPathways.map(pathway => {
      const matchingCourses = pathway.requiredCourses
        ? pathway.requiredCourses.filter(courseId => completedCourseIds.includes(courseId)).length
        : 0;

      const progressPercentage = pathway.minimumCourses > 0
        ? (matchingCourses / pathway.minimumCourses) * 100
        : 0;

      return {
        pathway: {
          id: pathway.id,
          name: pathway.name,
          type: pathway.type,
          level: pathway.level,
          levelTitle: pathway.levelTitle,
          cost: pathway.cost,
          estimatedDurationWeeks: pathway.estimatedDurationWeeks,
        },
        progressPercentage,
        coursesCompleted: matchingCourses,
        coursesRequired: pathway.minimumCourses,
        recommended: progressPercentage >= 25, // Recommend if 25%+ complete
      };
    });

    return recommendations.sort((a, b) => b.progressPercentage - a.progressPercentage);
  }
}

