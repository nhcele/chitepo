import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TeamMember } from './team-member.entity';
import { TeamLicense } from './team-license.entity';
import { TeamInvitation } from './team-invitation.entity';

export enum TeamSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}

export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  industry: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ length: 500, nullable: true })
  logo: string;

  @Column({ type: 'enum', enum: TeamSize, default: TeamSize.SMALL })
  size: TeamSize;

  @Column({ type: 'enum', enum: TeamStatus, default: TeamStatus.ACTIVE })
  status: TeamStatus;

  @Column({ type: 'int', default: 0 })
  memberCount: number;

  @Column({ type: 'int', default: 0 })
  licenseCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'json', nullable: true })
  settings: {
    allowSelfEnrollment: boolean;
    requireApproval: boolean;
    defaultLearningPath: string;
    customBranding: boolean;
    reportingFrequency: 'weekly' | 'monthly' | 'quarterly';
  };

  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.managedTeams)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @OneToMany(() => TeamMember, member => member.team)
  members: TeamMember[];

  @OneToMany(() => TeamLicense, license => license.team)
  licenses: TeamLicense[];

  @OneToMany(() => TeamInvitation, invitation => invitation.team)
  invitations: TeamInvitation[];
}
