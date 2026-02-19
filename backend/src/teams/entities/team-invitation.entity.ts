import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum InvitationRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

@Entity('team_invitations')
@Unique(['teamId', 'email'])
export class TeamInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255, nullable: true })
  firstName: string;

  @Column({ length: 255, nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Column({ type: 'enum', enum: InvitationRole, default: InvitationRole.MEMBER })
  role: InvitationRole;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'json', nullable: true })
  permissions: {
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canViewReports: boolean;
    canManageLicenses: boolean;
  };

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ length: 255, nullable: true })
  inviteToken: string;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderSentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Team, team => team.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => User, user => user.sentInvitations, { nullable: true })
  @JoinColumn({ name: 'invited_by' })
  invitedBy: User;

  @Column({ name: 'invited_by', nullable: true })
  invitedById: string;

  @ManyToOne(() => User, user => user.receivedInvitations, { nullable: true })
  @JoinColumn({ name: 'accepted_by' })
  acceptedBy: User;

  @Column({ name: 'accepted_by', nullable: true })
  acceptedById: string;
}
