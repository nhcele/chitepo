import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBasedLearningService } from './role-based-learning.service';
import { JobRole } from '@mindelta/shared';

@Controller('role-learning')
@UseGuards(JwtAuthGuard)
export class RoleBasedLearningController {
  constructor(private readonly roleBasedLearningService: RoleBasedLearningService) {}

  @Get('my-path')
  async getMyLearningPath(@Req() req: any) {
    return this.roleBasedLearningService.getRoleLearningPath(req.user.sub);
  }

  @Get('users/:userId/path')
  async getUserLearningPath(@Param('userId') userId: string) {
    return this.roleBasedLearningService.getRoleLearningPath(userId);
  }

  @Post('auto-assign/:userId')
  async autoAssignCourses(@Param('userId') userId: string) {
    return this.roleBasedLearningService.autoAssignRoleBasedCourses(userId);
  }

  @Get('users/:userId/compliance')
  async getComplianceStatus(@Param('userId') userId: string) {
    return this.roleBasedLearningService.getComplianceStatus(userId);
  }

  @Get('my-compliance')
  async getMyComplianceStatus(@Req() req: any) {
    return this.roleBasedLearningService.getComplianceStatus(req.user.sub);
  }

  @Get('paths/by-role/:jobRole')
  async getLearningPathByRole(@Param('jobRole') jobRole: JobRole) {
    // This would return the learning path definition for a specific role
    // Useful for HR/managers to see what each role requires
    return { message: 'Learning path definition for role', jobRole };
  }

  @Get('analytics/role-compliance')
  async getRoleComplianceAnalytics(@Query() query: any) {
    // Analytics for managers to see compliance status by role
    return { message: 'Role compliance analytics', query };
  }
}
