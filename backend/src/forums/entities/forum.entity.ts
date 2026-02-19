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
import { TrainingCohort } from '../../cohorts/entities/training-cohort.entity';

export enum ForumType {
  COHORT = 'cohort',
  DIASPORA = 'diaspora',
  GENERAL = 'general',
}

export enum ForumStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  LOCKED = 'locked',
}

@Entity('forums')
export class Forum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ForumType,
    default: ForumType.GENERAL,
  })
  type: ForumType;

  @Column({
    type: 'enum',
    enum: ForumStatus,
    default: ForumStatus.ACTIVE,
  })
  status: ForumStatus;

  @Column({ name: 'cohort_id', nullable: true })
  cohortId: string | null;

  @Column({ name: 'region', nullable: true })
  region: string | null; // For diaspora forums: 'south_africa', 'uk', 'usa', etc.

  @Column({ name: 'country', nullable: true })
  country: string | null; // For diaspora forums

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'member_count', default: 0 })
  memberCount: number;

  @Column({ name: 'post_count', default: 0 })
  postCount: number;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => TrainingCohort, { nullable: true })
  @JoinColumn({ name: 'cohort_id' })
  cohort: TrainingCohort;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => ForumPost, (post) => post.forum)
  posts: ForumPost[];

  @OneToMany(() => ForumMember, (member) => member.forum)
  members: ForumMember[];
}

@Entity('forum_posts')
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'forum_id' })
  forumId: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null; // For replies

  @Column({ name: 'author_id' })
  authorId: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'reply_count', default: 0 })
  replyCount: number;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column('json', { nullable: true })
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Forum, (forum) => forum.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'forum_id' })
  forum: Forum;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => ForumPost, (post) => post.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ForumPost | null;

  @OneToMany(() => ForumPost, (post) => post.parent)
  replies: ForumPost[];

  @OneToMany(() => ForumPostLike, (like) => like.post)
  likes: ForumPostLike[];
}

@Entity('forum_members')
export class ForumMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'forum_id' })
  forumId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['member', 'moderator', 'admin'],
    default: 'member',
  })
  role: string;

  @Column({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'last_read_at', nullable: true })
  lastReadAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Forum, (forum) => forum.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'forum_id' })
  forum: Forum;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

@Entity('forum_post_likes')
export class ForumPostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ForumPost, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: ForumPost;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

