import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClassroomSessionsService } from './classroom-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';
import { SessionType, SessionStatus } from './entities/classroom-session.entity';

@Controller('classroom-sessions')
export class ClassroomSessionsController {
  constructor(private readonly sessionsService: ClassroomSessionsService) {}

  /**
   * Create a new classroom session (trainer only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createSession(@Req() req: any, @Body() body: any) {
    return this.sessionsService.createSession(req.user.id, body);
  }

  /**
   * Get trainer's sessions
   */
  @Get('trainer/my-sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMySessions(
    @Req() req: any,
    @Query('status') status?: SessionStatus,
    @Query('type') type?: SessionType,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.sessionsService.getTrainerSessions(req.user.id, {
      status,
      type,
      upcoming: upcoming === 'true',
    });
  }

  /**
   * Get a specific session
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.getSession(id, req.user?.id);
  }

  /**
   * Get session by code (public endpoint for joining)
   */
  @Get('code/:code')
  async getSessionByCode(@Param('code') code: string) {
    return this.sessionsService.getSessionByCode(code);
  }

  /**
   * Join a session (student)
   */
  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinSession(
    @Req() req: any,
    @Body() body: { sessionCode: string; isPhysical?: boolean },
  ) {
    return this.sessionsService.joinSession(body.sessionCode, req.user.id, body.isPhysical ?? false);
  }

  /**
   * Leave a session
   */
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveSession(@Param('id') id: string, @Req() req: any) {
    await this.sessionsService.leaveSession(id, req.user.id);
    return { success: true };
  }

  /**
   * Start a session (trainer only)
   */
  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async startSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.startSession(id, req.user.id);
  }

  /**
   * Pause a session (trainer only)
   */
  @Post(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async pauseSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.pauseSession(id, req.user.id);
  }

  /**
   * End a session (trainer only)
   */
  @Post(':id/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async endSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.endSession(id, req.user.id);
  }

  @Patch(':id/zoom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateZoomLinks(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { zoomMeetingId?: string; zoomJoinUrl?: string; zoomHostUrl?: string },
  ) {
    return this.sessionsService.updateZoomInfo(id, req.user.id, body);
  }

  @Patch(':id/recording')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateRecording(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { zoomRecordingUrl?: string; zoomAttendanceReportUrl?: string },
  ) {
    return this.sessionsService.updateRecordingInfo(id, req.user.id, body);
  }

  @Post(':id/attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async recordAttendance(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { attendees: Array<{ userId?: string; email?: string; joinTime?: string; leaveTime?: string }> },
  ) {
    return this.sessionsService.recordAttendance(id, req.user.id, body.attendees || []);
  }

  /**
   * Cancel a session (trainer only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.cancelSession(id, req.user.id);
  }

  /**
   * Update current lesson (trainer only)
   */
  @Patch(':id/lesson')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCurrentLesson(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { lessonId: string },
  ) {
    return this.sessionsService.updateCurrentLesson(id, req.user.id, body.lessonId);
  }

  /**
   * Update participant progress
   */
  @Patch(':id/progress')
  @UseGuards(JwtAuthGuard)
  async updateProgress(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { progressPercentage: number; lessonId?: string },
  ) {
    return this.sessionsService.updateParticipantProgress(
      id,
      req.user.id,
      body.progressPercentage,
      body.lessonId,
    );
  }

  /**
   * Get session participants (trainer only)
   */
  @Get(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getParticipants(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.getSessionParticipants(id, req.user.id);
  }

  /**
   * Get session statistics (trainer only)
   */
  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.getSessionStats(id, req.user.id);
  }

  /**
   * Update session settings (trainer only)
   */
  @Patch(':id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSettings(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.sessionsService.updateSessionSettings(id, req.user.id, body);
  }
}

