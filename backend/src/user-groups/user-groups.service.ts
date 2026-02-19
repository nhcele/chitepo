import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { UserGroup, GroupPrivacy, GroupStatus } from './entities/user-group.entity';
import { GroupMember, GroupMemberRole, GroupMemberStatus } from './entities/group-member.entity';
import { GroupDiscussion, DiscussionStatus } from './entities/group-discussion.entity';
import { DiscussionReply } from './entities/group-discussion.entity';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JoinGroupDto, ApproveJoinRequestDto } from './dto/join-group.dto';
import { CreateDiscussionDto, CreateReplyDto } from './dto/create-discussion.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEventType } from '@mindelta/shared';

@Injectable()
export class UserGroupsService {
  constructor(
    @InjectRepository(UserGroup)
    private groupRepository: Repository<UserGroup>,
    @InjectRepository(GroupMember)
    private memberRepository: Repository<GroupMember>,
    @InjectRepository(GroupDiscussion)
    private discussionRepository: Repository<GroupDiscussion>,
    @InjectRepository(DiscussionReply)
    private replyRepository: Repository<DiscussionReply>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // Group Management
  async createGroup(createGroupDto: CreateGroupDto, creatorId: string): Promise<UserGroup> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Validate parent group if specified
    if (createGroupDto.parentGroupId) {
      const parentGroup = await this.groupRepository.findOne({
        where: { id: createGroupDto.parentGroupId },
      });
      if (!parentGroup) {
        throw new NotFoundException('Parent group not found');
      }
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      creatorId,
      status: GroupStatus.ACTIVE,
      settings: {
        allowDiscussions: true,
        allowFileSharing: true,
        moderationEnabled: false,
        notificationsEnabled: true,
      },
    });

    const savedGroup = await this.groupRepository.save(group);

    // Add creator as group leader
    const leaderMember = this.memberRepository.create({
      groupId: savedGroup.id,
      userId: creatorId,
      role: GroupMemberRole.LEADER,
      status: GroupMemberStatus.ACTIVE,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      contributions: {
        discussionsStarted: 0,
        commentsPosted: 0,
        resourcesShared: 0,
        meetingsAttended: 0,
      },
    });

    await this.memberRepository.save(leaderMember);
    await this.groupRepository.update(savedGroup.id, { memberCount: 1 });

    return savedGroup;
  }

  async getGroup(groupId: string, userId?: string): Promise<UserGroup> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['creator', 'members', 'members.user', 'parentGroup', 'subGroups'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check privacy permissions
    if (group.privacy === GroupPrivacy.SECRET && userId) {
      const isMember = await this.memberRepository.findOne({
        where: { groupId, userId, status: GroupMemberStatus.ACTIVE },
      });
      if (!isMember) {
        throw new ForbiddenException('Access denied to this group');
      }
    }

    return group;
  }

  async updateGroup(groupId: string, updateGroupDto: UpdateGroupDto, userId: string): Promise<UserGroup> {
    const group = await this.getGroup(groupId, userId);
    const member = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    // Check if user has permission to update group
    if (member.role !== GroupMemberRole.LEADER && member.role !== GroupMemberRole.MODERATOR) {
      throw new ForbiddenException('Insufficient permissions to update group');
    }

    await this.groupRepository.update(groupId, updateGroupDto);
    return this.getGroup(groupId, userId);
  }

  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId, userId);
    const member = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (member.role !== GroupMemberRole.LEADER) {
      throw new ForbiddenException('Only group leaders can delete groups');
    }

    await this.groupRepository.softDelete(groupId);
  }

  async searchGroups(query: string, userId?: string): Promise<UserGroup[]> {
    const whereConditions: any = [
      { name: Like(`%${query}%`), privacy: GroupPrivacy.PUBLIC, status: GroupStatus.ACTIVE },
      { description: Like(`%${query}%`), privacy: GroupPrivacy.PUBLIC, status: GroupStatus.ACTIVE },
    ];

    // If user is authenticated, also show private groups
    if (userId) {
      whereConditions.push(
        { name: Like(`%${query}%`), privacy: GroupPrivacy.PRIVATE, status: GroupStatus.ACTIVE },
        { description: Like(`%${query}%`), privacy: GroupPrivacy.PRIVATE, status: GroupStatus.ACTIVE }
      );
    }

    const groups = await this.groupRepository.find({
      where: whereConditions,
      relations: ['creator'],
      take: 20,
    });

    return groups;
  }

  async getUserGroups(userId: string): Promise<UserGroup[]> {
    const memberships = await this.memberRepository.find({
      where: { userId, status: GroupMemberStatus.ACTIVE },
      relations: ['group', 'group.creator'],
    });

    return memberships.map((membership) => membership.group);
  }

  async getGroupsByType(type: string, userId?: string): Promise<UserGroup[]> {
    const whereCondition: any = {
      type,
      status: GroupStatus.ACTIVE,
    };

    // Only show public groups to unauthenticated users
    if (!userId) {
      whereCondition.privacy = GroupPrivacy.PUBLIC;
    }

    return this.groupRepository.find({
      where: whereCondition,
      relations: ['creator'],
      take: 50,
    });
  }

  // Member Management
  async joinGroup(joinGroupDto: JoinGroupDto, userId: string): Promise<GroupMember> {
    const { groupId, joinReason } = joinGroupDto;
    const group = await this.getGroup(groupId, userId);

    // Check if user is already a member
    const existingMember = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (existingMember && existingMember.status === GroupMemberStatus.ACTIVE) {
      throw new ConflictException('You are already a member of this group');
    }

    // Check if group is full
    if (group.maxMembers && group.memberCount >= group.maxMembers) {
      throw new BadRequestException('Group is full');
    }

    // Check if group allows join requests
    if (!group.allowJoinRequests && group.privacy !== GroupPrivacy.PUBLIC) {
      throw new ForbiddenException('This group does not allow join requests');
    }

    const member = this.memberRepository.create({
      groupId,
      userId,
      role: GroupMemberRole.MEMBER,
      status: group.requireApproval ? GroupMemberStatus.PENDING : GroupMemberStatus.ACTIVE,
      joinedAt: group.requireApproval ? null : new Date(),
      lastActiveAt: new Date(),
      joinReason,
      contributions: {
        discussionsStarted: 0,
        commentsPosted: 0,
        resourcesShared: 0,
        meetingsAttended: 0,
      },
    });

    const savedMember = await this.memberRepository.save(member);

    // Update member count if auto-approved
    if (!group.requireApproval) {
      await this.groupRepository.increment({ id: groupId }, 'memberCount', 1);
    }

    return savedMember;
  }

  async approveJoinRequest(approveDto: ApproveJoinRequestDto, approverId: string): Promise<GroupMember> {
    const { membershipId, groupId } = approveDto;

    // Check if approver has permission
    const approver = await this.memberRepository.findOne({
      where: { groupId, userId: approverId },
    });

    if (!approver || (approver.role !== GroupMemberRole.LEADER && approver.role !== GroupMemberRole.MODERATOR)) {
      throw new ForbiddenException('Insufficient permissions to approve members');
    }

    const member = await this.memberRepository.findOne({
      where: { id: membershipId, groupId, status: GroupMemberStatus.PENDING },
    });

    if (!member) {
      throw new NotFoundException('Join request not found');
    }

    await this.memberRepository.update(member.id, {
      status: GroupMemberStatus.ACTIVE,
      joinedAt: new Date(),
      approvedById: approverId,
      approvedAt: new Date(),
    });

    await this.groupRepository.increment({ id: groupId }, 'memberCount', 1);

    return this.memberRepository.findOne({ where: { id: member.id }, relations: ['user'] });
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId, status: GroupMemberStatus.ACTIVE },
    });

    if (!member) {
      throw new NotFoundException('Membership not found');
    }

    // Leader can't leave if there are other active members
    if (member.role === GroupMemberRole.LEADER) {
      const otherMembers = await this.memberRepository.count({
        where: { groupId, status: GroupMemberStatus.ACTIVE, userId: In([userId]) },
      });

      if (otherMembers > 1) {
        throw new BadRequestException('Leader must transfer leadership before leaving');
      }
    }

    await this.memberRepository.update(member.id, { status: GroupMemberStatus.INACTIVE });
    await this.groupRepository.decrement({ id: groupId }, 'memberCount', 1);
  }

  async removeMember(groupId: string, memberUserId: string, removerId: string): Promise<void> {
    const remover = await this.memberRepository.findOne({
      where: { groupId, userId: removerId },
    });

    const memberToRemove = await this.memberRepository.findOne({
      where: { groupId, userId: memberUserId, status: GroupMemberStatus.ACTIVE },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    // Check permissions
    if (memberToRemove.role === GroupMemberRole.LEADER) {
      throw new ForbiddenException('Cannot remove group leader');
    }

    if (remover.role !== GroupMemberRole.LEADER && remover.role !== GroupMemberRole.MODERATOR) {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    await this.memberRepository.update(memberToRemove.id, { status: GroupMemberStatus.REMOVED });
    await this.groupRepository.decrement({ id: groupId }, 'memberCount', 1);
  }

  async updateMemberRole(groupId: string, memberUserId: string, newRole: GroupMemberRole, updaterId: string): Promise<GroupMember> {
    const updater = await this.memberRepository.findOne({
      where: { groupId, userId: updaterId },
    });

    const memberToUpdate = await this.memberRepository.findOne({
      where: { groupId, userId: memberUserId },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Member not found');
    }

    // Only leader can update roles
    if (updater.role !== GroupMemberRole.LEADER) {
      throw new ForbiddenException('Only group leaders can update member roles');
    }

    // Cannot change leader role
    if (memberToUpdate.role === GroupMemberRole.LEADER) {
      throw new ForbiddenException('Cannot change leader role directly');
    }

    await this.memberRepository.update(memberToUpdate.id, { role: newRole });
    return this.memberRepository.findOne({ where: { id: memberToUpdate.id }, relations: ['user'] });
  }

  async getGroupMembers(groupId: string, userId: string): Promise<GroupMember[]> {
    await this.getGroup(groupId, userId); // Verify access

    return this.memberRepository.find({
      where: { groupId, status: GroupMemberStatus.ACTIVE },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async getPendingJoinRequests(groupId: string, userId: string): Promise<GroupMember[]> {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (!member || (member.role !== GroupMemberRole.LEADER && member.role !== GroupMemberRole.MODERATOR)) {
      throw new ForbiddenException('Insufficient permissions to view join requests');
    }

    return this.memberRepository.find({
      where: { groupId, status: GroupMemberStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  // Discussion Management
  async createDiscussion(groupId: string, createDiscussionDto: CreateDiscussionDto, authorId: string): Promise<GroupDiscussion> {
    const group = await this.getGroup(groupId, authorId);

    // Check if user is a member
    const member = await this.memberRepository.findOne({
      where: { groupId, userId: authorId, status: GroupMemberStatus.ACTIVE },
    });

    if (!member) {
      throw new ForbiddenException('Only group members can create discussions');
    }

    if (!group.settings?.allowDiscussions) {
      throw new ForbiddenException('Discussions are disabled for this group');
    }

    const discussion = this.discussionRepository.create({
      ...createDiscussionDto,
      groupId,
      authorId,
      status: DiscussionStatus.ACTIVE,
    });

    const savedDiscussion = await this.discussionRepository.save(discussion);

    // Update member contributions
    await this.memberRepository.increment(
      { groupId, userId: authorId },
      'contributions.discussionsStarted',
      1
    );

    const courseId = this.extractSingleCourseId(group.focusAreas);
    try {
      await this.analyticsService.trackEvent({
        eventType: AnalyticsEventType.DISCUSSION_POSTED,
        userId: authorId,
        courseId,
        sessionId: 'server',
        metadata: {
          groupId,
          discussionId: savedDiscussion.id,
          focusAreas: group.focusAreas || null,
          isReply: false,
        },
      });
    } catch {}

    return savedDiscussion;
  }

  async getGroupDiscussions(groupId: string, userId: string): Promise<GroupDiscussion[]> {
    await this.getGroup(groupId, userId); // Verify access

    return this.discussionRepository.find({
      where: { groupId, status: In([DiscussionStatus.ACTIVE, DiscussionStatus.PINNED]) },
      relations: ['author'],
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async getDiscussion(discussionId: string, userId: string): Promise<GroupDiscussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id: discussionId },
      relations: ['author', 'group', 'replies', 'replies.author'],
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Verify user has access to the group
    await this.getGroup(discussion.groupId, userId);

    // Increment view count
    await this.discussionRepository.increment({ id: discussionId }, 'viewCount', 1);

    const courseId = this.extractSingleCourseId(discussion.group?.focusAreas);
    try {
      await this.analyticsService.trackEvent({
        eventType: AnalyticsEventType.DISCUSSION_VIEWED,
        userId,
        courseId,
        sessionId: 'server',
        metadata: {
          groupId: discussion.groupId,
          discussionId: discussion.id,
          focusAreas: discussion.group?.focusAreas || null,
          viewCount: (discussion.viewCount || 0) + 1,
        },
      });
    } catch {}

    return discussion;
  }

  async createReply(discussionId: string, createReplyDto: CreateReplyDto, authorId: string): Promise<DiscussionReply> {
    const discussion = await this.discussionRepository.findOne({
      where: { id: discussionId },
      relations: ['group'],
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Check if user is a member
    const member = await this.memberRepository.findOne({
      where: { groupId: discussion.groupId, userId: authorId, status: GroupMemberStatus.ACTIVE },
    });

    if (!member) {
      throw new ForbiddenException('Only group members can reply to discussions');
    }

    const reply = this.replyRepository.create({
      ...createReplyDto,
      discussionId,
      authorId,
    });

    const savedReply = await this.replyRepository.save(reply);

    // Update discussion reply count
    await this.discussionRepository.increment({ id: discussionId }, 'replyCount', 1);

    // Update member contributions
    await this.memberRepository.increment(
      { groupId: discussion.groupId, userId: authorId },
      'contributions.commentsPosted',
      1
    );

    const courseId = this.extractSingleCourseId(discussion.group?.focusAreas);
    try {
      await this.analyticsService.trackEvent({
        eventType: AnalyticsEventType.DISCUSSION_POSTED,
        userId: authorId,
        courseId,
        sessionId: 'server',
        metadata: {
          groupId: discussion.groupId,
          discussionId,
          replyId: savedReply.id,
          focusAreas: discussion.group?.focusAreas || null,
          isReply: true,
        },
      });
    } catch {}

    return savedReply;
  }

  // Analytics
  async getGroupAnalytics(groupId: string, userId: string): Promise<any> {
    await this.getGroup(groupId, userId); // Verify access

    const members = await this.memberRepository.find({
      where: { groupId, status: GroupMemberStatus.ACTIVE },
      relations: ['user'],
    });

    const discussions = await this.discussionRepository.count({
      where: { groupId },
    });

    const totalReplies = await this.replyRepository
      .createQueryBuilder('reply')
      .innerJoin('reply.discussion', 'discussion')
      .where('discussion.groupId = :groupId', { groupId })
      .getCount();

    const activeMembers = members.filter(
      (m) =>
        m.lastActiveAt &&
        m.lastActiveAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      overview: {
        totalMembers: members.length,
        activeMembers,
        totalDiscussions: discussions,
        totalReplies,
      },
      members: members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        joinedAt: member.joinedAt,
        lastActiveAt: member.lastActiveAt,
        contributions: member.contributions,
      })),
    };
  }

  private extractSingleCourseId(focusAreas?: string[] | null): string | undefined {
    if (!focusAreas || focusAreas.length === 0) return undefined;
    const matches = focusAreas.filter((item) => this.isUuid(item));
    if (matches.length === 1) return matches[0];
    return undefined;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
}


