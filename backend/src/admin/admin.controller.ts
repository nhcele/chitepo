import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';
import { InstructorApplicationStatus } from '../instructor/entities/instructor-application.entity';
import { Response } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  createUser(@Body() body: { email: string; name: string; role: UserRole; password?: string }) {
    return this.adminService.createUser(body);
  }

  @Post('users/:id/role')
  changeUserRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.adminService.changeUserRole(id, body.role);
  }

  @Post('users/:id/activate')
  activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Post('users/:id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }

  @Post('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.adminService.resetUserPassword(id, body.password);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Post('users/bulk-action')
  bulkUserAction(@Body() body: { userIds: string[]; action: 'activate' | 'deactivate' | 'delete'; role?: UserRole }) {
    return this.adminService.bulkUserAction(body.userIds, body.action, body.role);
  }

  @Get('approval-queue')
  getApprovalQueue() {
    return this.adminService.getApprovalQueue();
  }

  @Post('approval-queue/:id/approve')
  approveCourse(@Param('id') id: string, @Body() body: { comment?: string }) {
    return this.adminService.approveCourse(id, body.comment);
  }

  @Post('approval-queue/:id/reject')
  rejectCourse(@Param('id') id: string, @Body() body: { comment?: string }) {
    return this.adminService.rejectCourse(id, body.comment);
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMetrics() {
    return this.adminService.getMetrics();
  }

  // Settings & Feature Flags
  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateSettings(@Body() body: { settings: Record<string, any> }) {
    return this.adminService.setSettings(body);
  }

  // Instructor Applications
  @Get('instructor-applications')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listInstructorApps(@Query('status') status?: InstructorApplicationStatus) {
    return this.adminService.listInstructorApplications(status as InstructorApplicationStatus);
  }

  @Post('instructor-applications/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  approveInstructorApp(@Param('id') id: string, @Body('comment') comment?: string) {
    return this.adminService.approveInstructorApplication(id, comment);
  }

  @Post('instructor-applications/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  rejectInstructorApp(@Param('id') id: string, @Body('comment') comment?: string) {
    return this.adminService.rejectInstructorApplication(id, comment);
  }

  // CSV Exports
  @Get('exports/users.csv')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async exportUsers(@Res() res: Response) {
    const csv = await this.adminService.generateUsersCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  }

  @Get('exports/engagement.csv')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async exportEngagement(@Res() res: Response, @Query('courseId') courseId?: string) {
    const csv = await this.adminService.generateEngagementCsv(courseId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="engagement.csv"');
    res.send(csv);
  }

  @Get('exports/quiz-outcomes.csv')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async exportQuizOutcomes(@Res() res: Response, @Query('quizId') quizId?: string, @Query('lessonId') lessonId?: string) {
    const csv = await this.adminService.generateQuizOutcomesCsv(quizId, lessonId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="quiz-outcomes.csv"');
    res.send(csv);
  }

  // Async jobs
  @Post('exports/jobs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createExportJob(
    @Body('type') type: 'users' | 'engagement' | 'quiz-outcomes',
    @Body('params') params: any,
  ) {
    return this.adminService.createExportJob(type, params || null);
  }

  @Get('exports/jobs/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getExportJob(@Param('id') id: string) {
    return this.adminService.getExportJob(id);
  }

  @Get('exports/jobs/:id/download')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async downloadExport(@Param('id') id: string, @Res() res: Response) {
    const job = await this.adminService.getExportJob(id);
    if (!job || job.status !== 'COMPLETED' || !job.filePath) {
      return res.status(404).json({ message: 'Not ready' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${job.type}-${job.id}.csv"`);
    return res.sendFile(job.filePath);
  }
}
