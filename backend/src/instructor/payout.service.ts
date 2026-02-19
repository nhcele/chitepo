import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export interface PayoutCalculation {
  instructorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  platformFee: number;
  instructorEarnings: number;
  courseBreakdown: CoursePayout[];
  status: 'pending' | 'processed' | 'paid';
  processedAt?: Date;
  paidAt?: Date;
}

export interface CoursePayout {
  courseId: string;
  courseTitle: string;
  enrollments: number;
  revenue: number;
  instructorShare: number;
  platformFee: number;
  netEarnings: number;
}

export interface PayoutSettings {
  platformFeePercentage: number; // Default 30%
  minimumPayoutAmount: number; // Default $50
  payoutFrequency: 'weekly' | 'monthly' | 'quarterly';
  paymentMethod: 'bank_transfer' | 'paypal' | 'crypto';
}

@Injectable()
export class PayoutService {
  private defaultSettings: PayoutSettings = {
    platformFeePercentage: 30, // 30% platform fee
    minimumPayoutAmount: 50, // $50 minimum payout
    payoutFrequency: 'monthly',
    paymentMethod: 'bank_transfer',
  };

  constructor(
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async calculateInstructorPayout(
    instructorId: string,
    startDate: Date,
    endDate: Date,
    settings?: Partial<PayoutSettings>
  ): Promise<PayoutCalculation> {
    const payoutSettings = { ...this.defaultSettings, ...settings };

    // Get all courses for the instructor
    const courses = await this.courseRepo.find({
      where: { instructorId },
      select: ['id', 'title', 'price'],
    });

    if (courses.length === 0) {
      return this.createEmptyPayout(instructorId, startDate, endDate);
    }

    const courseBreakdown: CoursePayout[] = [];
    let totalRevenue = 0;

    // Calculate revenue for each course
    for (const course of courses) {
      const coursePayout = await this.calculateCoursePayout(
        course,
        startDate,
        endDate,
        payoutSettings.platformFeePercentage
      );
      
      courseBreakdown.push(coursePayout);
      totalRevenue += coursePayout.revenue;
    }

    const platformFee = totalRevenue * (payoutSettings.platformFeePercentage / 100);
    const instructorEarnings = totalRevenue - platformFee;

    return {
      instructorId,
      period: { startDate, endDate },
      totalRevenue,
      platformFee,
      instructorEarnings,
      courseBreakdown,
      status: 'pending',
    };
  }

  async calculateCoursePayout(
    course: Course,
    startDate: Date,
    endDate: Date,
    platformFeePercentage: number
  ): Promise<CoursePayout> {
    // Get completed enrollments within the period
    const enrollments = await this.enrollmentRepo.find({
      where: {
        courseId: course.id,
        completedAt: MoreThanOrEqual(startDate),
      },
    });

    // Filter by end date in application logic
    const filteredEnrollments = enrollments.filter(e => 
      e.completedAt && e.completedAt <= endDate
    );

    const enrollmentCount = filteredEnrollments.length;
    const revenue = enrollmentCount * course.price;
    const platformFee = revenue * (platformFeePercentage / 100);
    const netEarnings = revenue - platformFee;

    return {
      courseId: course.id,
      courseTitle: course.title,
      enrollments: enrollmentCount,
      revenue,
      instructorShare: netEarnings,
      platformFee,
      netEarnings,
    };
  }

  async getInstructorEarningsSummary(
    instructorId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    currentPeriod: PayoutCalculation;
    previousPeriod: PayoutCalculation;
    growth: {
      revenue: number;
      enrollments: number;
      percentage: number;
    };
    projectedMonthly: number;
  }> {
    const now = new Date();
    const dates = this.getPeriodDates(now, period);

    const [currentPeriod, previousPeriod] = await Promise.all([
      this.calculateInstructorPayout(instructorId, dates.currentStart, dates.currentEnd),
      this.calculateInstructorPayout(instructorId, dates.previousStart, dates.previousEnd),
    ]);

    const revenueGrowth = currentPeriod.totalRevenue - previousPeriod.totalRevenue;
    const enrollmentGrowth = currentPeriod.courseBreakdown.reduce((sum, c) => sum + c.enrollments, 0) -
                             previousPeriod.courseBreakdown.reduce((sum, c) => sum + c.enrollments, 0);
    
    const percentageGrowth = previousPeriod.totalRevenue > 0 
      ? (revenueGrowth / previousPeriod.totalRevenue) * 100 
      : 0;

    // Project monthly earnings based on current trend
    const projectedMonthly = period === 'month' 
      ? currentPeriod.instructorEarnings
      : this.projectMonthlyEarnings(currentPeriod, period);

    return {
      currentPeriod,
      previousPeriod,
      growth: {
        revenue: revenueGrowth,
        enrollments: enrollmentGrowth,
        percentage: percentageGrowth,
      },
      projectedMonthly,
    };
  }

  async getTopPerformingCourses(
    instructorId: string,
    limit: number = 5,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<CoursePayout[]> {
    const now = new Date();
    const dates = this.getPeriodDates(now, period);

    const courses = await this.courseRepo.find({
      where: { instructorId },
      select: ['id', 'title', 'price'],
    });

    const coursePayouts = await Promise.all(
      courses.map(course =>
        this.calculateCoursePayout(course, dates.currentStart, dates.currentEnd, this.defaultSettings.platformFeePercentage)
      )
    );

    // Sort by revenue and return top performers
    return coursePayouts
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async generatePayoutReport(
    instructorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: PayoutCalculation;
    detailedBreakdown: CoursePayout[];
    insights: {
      bestPerformingCourse: string;
      averageCourseRevenue: number;
      totalEnrollments: number;
      averageRevenuePerEnrollment: number;
    };
  }> {
    const summary = await this.calculateInstructorPayout(instructorId, startDate, endDate);
    
    const totalEnrollments = summary.courseBreakdown.reduce((sum, c) => sum + c.enrollments, 0);
    const averageCourseRevenue = summary.courseBreakdown.length > 0 
      ? summary.totalRevenue / summary.courseBreakdown.length 
      : 0;
    const averageRevenuePerEnrollment = totalEnrollments > 0 
      ? summary.totalRevenue / totalEnrollments 
      : 0;

    const bestPerformingCourse = summary.courseBreakdown.length > 0
      ? summary.courseBreakdown.reduce((best, current) => 
          current.revenue > best.revenue ? current : best
        ).courseTitle
      : '';

    return {
      summary,
      detailedBreakdown: summary.courseBreakdown,
      insights: {
        bestPerformingCourse,
        averageCourseRevenue,
        totalEnrollments,
        averageRevenuePerEnrollment,
      },
    };
  }

  async validatePayoutAmount(
    instructorId: string,
    amount: number
  ): Promise<{
    isValid: boolean;
    reason?: string;
    availableBalance: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentPayout = await this.calculateInstructorPayout(
      instructorId,
      monthStart,
      monthEnd
    );

    const availableBalance = currentPayout.instructorEarnings;

    if (amount > availableBalance) {
      return {
        isValid: false,
        reason: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
        availableBalance,
      };
    }

    if (amount < this.defaultSettings.minimumPayoutAmount) {
      return {
        isValid: false,
        reason: `Minimum payout amount is $${this.defaultSettings.minimumPayoutAmount}`,
        availableBalance,
      };
    }

    return {
      isValid: true,
      availableBalance,
    };
  }

  private createEmptyPayout(instructorId: string, startDate: Date, endDate: Date): PayoutCalculation {
    return {
      instructorId,
      period: { startDate, endDate },
      totalRevenue: 0,
      platformFee: 0,
      instructorEarnings: 0,
      courseBreakdown: [],
      status: 'pending',
    };
  }

  private getPeriodDates(now: Date, period: 'week' | 'month' | 'quarter' | 'year') {
    const currentStart = new Date(now);
    const currentEnd = new Date(now);
    const previousStart = new Date(now);
    const previousEnd = new Date(now);

    switch (period) {
      case 'week':
        currentStart.setDate(now.getDate() - now.getDay());
        currentEnd.setDate(currentStart.getDate() + 6);
        previousStart.setDate(currentStart.getDate() - 7);
        previousEnd.setDate(currentEnd.getDate() - 7);
        break;
      case 'month':
        currentStart.setDate(1);
        currentEnd.setMonth(now.getMonth() + 1, 0);
        previousStart.setMonth(now.getMonth() - 1, 1);
        previousEnd.setMonth(now.getMonth(), 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart.setMonth(quarter * 3, 1);
        currentEnd.setMonth((quarter + 1) * 3, 0);
        previousStart.setMonth((quarter - 1) * 3, 1);
        previousEnd.setMonth(quarter * 3, 0);
        break;
      case 'year':
        currentStart.setMonth(0, 1);
        currentEnd.setMonth(11, 31);
        previousStart.setFullYear(now.getFullYear() - 1, 0, 1);
        previousEnd.setFullYear(now.getFullYear() - 1, 11, 31);
        break;
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  private projectMonthlyEarnings(currentPayout: PayoutCalculation, period: 'week' | 'month' | 'quarter' | 'year'): number {
    switch (period) {
      case 'week':
        return currentPayout.instructorEarnings * 4.33; // Average weeks per month
      case 'quarter':
        return currentPayout.instructorEarnings / 3;
      case 'year':
        return currentPayout.instructorEarnings / 12;
      default:
        return currentPayout.instructorEarnings;
    }
  }
}
