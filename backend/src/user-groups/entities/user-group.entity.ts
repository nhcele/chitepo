import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from './group-member.entity';

export enum GroupType {
  STUDY_GROUP = 'study_group',
  DISCUSSION_GROUP = 'discussion_group',
  PARTY_CELL = 'party_cell', // For political structure (ZANU PF cells, etc.)
  BRANCH = 'branch', // District/Provincial branches
  LEARNING_CIRCLE = 'learning_circle',
  IDEOLOGY_GROUP = 'ideology_group',
}

export enum GroupPrivacy {
  PUBLIC = 'public', // Anyone can see and join
  PRIVATE = 'private', // Anyone can see, must request to join
  SECRET = 'secret', // Invitation only, not visible in search
}

export enum GroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

@Entity('user_groups')
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GroupType, default: GroupType.STUDY_GROUP })
  type: GroupType;

  @Column({
    type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.PUBLIC,
  })
  privacy: GroupPrivacy;

  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.ACTIVE })
  status: GroupStatus;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  memberCount: number;

  @Column({ type: 'int', nullable: true })
  maxMembers: number; // null = unlimited

  @Column({ default: true })
  allowJoinRequests: boolean;

  @Column({ default: false })
  requireApproval: boolean;

  @Column({ type: 'json', nullable: true })
  meetingSchedule: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: string;
    time?: string;
    location?: string;
    virtual?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  focusAreas: string[]; // Course IDs or topics of interest

  @Column({ type: 'json', nullable: true })
  settings: {
    allowDiscussions: boolean;
    allowFileSharing: boolean;
    moderationEnabled: boolean;
    notificationsEnabled: boolean;
  };

  // For hierarchical structures (party cells, branches)
  @Column({ name: 'parent_group_id', nullable: true })
  parentGroupId: string;

  @ManyToOne(() => UserGroup, (group) => group.subGroups)
  @JoinColumn({ name: 'parent_group_id' })
  parentGroup: UserGroup;

  @OneToMany(() => UserGroup, (group) => group.parentGroup)
  subGroups: UserGroup[];

  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


