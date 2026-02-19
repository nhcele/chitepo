import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JoinGroupDto, ApproveJoinRequestDto } from './dto/join-group.dto';
import { CreateDiscussionDto, CreateReplyDto } from './dto/create-discussion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupMemberRole } from './entities/group-member.entity';

@Controller('user-groups')
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  // Group Management
  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(@Body() createGroupDto: CreateGroupDto, @Request() req) {
    return this.userGroupsService.createGroup(createGroupDto, req.user.userId);
  }

  @Get()
  async searchGroups(@Query('q') query: string, @Request() req) {
    const userId = req.user?.userId;
    return this.userGroupsService.searchGroups(query, userId);
  }

  @Get('my-groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroups(@Request() req) {
    return this.userGroupsService.getUserGroups(req.user.userId);
  }

  @Get('by-type/:type')
  async getGroupsByType(@Param('type') type: string, @Request() req) {
    const userId = req.user?.userId;
    return this.userGroupsService.getGroupsByType(type, userId);
  }

  @Get(':id')
  async getGroup(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId;
    return this.userGroupsService.getGroup(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateGroup(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req,
  ) {
    return this.userGroupsService.updateGroup(id, updateGroupDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(@Param('id') id: string, @Request() req) {
    return this.userGroupsService.deleteGroup(id, req.user.userId);
  }

  // Member Management
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Param('id') id: string, @Body() joinGroupDto: JoinGroupDto, @Request() req) {
    joinGroupDto.groupId = id;
    return this.userGroupsService.joinGroup(joinGroupDto, req.user.userId);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@Param('id') id: string, @Request() req) {
    return this.userGroupsService.leaveGroup(id, req.user.userId);
  }

  @Post(':id/approve-member')
  @UseGuards(JwtAuthGuard)
  async approveJoinRequest(@Param('id') id: string, @Body() approveDto: ApproveJoinRequestDto, @Request() req) {
    approveDto.groupId = id;
    return this.userGroupsService.approveJoinRequest(approveDto, req.user.userId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.userGroupsService.removeMember(id, userId, req.user.userId);
  }

  @Put(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: GroupMemberRole,
    @Request() req,
  ) {
    return this.userGroupsService.updateMemberRole(id, userId, role, req.user.userId);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getGroupMembers(@Param('id') id: string, @Request() req) {
    return this.userGroupsService.getGroupMembers(id, req.user.userId);
  }

  @Get(':id/pending-requests')
  @UseGuards(JwtAuthGuard)
  async getPendingJoinRequests(@Param('id') id: string, @Request() req) {
    return this.userGroupsService.getPendingJoinRequests(id, req.user.userId);
  }

  // Discussion Management
  @Post(':id/discussions')
  @UseGuards(JwtAuthGuard)
  async createDiscussion(
    @Param('id') id: string,
    @Body() createDiscussionDto: CreateDiscussionDto,
    @Request() req,
  ) {
    return this.userGroupsService.createDiscussion(id, createDiscussionDto, req.user.userId);
  }

  @Get(':id/discussions')
  @UseGuards(JwtAuthGuard)
  async getGroupDiscussions(@Param('id') id: string, @Request() req) {
    return this.userGroupsService.getGroupDiscussions(id, req.user.userId);
  }

  @Get('discussions/:discussionId')
  @UseGuards(JwtAuthGuard)
  async getDiscussion(@Param('discussionId') discussionId: string, @Request() req) {
    return this.userGroupsService.getDiscussion(discussionId, req.user.userId);
  }

  @Post('discussions/:discussionId/replies')
  @UseGuards(JwtAuthGuard)
  async createReply(
    @Param('discussionId') discussionId: string,
    @Body() createReplyDto: CreateReplyDto,
    @Request() req,
  ) {
    return this.userGroupsService.createReply(discussionId, createReplyDto, req.user.userId);
  }

  // Analytics
  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  async getGroupAnalytics(@Param('id') id: string, @Request() req) {
    return this.userGroupsService.getGroupAnalytics(id, req.user.userId);
  }
}


