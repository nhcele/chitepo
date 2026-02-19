import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CertificationPathway } from './certification-pathway.entity';

export enum CertificationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  AWARDED = 'awarded',
  EXPIRED = 'expired',
}

@Entity('user_certifications')
export class UserCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'pathway_id' })
  pathwayId: string;

  @Column({
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.NOT_STARTED,
  })
  status: CertificationStatus;

  @Column({ name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  @Column({ name: 'courses_completed', default: 0 })
  coursesCompleted: number;

  @Column({ name: 'courses_required', default: 0 })
  coursesRequired: number;

  @Column('json', { name: 'completed_course_ids', nullable: true })
  completedCourseIds: string[] | null;

  @Column({ name: 'average_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageScore: number;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'awarded_at', nullable: true })
  awardedAt: Date;

  @Column({ name: 'certificate_url', nullable: true })
  certificateUrl: string;

  @Column({ name: 'certificate_number', nullable: true })
  certificateNumber: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CertificationPathway, (pathway) => pathway.userCertifications)
  @JoinColumn({ name: 'pathway_id' })
  pathway: CertificationPathway;
}

