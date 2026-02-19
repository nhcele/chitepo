import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('modules')
export class ModulesController {
  constructor(private readonly coursesService: CoursesService) {}

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
  async create(@Body() body: any) {
    return this.coursesService.createModule(body);
  }

  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard)
  async createLesson(@Param('id') moduleId: string, @Body() body: any) {
    return this.coursesService.createLesson(moduleId, body);
  }

  @Patch('/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  async updateLesson(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.updateLesson(lessonId, body);
  }

  @Post(':id/snapshot')
  @UseGuards(JwtAuthGuard)
  async snapshot(@Param('id') moduleId: string, @Req() req?: any) {
    const requesterId = req?.user?.id;
    return this.coursesService.snapshotModule(moduleId, requesterId);
  }
}
