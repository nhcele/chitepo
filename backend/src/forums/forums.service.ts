import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Forum,
  ForumPost,
  ForumMember,
  ForumPostLike,
  ForumType,
  ForumStatus,
} from './entities/forum.entity';
import { TrainingCohort } from '../cohorts/entities/training-cohort.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType } from '@mindelta/shared';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(Forum)
    private forumRepository: Repository<Forum>,
    @InjectRepository(ForumPost)
    private postRepository: Repository<ForumPost>,
    @InjectRepository(ForumMember)
    private memberRepository: Repository<ForumMember>,
    @InjectRepository(ForumPostLike)
    private likeRepository: Repository<ForumPostLike>,
    @InjectRepository(TrainingCohort)
    private cohortRepository: Repository<TrainingCohort>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ========== Forum Management ==========

  async createForum(data: {
    title: string;
    description?: string;
    type: ForumType;
    cohortId?: string;
    region?: string;
    country?: string;
    createdBy: string;
    isPublic?: boolean;
  }): Promise<Forum> {
    // Verify cohort if provided
    if (data.cohortId) {
      const cohort = await this.cohortRepository.findOne({
        where: { id: data.cohortId },
      });
      if (!cohort) {
        throw new NotFoundException('Cohort not found');
      }
    }

    const forum = this.forumRepository.create({
      ...data,
      isPublic: data.isPublic ?? true,
    });

    const savedForum = await this.forumRepository.save(forum);

    // Auto-add creator as admin member
    await this.addMember(savedForum.id, data.createdBy, 'admin');

    return savedForum;
  }

  async getForums(filters?: {
    type?: ForumType;
    cohortId?: string;
    region?: string;
    country?: string;
    status?: ForumStatus;
  }): Promise<Forum[]> {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.cohortId) where.cohortId = filters.cohortId;
    if (filters?.region) where.region = filters.region;
    if (filters?.country) where.country = filters.country;
    if (filters?.status) where.status = filters.status;

    return this.forumRepository.find({
      where,
      relations: ['cohort', 'creator'],
      order: { lastActivityAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async getForumById(forumId: string): Promise<Forum> {
    const forum = await this.forumRepository.findOne({
      where: { id: forumId },
      relations: ['cohort', 'creator', 'members', 'members.user'],
    });

    if (!forum) {
      throw new NotFoundException('Forum not found');
    }

    return forum;
  }

  async getCohortForum(cohortId: string): Promise<Forum | null> {
    return this.forumRepository.findOne({
      where: { cohortId, type: ForumType.COHORT },
      relations: ['cohort', 'creator'],
    });
  }

  async getOrCreateCohortForum(cohortId: string, createdBy: string): Promise<Forum> {
    let forum = await this.getCohortForum(cohortId);

    if (!forum) {
      const cohort = await this.cohortRepository.findOne({
        where: { id: cohortId },
      });

      if (!cohort) {
        throw new NotFoundException('Cohort not found');
      }

      forum = await this.createForum({
        title: `${cohort.name} Discussion Forum`,
        description: `Discussion forum for ${cohort.name} cohort members`,
        type: ForumType.COHORT,
        cohortId,
        createdBy,
        isPublic: false, // Cohort forums are private to members
      });
    }

    return forum;
  }

  async getDiasporaForums(filters?: { region?: string; country?: string }): Promise<Forum[]> {
    return this.getForums({
      type: ForumType.DIASPORA,
      ...filters,
    });
  }

  // ========== Post Management ==========

  async createPost(data: {
    forumId: string;
    authorId: string;
    title: string;
    content: string;
    parentId?: string;
    tags?: string[];
  }): Promise<ForumPost> {
    const forum = await this.getForumById(data.forumId);

    // Check if user is member (for private forums)
    if (!forum.isPublic) {
      const member = await this.memberRepository.findOne({
        where: { forumId: data.forumId, userId: data.authorId },
      });
      if (!member) {
        throw new HttpException('You must be a member to post', HttpStatus.FORBIDDEN);
      }
    }

    const post = this.postRepository.create({
      ...data,
      parentId: data.parentId || null,
    });

    const savedPost = await this.postRepository.save(post);

    // Update forum stats
    await this.updateForumStats(data.forumId);

    // If reply, update parent post reply count
    if (data.parentId) {
      await this.postRepository.increment({ id: data.parentId }, 'replyCount', 1);
    }

    // Analytics tracking
    const cohortCourseIds = Array.isArray(forum.cohort?.courseIds) ? forum.cohort?.courseIds || [] : [];
    const courseId = cohortCourseIds.length === 1 ? cohortCourseIds[0] : undefined;

    try {
      await this.analyticsService.trackEvent({
        eventType: AnalyticsEventType.DISCUSSION_POSTED,
        userId: data.authorId,
        courseId,
        sessionId: 'server',
        metadata: {
          forumId: forum.id,
          postId: savedPost.id,
          parentId: data.parentId || null,
          forumType: forum.type,
          cohortId: forum.cohortId || null,
          cohortCourseIds: cohortCourseIds.length > 0 ? cohortCourseIds : null,
          isReply: !!data.parentId,
        },
      });
    } catch {}

    return savedPost;
  }

  async getPosts(forumId: string, filters?: {
    parentId?: string | null;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ForumPost[]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.forumId = :forumId', { forumId })
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.likes', 'likes')
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.createdAt', 'DESC');

    if (filters?.parentId !== undefined) {
      query.andWhere('post.parentId = :parentId', { parentId: filters.parentId });
    } else {
      query.andWhere('post.parentId IS NULL'); // Top-level posts only
    }

    if (filters?.authorId) {
      query.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return query.getMany();
  }

  async getPostById(postId: string, viewerId?: string | null): Promise<ForumPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'forum', 'forum.cohort', 'parent', 'replies', 'replies.author', 'likes', 'likes.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.postRepository.increment({ id: postId }, 'viewCount', 1);

    const cohortCourseIds = Array.isArray(post.forum?.cohort?.courseIds) ? post.forum?.cohort?.courseIds || [] : [];
    const courseId = cohortCourseIds.length === 1 ? cohortCourseIds[0] : undefined;
    try {
      await this.analyticsService.trackEvent({
        eventType: AnalyticsEventType.DISCUSSION_VIEWED,
        userId: viewerId || undefined,
        courseId,
        sessionId: 'server',
        metadata: {
          forumId: post.forumId,
          postId: post.id,
          forumType: post.forum?.type,
          cohortId: post.forum?.cohortId || null,
          cohortCourseIds: cohortCourseIds.length > 0 ? cohortCourseIds : null,
          viewCount: (post.viewCount || 0) + 1,
        },
      });
    } catch {}

    return post;
  }

  async updatePost(postId: string, authorId: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
  }): Promise<ForumPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new HttpException('You can only edit your own posts', HttpStatus.FORBIDDEN);
    }

    Object.assign(post, data);
    return this.postRepository.save(post);
  }

  async deletePost(postId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['forum'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check permissions
    if (!isAdmin && post.authorId !== userId) {
      throw new HttpException('You can only delete your own posts', HttpStatus.FORBIDDEN);
    }

    await this.postRepository.remove(post);
    await this.updateForumStats(post.forumId);
  }

  // ========== Member Management ==========

  async addMember(forumId: string, userId: string, role: string = 'member'): Promise<ForumMember> {
    const existing = await this.memberRepository.findOne({
      where: { forumId, userId },
    });

    if (existing) {
      return existing;
    }

    const member = this.memberRepository.create({
      forumId,
      userId,
      role,
      joinedAt: new Date(),
    });

    const saved = await this.memberRepository.save(member);

    // Update forum member count
    await this.forumRepository.increment({ id: forumId }, 'memberCount', 1);

    return saved;
  }

  async removeMember(forumId: string, userId: string): Promise<void> {
    await this.memberRepository.delete({ forumId, userId });
    await this.forumRepository.decrement({ id: forumId }, 'memberCount', 1);
  }

  async getMembers(forumId: string): Promise<ForumMember[]> {
    return this.memberRepository.find({
      where: { forumId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  // ========== Like Management ==========

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['forum', 'forum.cohort'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (existing) {
      await this.likeRepository.remove(existing);
      await this.postRepository.decrement({ id: postId }, 'likeCount', 1);
      post.likeCount = Math.max(0, (post.likeCount || 0) - 1);
      const cohortCourseIds = Array.isArray(post.forum?.cohort?.courseIds) ? post.forum?.cohort?.courseIds || [] : [];
      const courseId = cohortCourseIds.length === 1 ? cohortCourseIds[0] : undefined;
      try {
        await this.analyticsService.trackEvent({
          eventType: AnalyticsEventType.DISCUSSION_LIKED,
          userId,
          courseId,
          sessionId: 'server',
          metadata: {
            forumId: post.forumId,
            postId: post.id,
            liked: false,
            likeCount: post.likeCount,
            forumType: post.forum?.type,
            cohortId: post.forum?.cohortId || null,
            cohortCourseIds: cohortCourseIds.length > 0 ? cohortCourseIds : null,
          },
        });
      } catch {}
      return { liked: false, likeCount: post.likeCount || 0 };
    } else {
      const like = this.likeRepository.create({ postId, userId });
      await this.likeRepository.save(like);
      await this.postRepository.increment({ id: postId }, 'likeCount', 1);
      post.likeCount = (post.likeCount || 0) + 1;
      const cohortCourseIds = Array.isArray(post.forum?.cohort?.courseIds) ? post.forum?.cohort?.courseIds || [] : [];
      const courseId = cohortCourseIds.length === 1 ? cohortCourseIds[0] : undefined;
      try {
        await this.analyticsService.trackEvent({
          eventType: AnalyticsEventType.DISCUSSION_LIKED,
          userId,
          courseId,
          sessionId: 'server',
          metadata: {
            forumId: post.forumId,
            postId: post.id,
            liked: true,
            likeCount: post.likeCount,
            forumType: post.forum?.type,
            cohortId: post.forum?.cohortId || null,
            cohortCourseIds: cohortCourseIds.length > 0 ? cohortCourseIds : null,
          },
        });
      } catch {}
      return { liked: true, likeCount: post.likeCount || 0 };
    }
  }

  // ========== Helper Methods ==========

  private async updateForumStats(forumId: string): Promise<void> {
    const postCount = await this.postRepository.count({
      where: { forumId, parentId: null },
    });

    const lastPost = await this.postRepository.findOne({
      where: { forumId },
      order: { createdAt: 'DESC' },
    });

    await this.forumRepository.update(forumId, {
      postCount: postCount,
      lastActivityAt: lastPost?.createdAt || new Date(),
    });
  }
}

