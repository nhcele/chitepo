import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserGroup } from './user-group.entity';

export enum GroupMemberRole {
  LEADER = 'leader', // Group leader (e.g., cell chairman)
  MODERATOR = 'moderator', // Can moderate discussions
  MEMBER = 'member', // Regular member
}

export enum GroupMemberStatus {
  ACTIVE = 'active',
  PENDING = 'pending', // Join request pending
  INACTIVE = 'inactive',
  REMOVED = 'removed',
  BANNED = 'banned',
}

@Entity('group_members')
@Unique(['groupId', 'userId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  @Column({
    type: 'enum',
    enum: GroupMemberStatus,
    default: GroupMemberStatus.ACTIVE,
  })
  status: GroupMemberStatus;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'json', nullable: true })
  contributions: {
    discussionsStarted: number;
    commentsPosted: number;
    resourcesShared: number;
    meetingsAttended: number;
  };

  @Column({ type: 'text', nullable: true })
  joinReason: string; // Why they want to join (for approval)

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserGroup, (group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: UserGroup;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;
}


