import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from '@mindelta/shared';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.coursesService.search(query);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.coursesService.findByCategory(category);
  }

  @Get('instructor/:instructorId')
  @UseGuards(JwtAuthGuard)
  findByInstructor(@Param('instructorId') instructorId: string) {
    return this.coursesService.findByInstructor(instructorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.coursesService.findOne(id);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching course:', error);
      throw new HttpException(
        error?.message || 'Failed to fetch course',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: any,
  ) {
    await this.coursesService.assertCanManageCourse(req.user?.id, req.user?.role, id);
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.coursesService.assertCanManageCourse(req.user?.id, req.user?.role, id);
    return this.coursesService.remove(id);
  }

  // ---------- AI outline ----------
  @Post('ai-generate')
  @UseGuards(JwtAuthGuard)
  aiGenerate(@Body('prompt') prompt: string) {
    return this.coursesService.aiGenerateOutline(prompt || '');
  }

  // ---------- Course <-> Module linking ----------
  @Post(':id/modules')
  @UseGuards(JwtAuthGuard)
  async linkModule(
    @Param('id') courseId: string,
    @Body() body: { module_id: string; sort_order: number; is_required?: boolean },
    @Req() req: any,
  ) {
    await this.coursesService.assertCanManageCourse(req.user?.id, req.user?.role, courseId);
    return this.coursesService.linkModuleToCourse(courseId, body.module_id, body.sort_order, body.is_required ?? true, req.user?.id);
  }

  @Patch(':id/modules/:mid')
  @UseGuards(JwtAuthGuard)
  async updateLink(
    @Param('id') courseId: string,
    @Param('mid') moduleId: string,
    @Body() body: { sort_order?: number; is_required?: boolean },
    @Req() req: any,
  ) {
    await this.coursesService.assertCanManageCourse(req.user?.id, req.user?.role, courseId);
    return this.coursesService.updateCourseModule(courseId, moduleId, { sortOrder: body.sort_order, isRequired: body.is_required });
  }

  @Delete(':id/modules/:mid')
  @UseGuards(JwtAuthGuard)
  async unlinkModule(
    @Param('id') courseId: string,
    @Param('mid') moduleId: string,
    @Req() req: any,
  ) {
    await this.coursesService.assertCanManageCourse(req.user?.id, req.user?.role, courseId);
    return this.coursesService.unlinkCourseModule(courseId, moduleId);
  }

  @Post(':id/snapshot-modules')
  @UseGuards(JwtAuthGuard)
  async snapshotCourseModules(@Param('id') courseId: string, @Req() req: any) {
    await this.coursesService.assertCanManageCourse(req.user?.id, req.user?.role, courseId);
    return this.coursesService.snapshotCourseModules(courseId);
  }

  // ---------- Lesson Access Control ----------
  @Get(':courseId/lessons/:lessonId/access')
  @UseGuards(JwtAuthGuard)
  checkLessonAccess(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.coursesService.checkLessonAccess(userId, courseId, lessonId);
  }

  @Post('lessons/:lessonId/progress')
  @UseGuards(JwtAuthGuard)
  updateLessonProgress(
    @Param('lessonId') lessonId: string,
    @Body() body: { watchPercent?: number },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.coursesService.updateLessonProgress(userId, lessonId, body);
  }

  @Get('lessons/:lessonId/progress')
  @UseGuards(JwtAuthGuard)
  getLessonProgress(
    @Param('lessonId') lessonId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.coursesService.getLessonProgress(userId, lessonId);
  }

  @Get(':courseId/lesson-progress')
  @UseGuards(JwtAuthGuard)
  getLessonProgressForCourse(
    @Param('courseId') courseId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.coursesService.getLessonProgressForCourse(userId, courseId);
  }
}
