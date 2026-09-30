import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  AfterLoad,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, JobRole, RoleCategory, RoleLevel } from '@mindelta/shared';
import { Course } from '../../courses/entities/course.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { QuizAttempt } from '../../assessments/entities/quiz-attempt.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { AnalyticsEvent } from '../../analytics/entities/analytics-event.entity';
import { Team } from '../../teams/entities/team.entity';
import { TeamMember } from '../../teams/entities/team-member.entity';
import { TeamInvitation } from '../../teams/entities/team-invitation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ name: 'password_history', type: 'json', nullable: true })
  @Exclude()
  passwordHistory: string[];

  @Column({ name: 'last_password_changed_at', type: 'timestamp', nullable: true })
  lastPasswordChangedAt: Date;

  @Column({ name: 'password_expiry_at', type: 'timestamp', nullable: true })
  passwordExpiryAt: Date;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'lockout_until', type: 'timestamp', nullable: true })
  lockoutUntil: Date;

  @Column({ name: 'last_failed_login_at', type: 'timestamp', nullable: true })
  lastFailedLoginAt: Date;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle: string;

  @Column({
    name: 'job_role',
    type: 'enum',
    enum: JobRole,
    nullable: true,
  })
  jobRole: JobRole;

  @Column({
    name: 'role_category',
    type: 'enum',
    enum: RoleCategory,
    nullable: true,
  })
  roleCategory: RoleCategory;

  @Column({
    name: 'role_level',
    type: 'enum',
    enum: RoleLevel,
    nullable: true,
  })
  roleLevel: RoleLevel;

  @Column({ name: 'department', nullable: true })
  department: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @Column({ name: 'hire_date', type: 'timestamp', nullable: true })
  hireDate: Date;

  @Column({ type: 'json', nullable: true, name: 'skill_interests' })
  skillInterests: string[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.LEARNER,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'google_id', nullable: true })
  googleId: string;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken: string;

  @Column({ name: 'password_reset_token', nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires_at', type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed/virtual properties
  name: string;
  avatar: string;

  @AfterLoad()
  setComputedProperties() {
    this.name = `${this.firstName} ${this.lastName}`.trim();
    this.avatar = this.avatarUrl;
  }

  // Relations
  @OneToMany(() => Course, (course) => course.instructor)
  coursesCreated: Course[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments: Enrollment[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.user)
  quizAttempts: QuizAttempt[];

  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates: Certificate[];

  @OneToMany(() => AnalyticsEvent, (event) => event.user)
  analyticsEvents: AnalyticsEvent[];

  // Team Relations
  @OneToMany(() => Team, (team) => team.owner)
  managedTeams: Team[];

  @OneToMany(() => TeamMember, (teamMember) => teamMember.user)
  teamMemberships: TeamMember[];

  @OneToMany(() => TeamInvitation, (invitation) => invitation.invitedBy)
  sentInvitations: TeamInvitation[];

  @OneToMany(() => TeamInvitation, (invitation) => invitation.acceptedBy)
  receivedInvitations: TeamInvitation[];
}
