import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PathwayType } from '../../certifications/entities/certification-pathway.entity';

export enum TrackAssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum TrackAssignmentSource {
  MANUAL = 'manual', // Admin assigned
  SELF_ENROLLED = 'self_enrolled', // User self-selected
  AUTOMATIC = 'automatic', // System auto-assigned based on role/position
  MIGRATED = 'migrated', // Imported from legacy system
}

@Entity('user_track_assignments')
@Unique(['userId', 'trackType'])
@Index('idx_user_track_user_id', ['userId'])
@Index('idx_user_track_type', ['trackType'])
@Index('idx_user_track_status', ['status'])
export class UserTrackAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'track_type',
    type: 'enum',
    enum: PathwayType,
  })
  trackType: PathwayType;

  @Column({
    type: 'enum',
    enum: TrackAssignmentStatus,
    default: TrackAssignmentStatus.ACTIVE,
  })
  status: TrackAssignmentStatus;

  @Column({
    type: 'enum',
    enum: TrackAssignmentSource,
    default: TrackAssignmentSource.MANUAL,
  })
  source: TrackAssignmentSource;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string; // Admin user ID who assigned this track

  @Column({ name: 'assigned_reason', type: 'text', nullable: true })
  assignedReason: string; // Why this track was assigned

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date; // When track assignment begins

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date; // Optional end date for track assignment

  @Column({ name: 'completion_target_date', type: 'timestamp', nullable: true })
  completionTargetDate: Date; // Target date for track completion

  @Column({ name: 'is_mandatory', default: false })
  isMandatory: boolean; // Whether this is a mandatory track assignment

  @Column({ name: 'mandatory_reason', type: 'text', nullable: true })
  mandatoryReason: string; // Reason why this is mandatory

  @Column('json', { name: 'metadata', nullable: true })
  metadata: Record<string, any>; // Additional track-specific data

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string; // Admin notes about this assignment

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

