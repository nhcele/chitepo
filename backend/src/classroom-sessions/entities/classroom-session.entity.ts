import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Lesson } from '../../courses/entities/lesson.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SessionType {
  PHYSICAL = 'physical', // Physical classroom
  HYBRID = 'hybrid', // Mix of physical and remote
  VIRTUAL = 'virtual', // Fully online
}

@Entity('classroom_sessions')
export class ClassroomSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'session_code', unique: true })
  sessionCode: string; // Unique code for students to join (e.g., "ABC123")

  @Column({ name: 'trainer_id' })
  trainerId: string;

  @Column({ name: 'course_id', nullable: true })
  courseId: string | null;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId: string | null; // Current lesson being taught

  @Column({
    type: 'enum',
    enum: SessionType,
    default: SessionType.PHYSICAL,
  })
  type: SessionType;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Column({ name: 'scheduled_start' })
  scheduledStart: Date;

  @Column({ name: 'scheduled_end', nullable: true })
  scheduledEnd: Date | null;

  @Column({ name: 'timezone', length: 64, default: 'Africa/Harare' })
  timezone: string;

  @Column({ name: 'zoom_meeting_id', nullable: true })
  zoomMeetingId: string;

  @Column({ name: 'zoom_join_url', type: 'text', nullable: true })
  zoomJoinUrl: string;

  @Column({ name: 'zoom_host_url', type: 'text', nullable: true })
  zoomHostUrl: string;

  @Column({ name: 'zoom_recording_url', type: 'text', nullable: true })
  zoomRecordingUrl: string;

  @Column({ name: 'zoom_attendance_report_url', type: 'text', nullable: true })
  zoomAttendanceReportUrl: string;

  @Column({ name: 'actual_start', nullable: true })
  actualStart: Date | null;

  @Column({ name: 'actual_end', nullable: true })
  actualEnd: Date | null;

  @Column({ name: 'venue', nullable: true })
  venue: string; // Physical location or "Online"

  @Column({ name: 'max_participants', default: 50 })
  maxParticipants: number;

  @Column({ name: 'is_synchronized', default: false })
  isSynchronized: boolean; // If true, all participants see same content

  @Column({ name: 'allow_remote_join', default: false })
  allowRemoteJoin: boolean; // Allow remote students to join

  @Column('json', { nullable: true })
  settings: {
    showProgressToTrainer?: boolean;
    allowQuestions?: boolean;
    recordSession?: boolean;
    autoAdvance?: boolean;
  };

  @Column('text', { nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'trainer_id' })
  trainer: User;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @OneToMany(() => ClassroomSessionParticipant, (participant) => participant.session)
  participants: ClassroomSessionParticipant[];
}

@Entity('classroom_session_participants')
export class ClassroomSessionParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', nullable: true })
  leftAt: Date | null;

  @Column({ name: 'is_physical', default: true })
  isPhysical: boolean; // true if physically present, false if remote

  @Column({ name: 'current_lesson_id', nullable: true })
  currentLessonId: string | null;

  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date | null;

  @Column('json', { nullable: true })
  metadata: {
    deviceType?: string;
    location?: string;
    connectionQuality?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ClassroomSession, (session) => session.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ClassroomSession;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

