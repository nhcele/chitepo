import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';

@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  // Public apply endpoint
  @Post('apply')
  apply(@Body() body: { fullName: string; email: string; bio?: string; sampleVideoUrl?: string; socials?: any; agreeTos?: boolean; agreeOwnership?: boolean; agreeRevenueShare?: boolean }) {
    return this.instructorService.apply(body);
  }

  // Authenticated instructor endpoints
  @Get('courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listMyCourses(@Req() req: any) {
    return this.instructorService.listMyCourses(req.user?.id, req.user?.role);
  }

  @Post('courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createCourse(@Body() body: any, @Req() req: any) {
    return this.instructorService.createCourse(body, req.user?.id);
  }

  @Get('courses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getCourse(@Param('id') id: string, @Req() req: any) {
    return this.instructorService.getCourse(id, req.user?.id, req.user?.role);
  }

  @Patch('courses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateCourse(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.instructorService.updateCourse(id, body, req.user?.id, req.user?.role);
  }

  @Post('courses/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  submitForReview(@Param('id') id: string, @Req() req: any) {
    return this.instructorService.submitForReview(id, req.user?.id);
  }

  @Get('analytics/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.instructorService.getCourseAnalytics(courseId);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMyInstructorMetrics(@Req() req: any) {
    const instructorId = req.user?.id;
    return this.instructorService.getInstructorMetrics(instructorId);
  }

  @Get('courses/:courseId/students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getCourseStudents(@Param('courseId') courseId: string, @Req() req: any) {
    const instructorId = req.user?.id;
    const userRole = req.user?.role;
    return this.instructorService.getCourseStudents(courseId, instructorId, userRole);
  }

  @Get('courses/:courseId/students/:studentId/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getStudentProgress(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Req() req: any,
  ) {
    const instructorId = req.user?.id;
    const userRole = req.user?.role;
    return this.instructorService.getStudentProgress(courseId, studentId, instructorId, userRole);
  }

  @Get('courses/:courseId/progress-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getCourseProgressSummary(@Param('courseId') courseId: string, @Req() req: any) {
    const instructorId = req.user?.id;
    return this.instructorService.getCourseProgressSummary(courseId, instructorId);
  }
}
