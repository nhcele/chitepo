import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not, IsNull } from 'typeorm';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { UserCertification } from '../certifications/entities/user-certification.entity';
import { CertificationPathway, PathwayType } from '../certifications/entities/certification-pathway.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { CourseCategory, CourseStatus } from '@mindelta/shared';

export interface EnrollmentByTrackMetrics {
  track: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CompletionRateByCourse {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageTimeToComplete: number; // in days
  dropOffRate: number;
}

export interface CertificationAchievementMetrics {
  pathwayType: PathwayType;
  pathwayName: string;
  totalEnrolled: number;
  totalAwarded: number;
  achievementRate: number;
  averageTimeToAward: number; // in days
}

export interface GeographicDistribution {
  country?: string;
  region?: string;
  province?: string;
  totalUsers: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalCertifications: number;
}

export interface CourseRatingMetrics {
  courseId: string;
  courseTitle: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

export interface AssessmentPassRate {
  courseId: string;
  courseTitle: string;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  averageScore: number;
  averageAttempts: number;
}

export interface LearnerSatisfaction {
  period: {
    start: Date;
    end: Date;
  };
  averageRating: number;
  totalResponses: number;
  satisfactionByTrack: {
    track: string;
    averageRating: number;
    totalResponses: number;
  }[];
}

export interface TimeToCompletionMetrics {
  courseId: string;
  courseTitle: string;
  averageDaysToComplete: number;
  medianDaysToComplete: number;
  fastestCompletion: number; // days
  slowestCompletion: number; // days
  percentile25: number;
  percentile75: number;
}

export interface ImpactMetrics {
  voterRegistrationNumbers: number;
  officialsTrained: number;
  diasporaInvestmentFacilitated: number; // USD
  communityProjects: number;
  period: {
    start: Date;
    end: Date;
  };
}

@Injectable()
export class SuccessMetricsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(UserCertification)
    private readonly userCertificationRepository: Repository<UserCertification>,
    @InjectRepository(CertificationPathway)
    private readonly pathwayRepository: Repository<CertificationPathway>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
  ) {}

  /**
   * Setup analytics for enrollment by track
   */
  async getEnrollmentByTrack(
    startDate?: Date,
    endDate?: Date,
  ): Promise<EnrollmentByTrackMetrics[]> {
    const period = this.getDefaultPeriod(startDate, endDate);
    
    const enrollments = await this.enrollmentRepository.find({
      where: {
        enrolledAt: Between(period.start, period.end),
      },
      relations: ['course'],
    });

    // Group by course category (track)
    const trackMap = new Map<string, EnrollmentByTrackMetrics>();

    for (const enrollment of enrollments) {
      const course = await this.courseRepository.findOne({
        where: { id: enrollment.courseId },
      });

      if (!course) continue;

      const track = this.getTrackFromCategory(course.category || CourseCategory.CORE_IDEOLOGY);
      
      if (!trackMap.has(track)) {
        trackMap.set(track, {
          track,
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          completionRate: 0,
          period,
        });
      }

      const metrics = trackMap.get(track)!;
      metrics.totalEnrollments++;
      
      if (enrollment.completedAt) {
        metrics.completedEnrollments++;
      } else {
        metrics.activeEnrollments++;
      }
    }

    // Calculate completion rates
    const results = Array.from(trackMap.values());
    results.forEach(metric => {
      metric.completionRate = metric.totalEnrollments > 0
        ? (metric.completedEnrollments / metric.totalEnrollments) * 100
        : 0;
    });

    return results;
  }

  /**
   * Track completion rates by course
   */
  async getCompletionRatesByCourse(
    startDate?: Date,
    endDate?: Date,
  ): Promise<CompletionRateByCourse[]> {
    const period = this.getDefaultPeriod(startDate, endDate);

    const enrollments = await this.enrollmentRepository.find({
      where: {
        enrolledAt: Between(period.start, period.end),
      },
    });

    const courseMap = new Map<string, {
      enrollments: Enrollment[];
      course: Course | null;
    }>();

    for (const enrollment of enrollments) {
      if (!courseMap.has(enrollment.courseId)) {
        const course = await this.courseRepository.findOne({
          where: { id: enrollment.courseId },
        });
        courseMap.set(enrollment.courseId, {
          enrollments: [],
          course,
        });
      }
      courseMap.get(enrollment.courseId)!.enrollments.push(enrollment);
    }

    const results: CompletionRateByCourse[] = [];

    for (const [courseId, data] of courseMap.entries()) {
      if (!data.course) continue;

      const enrollments = data.enrollments;
      const completed = enrollments.filter(e => e.completedAt);
      const completionRate = enrollments.length > 0
        ? (completed.length / enrollments.length) * 100
        : 0;

      // Calculate average time to complete
      const completionTimes = completed
        .filter(e => e.completedAt && e.enrolledAt)
        .map(e => {
          const days = Math.floor(
            (e.completedAt!.getTime() - e.enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          return days;
        });
      
      const averageTimeToComplete = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

      // Drop-off rate (enrolled but never started or minimal progress)
      const droppedOff = enrollments.filter(e => 
        !e.completedAt && 
        ((e.progressPercentage || 0) < 5)
      ).length;
      const dropOffRate = enrollments.length > 0
        ? (droppedOff / enrollments.length) * 100
        : 0;

      results.push({
        courseId,
        courseTitle: data.course.title,
        totalEnrollments: enrollments.length,
        completedEnrollments: completed.length,
        completionRate,
        averageTimeToComplete,
        dropOffRate,
      });
    }

    return results.sort((a, b) => b.totalEnrollments - a.totalEnrollments);
  }

  /**
   * Monitor certification achievement rates
   */
  async getCertificationAchievementMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<CertificationAchievementMetrics[]> {
    const period = this.getDefaultPeriod(startDate, endDate);

    const pathways = await this.pathwayRepository.find({
      where: { isActive: true },
    });

    const results: CertificationAchievementMetrics[] = [];

    for (const pathway of pathways) {
      const userCerts = await this.userCertificationRepository.find({
        where: {
          pathwayId: pathway.id,
          createdAt: Between(period.start, period.end),
        },
      });

      const totalEnrolled = userCerts.length;
      const awarded = userCerts.filter(
        uc => uc.status === 'awarded' && uc.awardedAt
      );
      const totalAwarded = awarded.length;
      const achievementRate = totalEnrolled > 0
        ? (totalAwarded / totalEnrolled) * 100
        : 0;

      // Calculate average time to award
      const awardTimes = awarded
        .filter(uc => uc.awardedAt && uc.startedAt)
        .map(uc => {
          const days = Math.floor(
            (uc.awardedAt!.getTime() - uc.startedAt!.getTime()) / (1000 * 60 * 60 * 24)
          );
          return days;
        });
      
      const averageTimeToAward = awardTimes.length > 0
        ? awardTimes.reduce((a, b) => a + b, 0) / awardTimes.length
        : 0;

      results.push({
        pathwayType: pathway.type,
        pathwayName: pathway.name,
        totalEnrolled,
        totalAwarded,
        achievementRate,
        averageTimeToAward,
      });
    }

    return results.sort((a, b) => b.totalEnrolled - a.totalEnrolled);
  }

  /**
   * Track geographic distribution
   */
  async getGeographicDistribution(
    startDate?: Date,
    endDate?: Date,
  ): Promise<GeographicDistribution[]> {
    const period = this.getDefaultPeriod(startDate, endDate);

    // Get users with geographic data (if stored in user entity or metadata)
    const users = await this.userRepository.find({
      where: {
        createdAt: Between(period.start, period.end),
      },
    });

    // Note: This assumes geographic data is stored in user metadata or profile
    // You may need to adjust based on your actual data structure
    const geoMap = new Map<string, GeographicDistribution>();

    for (const user of users) {
      // Extract geographic info from user profile/metadata
      // This is a placeholder - adjust based on your actual schema
      const country = (user as any).country || 'Unknown';
      const region = (user as any).region || 'Unknown';
      const province = (user as any).province || 'Unknown';
      
      const key = `${country}-${region}-${province}`;
      
      if (!geoMap.has(key)) {
        geoMap.set(key, {
          country,
          region,
          province,
          totalUsers: 0,
          totalEnrollments: 0,
          totalCompletions: 0,
          totalCertifications: 0,
        });
      }

      const geo = geoMap.get(key)!;
      geo.totalUsers++;

      // Get enrollments for this user
      const enrollments = await this.enrollmentRepository.find({
        where: { userId: user.id },
      });
      geo.totalEnrollments += enrollments.length;
      geo.totalCompletions += enrollments.filter(e => e.completedAt).length;

      // Get certifications
      const certs = await this.userCertificationRepository.find({
        where: { userId: user.id },
      });
      geo.totalCertifications += certs.filter(c => c.status === 'awarded').length;
    }

    return Array.from(geoMap.values()).sort((a, b) => b.totalUsers - a.totalUsers);
  }

  /**
   * Setup course rating system metrics
   */
  async getCourseRatingMetrics(): Promise<CourseRatingMetrics[]> {
    // Note: This assumes course ratings are stored in a separate entity or metadata
    // For now, this is a placeholder structure
    const courses = await this.courseRepository.find({
      where: { status: CourseStatus.PUBLISHED },
    });

    const results: CourseRatingMetrics[] = [];

    for (const course of courses) {
      // Placeholder - implement actual rating retrieval from your rating entity
      const ratings = (course as any).ratings || [];
      
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings
        : 0;

      const distribution = {
        five: ratings.filter((r: any) => r.rating === 5).length,
        four: ratings.filter((r: any) => r.rating === 4).length,
        three: ratings.filter((r: any) => r.rating === 3).length,
        two: ratings.filter((r: any) => r.rating === 2).length,
        one: ratings.filter((r: any) => r.rating === 1).length,
      };

      results.push({
        courseId: course.id,
        courseTitle: course.title,
        averageRating,
        totalRatings,
        ratingDistribution: distribution,
      });
    }

    return results.sort((a, b) => b.averageRating - a.averageRating);
  }

  /**
   * Track assessment pass rates
   */
  async getAssessmentPassRates(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AssessmentPassRate[]> {
    const period = this.getDefaultPeriod(startDate, endDate);

    try {
      const attempts = await this.quizAttemptRepository.find({
        where: {
          createdAt: Between(period.start, period.end),
        },
        relations: ['quiz'],
      });

      const courseMap = new Map<string, QuizAttempt[]>();

      for (const attempt of attempts) {
        if (!attempt.quiz) continue;
        
        // Get the course ID through the quiz relation
        const quizWithCourse = await this.quizAttemptRepository
          .createQueryBuilder('attempt')
          .leftJoinAndSelect('attempt.quiz', 'quiz')
          .leftJoinAndSelect('quiz.lesson', 'lesson')
          .leftJoinAndSelect('lesson.module', 'module')
          .leftJoinAndSelect('module.course', 'course')
          .where('attempt.id = :attemptId', { attemptId: attempt.id })
          .getOne();

        const courseId = quizWithCourse?.quiz?.lesson?.module?.course?.id;
        if (!courseId) continue;

        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, []);
        }
        courseMap.get(courseId)!.push(attempt);
      }

      const results: AssessmentPassRate[] = [];

      for (const [courseId, courseAttempts] of courseMap.entries()) {
        const course = await this.courseRepository.findOne({
          where: { id: courseId },
        });
        if (!course) continue;

        const totalAttempts = courseAttempts.length;
        const passed = courseAttempts.filter(a => a.score >= 70).length;
        const passRate = totalAttempts > 0 ? (passed / totalAttempts) * 100 : 0;
        
        const averageScore = totalAttempts > 0
          ? courseAttempts.reduce((sum, a) => sum + Number(a.score), 0) / totalAttempts
          : 0;

        // Group by user to count attempts per user
        const userAttempts = new Map<string, number>();
        courseAttempts.forEach(a => {
          const count = userAttempts.get(a.userId) || 0;
          userAttempts.set(a.userId, count + 1);
        });
        const averageAttempts = userAttempts.size > 0
          ? Array.from(userAttempts.values()).reduce((a, b) => a + b, 0) / userAttempts.size
          : 0;

        results.push({
          courseId,
          courseTitle: course.title,
          totalAttempts,
          passedAttempts: passed,
          passRate,
          averageScore,
          averageAttempts,
        });
      }

      return results.sort((a, b) => b.totalAttempts - a.totalAttempts);
    } catch (error) {
      console.error('Error in getAssessmentPassRates:', error);
      return [];
    }
  }

  /**
   * Monitor learner satisfaction
   */
  async getLearnerSatisfaction(
    startDate?: Date,
    endDate?: Date,
  ): Promise<LearnerSatisfaction> {
    const period = this.getDefaultPeriod(startDate, endDate);

    // Placeholder - implement actual satisfaction survey retrieval
    // This would typically come from a survey/feedback entity
    const satisfactionByTrack: LearnerSatisfaction['satisfactionByTrack'] = [
      {
        track: 'Core Ideology',
        averageRating: 4.5,
        totalResponses: 150,
      },
      {
        track: 'Contemporary Studies',
        averageRating: 4.3,
        totalResponses: 120,
      },
      {
        track: 'Governance',
        averageRating: 4.7,
        totalResponses: 200,
      },
      {
        track: 'Diaspora',
        averageRating: 4.6,
        totalResponses: 80,
      },
    ];

    const totalResponses = satisfactionByTrack.reduce((sum, t) => sum + t.totalResponses, 0);
    const averageRating = satisfactionByTrack.reduce((sum, t) => 
      sum + (t.averageRating * t.totalResponses), 0
    ) / totalResponses;

    return {
      period,
      averageRating,
      totalResponses,
      satisfactionByTrack,
    };
  }

  /**
   * Track time-to-completion
   */
  async getTimeToCompletionMetrics(): Promise<TimeToCompletionMetrics[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: {
        completedAt: Not(IsNull()),
      },
      relations: ['course'],
    });

    const courseMap = new Map<string, number[]>();

    for (const enrollment of enrollments) {
      if (!enrollment.completedAt || !enrollment.enrolledAt) continue;

      const days = Math.floor(
        (enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!courseMap.has(enrollment.courseId)) {
        courseMap.set(enrollment.courseId, []);
      }
      courseMap.get(enrollment.courseId)!.push(days);
    }

    const results: TimeToCompletionMetrics[] = [];

    for (const [courseId, times] of courseMap.entries()) {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });
      if (!course) continue;

      times.sort((a, b) => a - b);

      const averageDaysToComplete = times.reduce((a, b) => a + b, 0) / times.length;
      const medianDaysToComplete = times[Math.floor(times.length / 2)];
      const fastestCompletion = times[0];
      const slowestCompletion = times[times.length - 1];
      const percentile25 = times[Math.floor(times.length * 0.25)];
      const percentile75 = times[Math.floor(times.length * 0.75)];

      results.push({
        courseId,
        courseTitle: course.title,
        averageDaysToComplete,
        medianDaysToComplete,
        fastestCompletion,
        slowestCompletion,
        percentile25,
        percentile75,
      });
    }

    return results.sort((a, b) => a.averageDaysToComplete - b.averageDaysToComplete);
  }

  /**
   * Track impact metrics
   */
  async getImpactMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<ImpactMetrics> {
    const period = this.getDefaultPeriod(startDate, endDate);

    // Get officials trained (users who have completed mandatory training courses)
    const officialEnrollments = await this.enrollmentRepository.find({
      where: {
        enrolledAt: Between(period.start, period.end),
        completedAt: Not(IsNull()),
      },
      relations: ['course'],
    });
    
    // Filter for governance/government courses that are completed
    const governanceCourses = officialEnrollments.filter(e => {
      const course = e.course;
      return course?.category === CourseCategory.PRACTICAL_GOVERNANCE;
    });
    
    const officialsTrained = new Set(governanceCourses.map(e => e.userId)).size;

    // Placeholder values - these would come from specific tracking entities
    // You would need to create entities for tracking:
    // - Voter registrations
    // - Diaspora investments
    // - Community projects
    return {
      voterRegistrationNumbers: 0, // TODO: Implement voter registration tracking
      officialsTrained,
      diasporaInvestmentFacilitated: 0, // TODO: Implement investment tracking
      communityProjects: 0, // TODO: Implement project tracking
      period,
    };
  }

  // Helper methods
  private getDefaultPeriod(startDate?: Date, endDate?: Date) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    return { start, end };
  }

  private getTrackFromCategory(category: CourseCategory): string {
    switch (category) {
      case CourseCategory.CORE_IDEOLOGY:
        return 'Core Ideology';
      case CourseCategory.CONTEMPORARY_STUDIES:
        return 'Contemporary Studies';
      case CourseCategory.PRACTICAL_GOVERNANCE:
        return 'Practical Governance';
      case CourseCategory.DIASPORA_PROGRAM:
        return 'Diaspora Program';
      default:
        return 'General';
    }
  }
}

