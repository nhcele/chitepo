import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
  Patch,
} from '@nestjs/common';
import { CohortsService } from './cohorts.service';
import { CohortGraduationService } from './cohort-graduation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CohortStatus,
  CohortQuarter,
  CohortTrack,
  CohortPacingMode,
} from './entities/training-cohort.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';

@Controller('cohorts')
export class CohortsController {
  constructor(
    private readonly cohortsService: CohortsService,
    private readonly graduationService: CohortGraduationService,
  ) {}

  @Get()
  async getAllCohorts(
    @Query('track') track?: CohortTrack,
    @Query('quarter') quarter?: CohortQuarter,
    @Query('year') year?: number,
    @Query('status') status?: CohortStatus,
  ) {
    return this.cohortsService.getAllCohorts({ track, quarter, year, status });
  }

  @Get('upcoming')
  async getUpcomingCohorts() {
    return this.cohortsService.getUpcomingCohorts();
  }

  @Get('calendar/:year')
  async getCalendarView(@Param('year') year: string) {
    return this.cohortsService.getCalendarView(parseInt(year));
  }

  @Get('quarter/:quarter/:year')
  async getCohortsByQuarter(
    @Param('quarter') quarter: CohortQuarter,
    @Param('year') year: string,
  ) {
    return this.cohortsService.getCohortsByQuarter(quarter, parseInt(year));
  }

  @Get('track/:track')
  async getCohortsByTrack(@Param('track') track: CohortTrack) {
    return this.cohortsService.getCohortsByTrack(track);
  }

  @Get(':id')
  async getCohort(@Param('id') id: string) {
    return this.cohortsService.getCohortById(id);
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return this.cohortsService.getCohortStatistics(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enroll(@Param('id') id: string, @Req() req: any) {
    return this.cohortsService.enrollInCohort(req.user.id, id);
  }

  @Delete(':id/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(@Param('id') id: string, @Req() req: any) {
    return this.cohortsService.withdrawFromCohort(req.user.id, id);
  }

  @Post(':id/mentor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR)
  async assignMentor(
    @Param('id') cohortId: string,
    @Body() body: { userId: string; mentorId: string },
  ) {
    return this.cohortsService.assignMentor(cohortId, body.userId, body.mentorId);
  }

  @Patch(':id/onboarding/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR)
  async updateOnboarding(
    @Param('id') cohortId: string,
    @Param('userId') userId: string,
    @Body() body: { checklist: Array<{ title: string; completed: boolean; completedAt?: Date }> },
  ) {
    return this.cohortsService.updateOnboardingChecklist(cohortId, userId, body.checklist || []);
  }

  @Get('user/enrollments')
  @UseGuards(JwtAuthGuard)
  async getUserEnrollments(@Req() req: any) {
    return this.cohortsService.getUserEnrollments(req.user.id);
  }

  @Patch(':id/pacing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR)
  async updateCohortPacing(
    @Param('id') cohortId: string,
    @Body() body: { pacingMode?: CohortPacingMode; weeklyTargetMinutes?: number | null },
  ) {
    return this.cohortsService.updateCohortPacing(cohortId, body || {});
  }

  // Graduation endpoints
  @Get(':id/graduation/eligibility/:userId')
  @UseGuards(JwtAuthGuard)
  async checkGraduationEligibility(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.graduationService.checkGraduationEligibility(id, userId);
  }

  @Post(':id/graduation/process')
  @UseGuards(JwtAuthGuard)
  async processGraduation(@Param('id') id: string, @Body() body: any) {
    return this.graduationService.processCohortGraduation(id, body.criteria);
  }

  @Get(':id/graduation/stats')
  async getGraduationStats(@Param('id') id: string) {
    return this.graduationService.getGraduationStats(id);
  }

  @Post(':id/graduation/certificates')
  @UseGuards(JwtAuthGuard)
  async generateCertificates(@Param('id') id: string) {
    return this.graduationService.generateGraduationCertificates(id);
  }
}
