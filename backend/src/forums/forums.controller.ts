import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ForumsService } from './forums.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForumType, ForumStatus } from './entities/forum.entity';

@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createForum(@Req() req: any, @Body() body: any) {
    return this.forumsService.createForum({
      ...body,
      createdBy: req.user.id,
    });
  }

  @Get()
  async getForums(
    @Query('type') type?: ForumType,
    @Query('cohortId') cohortId?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('status') status?: ForumStatus,
  ) {
    return this.forumsService.getForums({
      type,
      cohortId,
      region,
      country,
      status,
    });
  }

  @Get('cohort/:cohortId')
  async getCohortForum(@Param('cohortId') cohortId: string) {
    return this.forumsService.getOrCreateCohortForum(cohortId, 'system');
  }

  @Get('diaspora')
  async getDiasporaForums(
    @Query('region') region?: string,
    @Query('country') country?: string,
  ) {
    return this.forumsService.getDiasporaForums({ region, country });
  }

  @Get(':id')
  async getForum(@Param('id') id: string) {
    return this.forumsService.getForumById(id);
  }

  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  async createPost(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.forumsService.createPost({
      ...body,
      forumId: id,
      authorId: req.user.id,
    });
  }

  @Get(':id/posts')
  async getPosts(
    @Param('id') id: string,
    @Query('parentId') parentId?: string,
    @Query('authorId') authorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.forumsService.getPosts(id, {
      parentId: parentId === 'null' ? null : parentId,
      authorId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('posts/:postId')
  async getPost(@Param('postId') postId: string, @Req() req: any) {
    return this.forumsService.getPostById(postId, req.user?.id);
  }

  @Patch('posts/:postId')
  @UseGuards(JwtAuthGuard)
  async updatePost(@Param('postId') postId: string, @Req() req: any, @Body() body: any) {
    return this.forumsService.updatePost(postId, req.user.id, body);
  }

  @Delete('posts/:postId')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('postId') postId: string, @Req() req: any) {
    await this.forumsService.deletePost(postId, req.user.id, req.user.role === 'admin');
    return { success: true };
  }

  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('postId') postId: string, @Req() req: any) {
    return this.forumsService.toggleLike(postId, req.user.id);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  async addMember(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.forumsService.addMember(id, body.userId || req.user.id, body.role || 'member');
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    await this.forumsService.removeMember(id, userId);
    return { success: true };
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.forumsService.getMembers(id);
  }
}

