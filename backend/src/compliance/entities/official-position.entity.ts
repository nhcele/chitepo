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

export enum OfficialPositionType {
  COUNCILLOR = 'councillor',
  MAYOR = 'mayor',
  COUNCIL_CHAIRPERSON = 'council_chairperson',
  DCC_MEMBER = 'dcc_member',
  PARLIAMENTARY_CANDIDATE = 'parliamentary_candidate',
  SENATE_CANDIDATE = 'senate_candidate',
  MINISTER = 'minister',
  DEPUTY_MINISTER = 'deputy_minister',
  TRADITIONAL_LEADER = 'traditional_leader',
  JUDICIAL_OFFICER = 'judicial_officer',
  PARTY_OFFICIAL = 'party_official',
  RDC_OFFICIAL = 'rdc_official',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  GRACE_PERIOD = 'grace_period',
  EXEMPTED = 'exempted',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('official_positions')
export class OfficialPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: OfficialPositionType,
  })
  position: OfficialPositionType;

  @Column({ name: 'position_title' })
  positionTitle: string; // e.g., "Councillor for Ward 5, Harare"

  @Column({ name: 'region_province', nullable: true })
  regionProvince: string;

  @Column({ nullable: true })
  ward: string;

  @Column({ nullable: true })
  constituency: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_elected', default: true })
  isElected: boolean; // vs appointed

  @Column({ name: 'election_year', nullable: true })
  electionYear: number;

  // Compliance tracking
  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING_VERIFICATION,
  })
  complianceStatus: ComplianceStatus;

  @Column('json', { name: 'required_certifications' })
  requiredCertifications: string[]; // Array of certification pathway IDs

  @Column('json', { name: 'completed_certifications', nullable: true })
  completedCertifications: string[];

  @Column({ name: 'compliance_deadline', nullable: true })
  complianceDeadline: Date;

  @Column({ name: 'grace_period_end', nullable: true })
  gracePeriodEnd: Date;

  @Column({ name: 'exemption_reason', nullable: true })
  exemptionReason: string;

  @Column({ name: 'last_compliance_check', nullable: true })
  lastComplianceCheck: Date;

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

  @OneToMany(() => ComplianceAlert, (alert) => alert.position)
  alerts: ComplianceAlert[];
}

@Entity('compliance_alerts')
export class ComplianceAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'position_id' })
  positionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['deadline_approaching', 'deadline_passed', 'grace_period_ending', 'non_compliant'],
  })
  alertType: string;

  @Column()
  message: string;

  @Column()
  severity: string; // 'info', 'warning', 'critical'

  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'is_resolved', default: false })
  isResolved: boolean;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => OfficialPosition, (position) => position.alerts)
  @JoinColumn({ name: 'position_id' })
  position: OfficialPosition;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

