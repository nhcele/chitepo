import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentsService } from './enrollments.service';

@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // POST /courses/:courseId/enroll
  @Post('courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollInCourse(@Param('courseId') courseId: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    try {
      return await this.enrollmentsService.enroll(userId, courseId);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Enrollment error:', error);
      throw new HttpException(
        error?.message || 'Failed to enroll in course',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // GET /me/enrollments
  @Get('me/enrollments')
  @UseGuards(JwtAuthGuard)
  async listMyEnrollments(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    try {
      return await this.enrollmentsService.listMyEnrollments(userId);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error listing enrollments:', error);
      throw new HttpException(
        error?.message || 'Failed to retrieve enrollments',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // GET /courses/:courseId/enrollment
  @Get('courses/:courseId/enrollment')
  @UseGuards(JwtAuthGuard)
  async getMyEnrollmentForCourse(@Param('courseId') courseId: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.enrollmentsService.getMyEnrollmentForCourse(userId, courseId);
  }

  // PATCH /enrollments/:id/progress
  @Patch('enrollments/:id/progress')
  @UseGuards(JwtAuthGuard)
  async updateProgress(
    @Param('id') enrollmentId: string,
    @Req() req: any,
    @Body() body: { lastLessonSeenAt?: string },
  ) {
    const userId = req.user?.id;
    const lastSeen = body.lastLessonSeenAt ? new Date(body.lastLessonSeenAt) : undefined;
    return this.enrollmentsService.updateProgress(enrollmentId, userId, lastSeen);
  }

  // GET /me/enrollments/:id/continue
  @Get('me/enrollments/:id/continue')
  @UseGuards(JwtAuthGuard)
  async getContinuePoint(@Param('id') enrollmentId: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    try {
      return await this.enrollmentsService.getContinuePoint(userId, enrollmentId);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Continue point error:', error);
      throw new HttpException(
        error?.message || 'Failed to retrieve continue point',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
