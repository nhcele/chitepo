import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VectorStoreService } from './vector-store.service';
import { Request } from 'express';

@Controller('vector-store')
@UseGuards(JwtAuthGuard)
export class VectorStoreController {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  @Post('initialize')
  async initializeIndex() {
    await this.vectorStoreService.initializeIndex();
    return { message: 'Vector store initialized successfully' };
  }

  @Put('index/lesson/:lessonId')
  async indexLesson(@Req() req: Request, @Param('lessonId') lessonId: string) {
    await this.vectorStoreService.indexLesson(lessonId);
    return { message: 'Lesson indexed successfully' };
  }

  @Put('index/course/:courseId')
  async indexCourse(@Req() req: Request, @Param('courseId') courseId: string) {
    await this.vectorStoreService.indexCourse(courseId);
    return { message: 'Course indexed successfully' };
  }

  @Get('search')
  async searchContent(
    @Query('query') query: string,
    @Query('type') type?: 'lesson' | 'course',
    @Query('difficulty') difficulty?: string,
    @Query('courseId') courseId?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (difficulty) filters.difficulty = difficulty;
    if (courseId) filters.courseId = courseId;
    if (tags) filters.tags = tags.split(',');

    const results = await this.vectorStoreService.searchContent(
      query,
      filters,
      limit ? parseInt(limit) : 10
    );
    return { results };
  }

  @Get('similar/:contentId/:contentType')
  async findSimilarContent(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: 'lesson' | 'course',
    @Query('limit') limit?: string
  ) {
    const results = await this.vectorStoreService.findSimilarContent(
      contentId,
      contentType,
      limit ? parseInt(limit) : 5
    );
    return { results };
  }

  @Get('recommendations')
  async getRecommendations(
    @Req() req: Request,
    @Query('completedCourses') completedCourses?: string,
    @Query('interests') interests?: string
  ) {
    const userId = (req as any).user?.id;
    const completed = completedCourses ? completedCourses.split(',') : [];
    const userInterests = interests ? interests.split(',') : [];
    
    const recommendations = await this.vectorStoreService.recommendCourses(
      userId,
      completed,
      userInterests
    );
    return { recommendations };
  }

  @Delete(':contentId/:contentType')
  async deleteFromIndex(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: 'lesson' | 'course'
  ) {
    await this.vectorStoreService.deleteFromIndex(contentId, contentType);
    return { message: 'Content deleted from index successfully' };
  }

  @Get('stats')
  async getIndexStats() {
    await this.vectorStoreService.getIndexPath();
    return { message: 'Index stats logged to console' };
  }
}
