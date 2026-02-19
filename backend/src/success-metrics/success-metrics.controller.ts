import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuccessMetricsService } from './success-metrics.service';

@Controller('success-metrics')
@UseGuards(JwtAuthGuard)
export class SuccessMetricsController {
  constructor(
    private readonly successMetricsService: SuccessMetricsService,
  ) {}

  @Get('enrollment-by-track')
  async getEnrollmentByTrack(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getEnrollmentByTrack(start, end);
  }

  @Get('completion-rates-by-course')
  async getCompletionRatesByCourse(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getCompletionRatesByCourse(start, end);
  }

  @Get('certification-achievement')
  async getCertificationAchievement(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getCertificationAchievementMetrics(start, end);
  }

  @Get('geographic-distribution')
  async getGeographicDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getGeographicDistribution(start, end);
  }

  @Get('course-ratings')
  async getCourseRatings() {
    return this.successMetricsService.getCourseRatingMetrics();
  }

  @Get('assessment-pass-rates')
  async getAssessmentPassRates(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getAssessmentPassRates(start, end);
  }

  @Get('learner-satisfaction')
  async getLearnerSatisfaction(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getLearnerSatisfaction(start, end);
  }

  @Get('time-to-completion')
  async getTimeToCompletion() {
    return this.successMetricsService.getTimeToCompletionMetrics();
  }

  @Get('impact')
  async getImpactMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.successMetricsService.getImpactMetrics(start, end);
  }
}

