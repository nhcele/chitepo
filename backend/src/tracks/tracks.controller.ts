import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';
import { TracksService } from './tracks.service';
import { PathwayType } from '../certifications/entities/certification-pathway.entity';
import { TrackAssignmentStatus, TrackAssignmentSource } from './entities/user-track-assignment.entity';

@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  /**
   * Get current user's track assignments
   */
  @Get('my-tracks')
  async getMyTracks(@Req() req: any) {
    const userId = req.user.id;
    return this.tracksService.getUserActiveTracks(userId);
  }

  /**
   * Get all track assignments for current user (including inactive)
   */
  @Get('my-tracks/all')
  async getAllMyTracks(@Req() req: any) {
    const userId = req.user.id;
    return this.tracksService.getUserTracks(userId);
  }

  /**
   * Get users assigned to a specific track (admin only)
   */
  @Get('users/:trackType')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTrackUsers(
    @Param('trackType') trackType: PathwayType,
    @Query('status') status?: TrackAssignmentStatus,
  ) {
    return this.tracksService.getTrackUsers(trackType, status);
  }

  /**
   * Assign a track to a user (admin only)
   */
  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async assignTrack(
    @Req() req: any,
    @Body()
    body: {
      userId: string;
      trackType: PathwayType;
      assignedReason?: string;
      startDate?: string;
      endDate?: string;
      completionTargetDate?: string;
      isMandatory?: boolean;
      mandatoryReason?: string;
      source?: TrackAssignmentSource;
      metadata?: Record<string, any>;
      notes?: string;
    },
  ) {
    return this.tracksService.assignTrack(body.userId, body.trackType, {
      assignedBy: req.user.id,
      assignedReason: body.assignedReason,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      completionTargetDate: body.completionTargetDate
        ? new Date(body.completionTargetDate)
        : undefined,
      isMandatory: body.isMandatory,
      mandatoryReason: body.mandatoryReason,
      source: body.source,
      metadata: body.metadata,
      notes: body.notes,
    });
  }

  /**
   * Self-enroll in a track
   */
  @Post('self-enroll/:trackType')
  async selfEnrollTrack(
    @Req() req: any,
    @Param('trackType') trackType: PathwayType,
    @Body() body: { reason?: string },
  ) {
    const userId = req.user.id;
    return this.tracksService.assignTrack(userId, trackType, {
      source: TrackAssignmentSource.SELF_ENROLLED,
      assignedReason: body.reason,
    });
  }

  /**
   * Remove track assignment (admin only)
   */
  @Delete('assign/:trackType/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeTrack(
    @Param('userId') userId: string,
    @Param('trackType') trackType: PathwayType,
    @Body() body: { reason?: string },
  ) {
    await this.tracksService.removeTrack(userId, trackType, body.reason);
    return { success: true, message: 'Track assignment removed' };
  }

  /**
   * Update track assignment (admin only)
   */
  @Put('assign/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateTrackAssignment(
    @Param('id') assignmentId: string,
    @Body() body: Partial<any>,
  ) {
    return this.tracksService.updateTrackAssignment(assignmentId, body);
  }

  /**
   * Get track statistics (admin only)
   */
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics() {
    return this.tracksService.getTrackStatistics();
  }
}

