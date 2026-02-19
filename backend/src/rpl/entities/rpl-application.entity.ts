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
import { CertificationPathway } from '../../certifications/entities/certification-pathway.entity';

export enum RPLStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PARTIALLY_APPROVED = 'partially_approved',
  REJECTED = 'rejected',
  REQUIRES_EVIDENCE = 'requires_evidence',
}

export enum RPLEvidenceType {
  WORK_EXPERIENCE = 'work_experience',
  PREVIOUS_EDUCATION = 'previous_education',
  PROFESSIONAL_CERTIFICATION = 'professional_certification',
  TRAINING_PROGRAMS = 'training_programs',
  PUBLICATIONS = 'publications',
  LEADERSHIP_ROLES = 'leadership_roles',
  COMMUNITY_SERVICE = 'community_service',
  OTHER = 'other',
}

@Entity('rpl_applications')
export class RPLApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'pathway_id' })
  pathwayId: string;

  @Column({
    type: 'enum',
    enum: RPLStatus,
    default: RPLStatus.DRAFT,
  })
  status: RPLStatus;

  @Column('text')
  rationale: string; // Why RPL should be granted

  @Column('json', { name: 'evidence_items' })
  evidenceItems: {
    type: RPLEvidenceType;
    title: string;
    description: string;
    institution?: string;
    date?: string;
    duration?: string;
    fileUrl?: string;
  }[];

  @Column('json', { name: 'requested_credits', nullable: true })
  requestedCredits: {
    courseId?: string;
    courseName: string;
    justification: string;
  }[];

  @Column('json', { name: 'approved_credits', nullable: true })
  approvedCredits: {
    courseId?: string;
    courseName: string;
    creditHours?: number;
  }[];

  @Column({ name: 'credits_requested', default: 0 })
  creditsRequested: number;

  @Column({ name: 'credits_approved', default: 0 })
  creditsApproved: number;

  @Column({ name: 'assessor_id', nullable: true })
  assessorId: string;

  @Column({ name: 'assessor_notes', type: 'text', nullable: true })
  assessorNotes: string;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CertificationPathway)
  @JoinColumn({ name: 'pathway_id' })
  pathway: CertificationPathway;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assessor_id' })
  assessor: User;
}

