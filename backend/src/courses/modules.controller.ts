import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { UserRole } from '@mindelta/shared';

@Controller('modules')
export class ModulesController {
  constructor(private readonly coursesService: CoursesService) {}

  private requireInstructorOrAdmin(role?: string): void {
    if (!role || ![UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role as UserRole)) {
      throw new ForbiddenException('Only instructors and admins can manage modules');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query('search') search?: string, @Query('author_id') authorId?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '20', @Req() req?: any) {
    const limit = parseInt(pageSize as any, 10) || 20;
    const offset = ((parseInt(page as any, 10) || 1) - 1) * limit;
    const requesterId = req?.user?.id;
    return this.coursesService.listModules({ search, authorId, limit, offset, requesterId });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    this.requireInstructorOrAdmin(req.user?.role);
    return this.coursesService.createModule({ ...body, authorId: body.authorId || req.user?.id });
  }

  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard)
  async createLesson(@Param('id') moduleId: string, @Body() body: any, @Req() req: any) {
    await this.coursesService.assertCanManageModule(req.user?.id, req.user?.role, moduleId);
    return this.coursesService.createLesson(moduleId, body);
  }

  @Patch('/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  async updateLesson(@Param('lessonId') lessonId: string, @Body() body: any, @Req() req: any) {
    await this.coursesService.assertCanManageLesson(req.user?.id, req.user?.role, lessonId);
    return this.coursesService.updateLesson(lessonId, body);
  }

  @Post(':id/snapshot')
  @UseGuards(JwtAuthGuard)
  async snapshot(@Param('id') moduleId: string, @Req() req?: any) {
    await this.coursesService.assertCanManageModule(req.user?.id, req.user?.role, moduleId);
    const requesterId = req?.user?.id;
    return this.coursesService.snapshotModule(moduleId, requesterId);
  }
}
