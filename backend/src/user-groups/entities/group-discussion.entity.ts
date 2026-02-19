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
import { UserGroup } from './user-group.entity';

export enum DiscussionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PINNED = 'pinned',
  ARCHIVED = 'archived',
}

@Entity('group_discussions')
export class GroupDiscussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ length: 500 })
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: DiscussionStatus,
    default: DiscussionStatus.ACTIVE,
  })
  status: DiscussionStatus;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  replyCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ default: false })
  isPinned: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: UserGroup;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => DiscussionReply, (reply) => reply.discussion)
  replies: DiscussionReply[];
}

@Entity('discussion_replies')
export class DiscussionReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'discussion_id' })
  discussionId: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column('text')
  content: string;

  @Column({ name: 'parent_reply_id', nullable: true })
  parentReplyId: string;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => GroupDiscussion, (discussion) => discussion.replies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discussion_id' })
  discussion: GroupDiscussion;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => DiscussionReply, (reply) => reply.childReplies)
  @JoinColumn({ name: 'parent_reply_id' })
  parentReply: DiscussionReply;

  @OneToMany(() => DiscussionReply, (reply) => reply.parentReply)
  childReplies: DiscussionReply[];
}


