import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService, LearnerProgressMetrics, CourseAnalytics, BusinessIntelligence } from './analytics.service';
import { CreateAnalyticsEventDto, AnalyticsEventType } from '@mindelta/shared';
import { AdminService } from '../admin/admin.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly adminService: AdminService,
  ) {}

  private async ensureEnabled() {
    const res = await this.adminService.getSettings();
    const enabled = !!res?.settings?.['feature.analyticsEnabled'];
    if (!enabled) throw new ForbiddenException('Analytics is disabled by admin');
  }

  @Post('events')
  @UseGuards(JwtAuthGuard)
  async trackEvent(@Body() createAnalyticsEventDto: CreateAnalyticsEventDto, @Req() req: any) {
    try {
      // Check if analytics is enabled, but don't throw error - just return success
      const res = await this.adminService.getSettings();
      const enabled = !!res?.settings?.['feature.analyticsEnabled'];
      if (!enabled) {
        return { success: true, message: 'Analytics is disabled' };
      }

      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return { success: false, message: 'User ID is required' };
      }
      
      const ipAddress = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '') as string;
      const userAgent = req.headers['user-agent'] as string | undefined;
      const sessionId = (req.headers['x-session-id'] as string) || createAnalyticsEventDto.sessionId || '';

      const payload: CreateAnalyticsEventDto = {
        ...createAnalyticsEventDto,
        userId,
        sessionId: sessionId || 'unknown',
        ipAddress,
        userAgent,
      } as any;

      return this.analyticsService.trackEvent(payload);
    } catch (error) {
      // Silently fail analytics tracking - don't break the user experience
      return { success: false, message: 'Analytics tracking failed' };
    }
  }

  @Get('events/user/:userId')
  @UseGuards(JwtAuthGuard)
  getEventsByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.ensureEnabled().then(() => this.analyticsService.getEventsByUser(userId, limit));
  }

  @Get('events/session/:sessionId')
  @UseGuards(JwtAuthGuard)
  getEventsBySession(@Param('sessionId') sessionId: string) {
    return this.ensureEnabled().then(() => this.analyticsService.getEventsBySession(sessionId));
  }

  @Get('events/type/:eventType')
  @UseGuards(JwtAuthGuard)
  getEventsByType(
    @Param('eventType') eventType: AnalyticsEventType,
    @Query('limit') limit?: number,
  ) {
    return this.ensureEnabled().then(() => this.analyticsService.getEventsByType(eventType, limit));
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.ensureEnabled().then(() => this.analyticsService.getCourseAnalytics(courseId));
  }

  @Get('user/:userId/progress')
  @UseGuards(JwtAuthGuard)
  getUserLearningProgress(@Param('userId') userId: string) {
    return this.ensureEnabled().then(() => this.analyticsService.getUserLearningProgress(userId));
  }

  @Get('course/:courseId/summary')
  @UseGuards(JwtAuthGuard)
  getCourseSummary(@Param('courseId') courseId: string) {
    return this.ensureEnabled().then(() => this.analyticsService.getCourseSummary(courseId));
  }

  @Get('instructor/:instructorId/summary')
  @UseGuards(JwtAuthGuard)
  getInstructorSummary(@Param('instructorId') instructorId: string) {
    return this.ensureEnabled().then(() => this.analyticsService.getInstructorSummary(instructorId));
  }

  // Enhanced Analytics Endpoints

  @Get('learner/:userId/progress-metrics')
  @UseGuards(JwtAuthGuard)
  async getLearnerProgressMetrics(@Param('userId') userId: string) {
    await this.ensureEnabled();
    return this.analyticsService.getLearnerProgressMetrics(userId);
  }

  @Get('course/:courseId/analytics-metrics')
  @UseGuards(JwtAuthGuard)
  async getCourseAnalyticsMetrics(@Param('courseId') courseId: string) {
    await this.ensureEnabled();
    return this.analyticsService.getCourseAnalyticsMetrics(courseId);
  }

  @Get('platform/engagement-metrics')
  @UseGuards(JwtAuthGuard)
  async getPlatformEngagementMetrics() {
    await this.ensureEnabled();
    return this.analyticsService.getPlatformEngagementMetrics();
  }

  @Get('instructor/:instructorId/revenue-analytics')
  @UseGuards(JwtAuthGuard)
  async getInstructorRevenueAnalytics(@Param('instructorId') instructorId: string) {
    await this.ensureEnabled();
    return this.analyticsService.getInstructorRevenueAnalytics(instructorId);
  }

  @Get('live-session/:sessionId/summary')
  @UseGuards(JwtAuthGuard)
  async getLiveSessionSummary(@Param('sessionId') sessionId: string) {
    await this.ensureEnabled();
    return this.analyticsService.getLiveSessionSummary(sessionId);
  }

  @Get('business-intelligence')
  @UseGuards(JwtAuthGuard)
  async getBusinessIntelligence() {
    await this.ensureEnabled();
    return this.analyticsService.getBusinessIntelligence();
  }
}
