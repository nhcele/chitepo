import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ClassroomSession,
  ClassroomSessionParticipant,
  SessionStatus,
  SessionType,
} from './entities/classroom-session.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import * as crypto from 'crypto';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType } from '@mindelta/shared';

@Injectable()
export class ClassroomSessionsService {
  constructor(
    @InjectRepository(ClassroomSession)
    private readonly sessionRepo: Repository<ClassroomSession>,
    @InjectRepository(ClassroomSessionParticipant)
    private readonly participantRepo: Repository<ClassroomSessionParticipant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Generate a unique 6-character session code
   */
  private generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Ensure session code is unique
   */
  private async ensureUniqueCode(): Promise<string> {
    let code = this.generateSessionCode();
    let attempts = 0;
    while (await this.sessionRepo.findOne({ where: { sessionCode: code } })) {
      code = this.generateSessionCode();
      attempts++;
      if (attempts > 10) {
        // Fallback to longer code if too many collisions
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
      }
    }
    return code;
  }

  /**
   * Create a new classroom session
   */
  async createSession(
    trainerId: string,
    data: {
      title: string;
      description?: string;
      courseId?: string;
      lessonId?: string;
      type: SessionType;
      scheduledStart: Date;
      scheduledEnd?: Date;
      timezone?: string;
      venue?: string;
      maxParticipants?: number;
      allowRemoteJoin?: boolean;
      zoomMeetingId?: string;
      zoomJoinUrl?: string;
      zoomHostUrl?: string;
      settings?: any;
    },
  ): Promise<ClassroomSession> {
    // Verify trainer exists and has instructor role
    const trainer = await this.userRepo.findOne({ where: { id: trainerId } });
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    // Verify course if provided
    if (data.courseId) {
      const course = await this.courseRepo.findOne({ where: { id: data.courseId } });
      if (!course) {
        throw new NotFoundException('Course not found');
      }
    }

    // Verify lesson if provided
    if (data.lessonId) {
      const lesson = await this.lessonRepo.findOne({ where: { id: data.lessonId } });
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
    }

    const sessionCode = await this.ensureUniqueCode();

    const session = this.sessionRepo.create({
      ...data,
      trainerId,
      sessionCode,
      status: SessionStatus.SCHEDULED,
      timezone: data.timezone || 'Africa/Harare',
      maxParticipants: data.maxParticipants || 200,
      allowRemoteJoin: data.allowRemoteJoin ?? true,
      zoomMeetingId: data.zoomMeetingId,
      zoomJoinUrl: data.zoomJoinUrl,
      zoomHostUrl: data.zoomHostUrl,
      isSynchronized: true, // Default to synchronized for hybrid sessions
      settings: data.settings || {
        showProgressToTrainer: true,
        allowQuestions: true,
        recordSession: false,
        autoAdvance: false,
      },
    });

    return await this.sessionRepo.save(session);
  }

  /**
   * Get all sessions for a trainer
   */
  async getTrainerSessions(
    trainerId: string,
    filters?: {
      status?: SessionStatus;
      type?: SessionType;
      upcoming?: boolean;
    },
  ): Promise<ClassroomSession[]> {
    const query = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.trainerId = :trainerId', { trainerId })
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('session.lesson', 'lesson')
      .leftJoinAndSelect('session.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user');

    if (filters?.status) {
      query.andWhere('session.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('session.type = :type', { type: filters.type });
    }

    if (filters?.upcoming) {
      query.andWhere('session.scheduledStart >= :now', { now: new Date() });
    }

    query.orderBy('session.scheduledStart', 'DESC');

    return await query.getMany();
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string, userId?: string): Promise<ClassroomSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['trainer', 'course', 'lesson', 'participants', 'participants.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if user is trainer or participant
    if (userId && session.trainerId !== userId) {
      const isParticipant = await this.participantRepo.findOne({
        where: { sessionId, userId },
      });
      if (!isParticipant) {
        throw new ForbiddenException('You do not have access to this session');
      }
    }

    return session;
  }

  /**
   * Get a session by code (for students to join)
   */
  async getSessionByCode(sessionCode: string): Promise<ClassroomSession> {
    const session = await this.sessionRepo.findOne({
      where: { sessionCode },
      relations: ['trainer', 'course', 'lesson'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException('This session has been cancelled');
    }

    return session;
  }

  /**
   * Join a session (for students)
   */
  async joinSession(
    sessionCode: string,
    userId: string,
    isPhysical: boolean = false,
  ): Promise<ClassroomSessionParticipant> {
    const session = await this.getSessionByCode(sessionCode);

    // Check if session is active or scheduled
    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('This session has already ended');
    }

    // Check participant limit
    const participantCount = await this.participantRepo.count({
      where: { sessionId: session.id },
    });

    if (participantCount >= session.maxParticipants) {
      throw new BadRequestException('Session is full');
    }

    // Check if already joined
    const existing = await this.participantRepo.findOne({
      where: { sessionId: session.id, userId },
    });

    if (existing) {
      if (existing.leftAt) {
        // Rejoin
        existing.leftAt = null;
        existing.joinedAt = new Date();
        existing.lastActivityAt = new Date();
        return await this.participantRepo.save(existing);
      }
      return existing;
    }

    // Create new participant
    const participant = this.participantRepo.create({
      sessionId: session.id,
      userId,
      isPhysical,
      joinedAt: new Date(),
      lastActivityAt: new Date(),
      progressPercentage: 0,
    });

    const saved = await this.participantRepo.save(participant);

    // Emit analytics
    await this.analyticsService.trackEvent({
      userId,
      eventType: 'live_session_joined' as any,
      sessionId: session.id,
      metadata: { isPhysical },
    });

    return saved;
  }

  /**
   * Leave a session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: { sessionId, userId },
    });

    if (participant && !participant.leftAt) {
      participant.leftAt = new Date();
      await this.participantRepo.save(participant);
      await this.analyticsService.trackEvent({
        userId,
        eventType: 'live_session_left' as any,
        sessionId,
        metadata: {},
      });
    }
  }

  /**
   * Start a session (trainer only)
   */
  async startSession(sessionId: string, trainerId: string): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can start the session');
    }

    if (session.status !== SessionStatus.SCHEDULED && session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('Session cannot be started in its current state');
    }

    session.status = SessionStatus.ACTIVE;
    session.actualStart = new Date();

    const saved = await this.sessionRepo.save(session);
    await this.analyticsService.trackEvent({
      userId: trainerId,
      eventType: 'live_session_started' as any,
      sessionId,
      metadata: {},
    });

    return saved;
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId: string, trainerId: string): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can pause the session');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Session is not active');
    }

    session.status = SessionStatus.PAUSED;

    return await this.sessionRepo.save(session);
  }

  /**
   * End/Complete a session
   */
  async endSession(sessionId: string, trainerId: string): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can end the session');
    }

    session.status = SessionStatus.COMPLETED;
    session.actualEnd = new Date();

    const saved = await this.sessionRepo.save(session);
    await this.analyticsService.trackEvent({
      userId: trainerId,
      eventType: 'live_session_ended' as any,
      sessionId,
      metadata: {},
    });

    return saved;
  }

  /**
   * Update current lesson in session (synchronized content)
   */
  async updateCurrentLesson(
    sessionId: string,
    trainerId: string,
    lessonId: string,
  ): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can update the lesson');
    }

    // Verify lesson exists
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    session.lessonId = lessonId;

    // If synchronized, update all participants' current lesson
    if (session.isSynchronized) {
      await this.participantRepo.update(
        { sessionId },
        { currentLessonId: lessonId, lastActivityAt: new Date() },
      );
    }

    return await this.sessionRepo.save(session);
  }

  /**
   * Update participant progress
   */
  async updateParticipantProgress(
    sessionId: string,
    userId: string,
    progressPercentage: number,
    lessonId?: string,
  ): Promise<ClassroomSessionParticipant> {
    const participant = await this.participantRepo.findOne({
      where: { sessionId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found in session');
    }

    participant.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    participant.lastActivityAt = new Date();

    if (lessonId) {
      participant.currentLessonId = lessonId;
    }

    return await this.participantRepo.save(participant);
  }

  /**
   * Get session participants with progress
   */
  async getSessionParticipants(sessionId: string, trainerId: string): Promise<ClassroomSessionParticipant[]> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can view participants');
    }

    return await this.participantRepo.find({
      where: { sessionId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  /**
   * Get live session statistics
   */
  async getSessionStats(sessionId: string, trainerId: string): Promise<any> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can view statistics');
    }

    const participants = await this.participantRepo.find({
      where: { sessionId, leftAt: null },
    });

    const physicalCount = participants.filter((p) => p.isPhysical).length;
    const remoteCount = participants.filter((p) => !p.isPhysical).length;
    const avgProgress =
      participants.length > 0
        ? participants.reduce((sum, p) => sum + Number(p.progressPercentage), 0) / participants.length
        : 0;

    return {
      totalParticipants: participants.length,
      physicalParticipants: physicalCount,
      remoteParticipants: remoteCount,
      averageProgress: Math.round(avgProgress * 100) / 100,
      maxParticipants: session.maxParticipants,
      sessionStatus: session.status,
    };
  }

  /**
   * Update session settings
   */
  async updateSessionSettings(
    sessionId: string,
    trainerId: string,
    settings: any,
  ): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can update settings');
    }

    session.settings = { ...session.settings, ...settings };

    return await this.sessionRepo.save(session);
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, trainerId: string): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can cancel the session');
    }

    session.status = SessionStatus.CANCELLED;

    return await this.sessionRepo.save(session);
  }

  /**
   * Update Zoom info
   */
  async updateZoomInfo(
    sessionId: string,
    trainerId: string,
    data: { zoomMeetingId?: string; zoomJoinUrl?: string; zoomHostUrl?: string },
  ): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);
    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can update Zoom details');
    }

    session.zoomMeetingId = data.zoomMeetingId ?? session.zoomMeetingId;
    session.zoomJoinUrl = data.zoomJoinUrl ?? session.zoomJoinUrl;
    session.zoomHostUrl = data.zoomHostUrl ?? session.zoomHostUrl;

    return await this.sessionRepo.save(session);
  }

  /**
   * Update recording info
   */
  async updateRecordingInfo(
    sessionId: string,
    trainerId: string,
    data: { zoomRecordingUrl?: string; zoomAttendanceReportUrl?: string },
  ): Promise<ClassroomSession> {
    const session = await this.getSession(sessionId, trainerId);
    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can update recording info');
    }

    session.zoomRecordingUrl = data.zoomRecordingUrl ?? session.zoomRecordingUrl;
    session.zoomAttendanceReportUrl = data.zoomAttendanceReportUrl ?? session.zoomAttendanceReportUrl;

    return await this.sessionRepo.save(session);
  }

  /**
   * Record attendance from provider report and emit analytics
   */
  async recordAttendance(
    sessionId: string,
    trainerId: string,
    attendees: Array<{ userId?: string; email?: string; joinTime?: string; leaveTime?: string }>,
  ): Promise<{ recorded: number }> {
    const session = await this.getSession(sessionId, trainerId);

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('Only the trainer can record attendance');
    }

    let recorded = 0;
    for (const attendee of attendees || []) {
      const userId = attendee.userId;
      recorded += 1;
      await this.analyticsService.trackEvent({
        userId,
        eventType: 'live_session_attendance_recorded' as any,
        sessionId,
        metadata: {
          email: attendee.email,
          joinTime: attendee.joinTime,
          leaveTime: attendee.leaveTime,
        },
      });
    }

    return { recorded };
  }
}
