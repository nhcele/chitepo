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
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

export enum CohortStatus {
  UPCOMING = 'upcoming',
  OPEN_FOR_ENROLLMENT = 'open_for_enrollment',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CohortQuarter {
  Q1 = 'q1', // January-March
  Q2 = 'q2', // April-June
  Q3 = 'q3', // July-September
  Q4 = 'q4', // October-December
}

export enum CohortTrack {
  DCC_TRAINING = 'dcc_training',
  LOCAL_GOVERNMENT = 'local_government',
  RURAL_DEVELOPMENT = 'rural_development',
  TRADITIONAL_LEADERSHIP = 'traditional_leadership',
  JUDICIAL_OFFICERS = 'judicial_officers',
  GENERAL_IDEOLOGY = 'general_ideology',
  DIASPORA_VIRTUAL = 'diaspora_virtual',
}

export enum CohortPacingMode {
  COHORT_PACED = 'cohort_paced',
  SELF_PACED = 'self_paced',
  HYBRID = 'hybrid',
}

@Entity('training_cohorts')
export class TrainingCohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "DCC Training Cohort Q1 2025"

  @Column({
    type: 'enum',
    enum: CohortTrack,
  })
  track: CohortTrack;

  @Column({
    type: 'enum',
    enum: CohortQuarter,
  })
  quarter: CohortQuarter;

  @Column()
  year: number;

  @Column({
    type: 'enum',
    enum: CohortStatus,
    default: CohortStatus.UPCOMING,
  })
  status: CohortStatus;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ name: 'enrollment_open_date' })
  enrollmentOpenDate: Date;

  @Column({ name: 'enrollment_close_date' })
  enrollmentCloseDate: Date;

  @Column({ name: 'max_participants', default: 100 })
  maxParticipants: number;

  @Column({ name: 'current_participants', default: 0 })
  currentParticipants: number;

  @Column({ name: 'is_mandatory', default: false })
  isMandatory: boolean;

  @Column({ name: 'mandatory_for', nullable: true })
  mandatoryFor: string; // e.g., "New councillors elected in 2024"

  @Column({ name: 'is_virtual', default: false })
  isVirtual: boolean;

  @Column({ name: 'meeting_schedule', nullable: true })
  meetingSchedule: string; // e.g., "Every Tuesday & Thursday 18:00-20:00 CAT"

  @Column({ name: 'venue', nullable: true })
  venue: string; // Physical location or "Online"

  @Column({
    name: 'pacing_mode',
    type: 'enum',
    enum: CohortPacingMode,
    default: CohortPacingMode.COHORT_PACED,
  })
  pacingMode: CohortPacingMode;

  @Column({ name: 'weekly_target_minutes', type: 'int', nullable: true })
  weeklyTargetMinutes?: number | null;

  @Column({ name: 'instructor_id', nullable: true })
  instructorId: string;

  @Column('json', { name: 'course_ids', nullable: true })
  courseIds: string[]; // Array of course IDs in this cohort

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column('json', { nullable: true })
  prerequisites: string[];

  @Column('text', { nullable: true })
  notes: string;

  @Column({ name: 'onboarding_template', type: 'json', nullable: true })
  onboardingTemplate?: Array<{ title: string }>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor: User;

  @OneToMany(() => CohortEnrollment, (enrollment) => enrollment.cohort)
  enrollments: CohortEnrollment[];
}

@Entity('cohort_enrollments')
export class CohortEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cohort_id' })
  cohortId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'mentor_id', nullable: true })
  mentorId: string;

  @Column({
    type: 'enum',
    enum: ['enrolled', 'active', 'completed', 'withdrawn', 'failed'],
    default: 'enrolled',
  })
  status: string;

  @Column({ name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'attendance_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendancePercentage: number;

  @Column({ name: 'final_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  finalScore: number;

  @Column({ name: 'onboarding_checklist', type: 'json', nullable: true })
  onboardingChecklist: Array<{ title: string; completed: boolean; completedAt?: Date }>;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => TrainingCohort, (cohort) => cohort.enrollments)
  @JoinColumn({ name: 'cohort_id' })
  cohort: TrainingCohort;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

