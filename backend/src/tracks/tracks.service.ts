import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserTrackAssignment,
  TrackAssignmentStatus,
  TrackAssignmentSource,
} from './entities/user-track-assignment.entity';
import { PathwayType } from '../certifications/entities/certification-pathway.entity';

// Re-export types for other modules
export { UserTrackAssignment, TrackAssignmentStatus, TrackAssignmentSource };

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(UserTrackAssignment)
    private trackAssignmentRepository: Repository<UserTrackAssignment>,
  ) {}

  /**
   * Assign a track to a user
   */
  async assignTrack(
    userId: string,
    trackType: PathwayType,
    data: {
      assignedBy?: string;
      assignedReason?: string;
      startDate?: Date;
      endDate?: Date;
      completionTargetDate?: Date;
      isMandatory?: boolean;
      mandatoryReason?: string;
      source?: TrackAssignmentSource;
      metadata?: Record<string, any>;
      notes?: string;
    } = {},
  ): Promise<UserTrackAssignment> {
    // Check if user already has this track assigned
    const existing = await this.trackAssignmentRepository.findOne({
      where: { userId, trackType },
    });

    if (existing) {
      if (existing.status === TrackAssignmentStatus.ACTIVE) {
        throw new HttpException(
          'User already has this track assigned and active',
          HttpStatus.CONFLICT,
        );
      }
      // Reactivate existing assignment
      existing.status = TrackAssignmentStatus.ACTIVE;
      if (data.startDate) existing.startDate = data.startDate;
      if (data.endDate) existing.endDate = data.endDate;
      if (data.completionTargetDate) existing.completionTargetDate = data.completionTargetDate;
      if (data.isMandatory !== undefined) existing.isMandatory = data.isMandatory;
      if (data.mandatoryReason) existing.mandatoryReason = data.mandatoryReason;
      if (data.assignedBy) existing.assignedBy = data.assignedBy;
      if (data.assignedReason) existing.assignedReason = data.assignedReason;
      if (data.notes) existing.notes = data.notes;
      if (data.metadata) existing.metadata = { ...existing.metadata, ...data.metadata };
      return this.trackAssignmentRepository.save(existing);
    }

    // Create new assignment
    const assignment = this.trackAssignmentRepository.create({
      userId,
      trackType,
      status: TrackAssignmentStatus.ACTIVE,
      source: data.source || TrackAssignmentSource.MANUAL,
      assignedBy: data.assignedBy,
      assignedReason: data.assignedReason,
      startDate: data.startDate || new Date(),
      endDate: data.endDate,
      completionTargetDate: data.completionTargetDate,
      isMandatory: data.isMandatory || false,
      mandatoryReason: data.mandatoryReason,
      metadata: data.metadata,
      notes: data.notes,
    });

    return this.trackAssignmentRepository.save(assignment);
  }

  /**
   * Remove or deactivate a track assignment
   */
  async removeTrack(
    userId: string,
    trackType: PathwayType,
    reason?: string,
  ): Promise<void> {
    const assignment = await this.trackAssignmentRepository.findOne({
      where: { userId, trackType },
    });

    if (!assignment) {
      throw new HttpException('Track assignment not found', HttpStatus.NOT_FOUND);
    }

    assignment.status = TrackAssignmentStatus.INACTIVE;
    if (reason) {
      assignment.notes = (assignment.notes || '') + `\nRemoved: ${reason}`;
    }
    await this.trackAssignmentRepository.save(assignment);
  }

  /**
   * Get all track assignments for a user
   */
  async getUserTracks(userId: string): Promise<UserTrackAssignment[]> {
    return this.trackAssignmentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active track assignments for a user
   */
  async getUserActiveTracks(userId: string): Promise<UserTrackAssignment[]> {
    return this.trackAssignmentRepository.find({
      where: {
        userId,
        status: TrackAssignmentStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get users assigned to a specific track
   */
  async getTrackUsers(
    trackType: PathwayType,
    status?: TrackAssignmentStatus,
  ): Promise<UserTrackAssignment[]> {
    const where: any = { trackType };
    if (status) {
      where.status = status;
    }

    return this.trackAssignmentRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update track assignment
   */
  async updateTrackAssignment(
    assignmentId: string,
    updates: Partial<UserTrackAssignment>,
  ): Promise<UserTrackAssignment> {
    const assignment = await this.trackAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new HttpException('Track assignment not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(assignment, updates);
    return this.trackAssignmentRepository.save(assignment);
  }

  /**
   * Get track assignment statistics
   */
  async getTrackStatistics(): Promise<any> {
    const allAssignments = await this.trackAssignmentRepository.find();

    const stats: any = {
      total: allAssignments.length,
      byStatus: {},
      byTrack: {},
      bySource: {},
      mandatory: 0,
      active: 0,
    };

    // Count by status
    Object.values(TrackAssignmentStatus).forEach((status) => {
      stats.byStatus[status] = allAssignments.filter((a) => a.status === status).length;
    });

    // Count by track type
    Object.values(PathwayType).forEach((track) => {
      stats.byTrack[track] = allAssignments.filter((a) => a.trackType === track).length;
    });

    // Count by source
    Object.values(TrackAssignmentSource).forEach((source) => {
      stats.bySource[source] = allAssignments.filter((a) => a.source === source).length;
    });

    stats.mandatory = allAssignments.filter((a) => a.isMandatory).length;
    stats.active = stats.byStatus[TrackAssignmentStatus.ACTIVE] || 0;

    return stats;
  }
}

