import { Body, Controller, Delete, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    await this.coursesService.assertCanManageLesson(req.user?.id, req.user?.role, id);
    return this.coursesService.updateLesson(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.coursesService.assertCanManageLesson(req.user?.id, req.user?.role, id);
    return this.coursesService.deleteLesson(id);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  async reorder(@Body() body: { moduleId: string; lessons: { lessonId: string; orderIndex: number }[] }, @Req() req: any) {
    await this.coursesService.assertCanManageModule(req.user?.id, req.user?.role, body.moduleId);
    return this.coursesService.reorderLessons(body.moduleId, body.lessons);
  }
}
