import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, JobRole } from '@mindelta/shared';
import { LearningPathManagementService, LearningPathData, LearningPathCourse } from './learning-path-management.service';

interface CreateLearningPathDto {
  jobRole: JobRole;
  roleCategory: string;
  requiredCourses: Array<{
    courseId: string;
    priority: number;
    deadlineDays?: number;
    isRecurring?: boolean;
  }>;
  recommendedCourses: Array<{
    courseId: string;
    priority: number;
  }>;
  electives: Array<{
    courseId: string;
    priority: number;
  }>;
  timeToCompleteWeeks: number;
  certificationRequirements: {
    mandatory: string[];
    optional: string[];
  };
}

@Controller('learning-paths')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearningPathManagementController {
  constructor(
    private readonly learningPathService: LearningPathManagementService
  ) {}

  /**
   * Get all learning paths
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllPaths(): Promise<LearningPathData[]> {
    return this.learningPathService.getAllLearningPaths();
  }

  /**
   * Get learning path for a specific role
   */
  @Get(':jobRole')
  async getPathByRole(@Param('jobRole') jobRole: JobRole): Promise<LearningPathData> {
    return this.learningPathService.getLearningPathByRole(jobRole);
  }

  /**
   * Create or update learning path for a role
   */
  @Put(':jobRole')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updatePath(
    @Param('jobRole') jobRole: JobRole,
    @Body() pathData: CreateLearningPathDto
  ): Promise<LearningPathData> {
    return this.learningPathService.updateLearningPath(jobRole, pathData as any);
  }

  /**
   * Add course to learning path
   */
  @Post(':jobRole/courses')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async addCourse(
    @Param('jobRole') jobRole: JobRole,
    @Body() courseData: {
      courseId: string;
      type: 'required' | 'recommended' | 'elective';
      priority?: number;
      deadlineDays?: number;
      isRecurring?: boolean;
    }
  ): Promise<LearningPathData> {
    return this.learningPathService.addCourseToPath(jobRole, courseData);
  }

  /**
   * Remove course from learning path
   */
  @Delete(':jobRole/courses/:courseId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeCourse(
    @Param('jobRole') jobRole: JobRole,
    @Param('courseId') courseId: string,
    @Body() data: { type: 'required' | 'recommended' | 'elective' }
  ): Promise<LearningPathData> {
    return this.learningPathService.removeCourseFromPath(jobRole, courseId, data.type);
  }

  /**
   * Update course settings in learning path
   */
  @Put(':jobRole/courses/:courseId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCourse(
    @Param('jobRole') jobRole: JobRole,
    @Param('courseId') courseId: string,
    @Body() updates: {
      type: 'required' | 'recommended' | 'elective';
      priority?: number;
      deadlineDays?: number;
      isRecurring?: boolean;
    }
  ): Promise<LearningPathData> {
    return this.learningPathService.updateCourseInPath(jobRole, courseId, updates);
  }

  /**
   * Clone learning path from one role to another
   */
  @Post(':sourceRole/clone/:targetRole')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async clonePath(
    @Param('sourceRole') sourceRole: JobRole,
    @Param('targetRole') targetRole: JobRole
  ): Promise<LearningPathData> {
    return this.learningPathService.cloneLearningPath(sourceRole, targetRole);
  }

  /**
   * Get learning path statistics
   */
  @Get(':jobRole/statistics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPathStatistics(@Param('jobRole') jobRole: JobRole): Promise<any> {
    return this.learningPathService.getPathStatistics(jobRole);
  }

  /**
   * Validate learning path configuration
   */
  @Post(':jobRole/validate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async validatePath(@Param('jobRole') jobRole: JobRole): Promise<any> {
    return this.learningPathService.validateLearningPath(jobRole);
  }

  /**
   * Export learning path as JSON
   */
  @Get(':jobRole/export')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async exportPath(@Param('jobRole') jobRole: JobRole): Promise<LearningPathData> {
    return this.learningPathService.exportLearningPath(jobRole);
  }

  /**
   * Import learning path from JSON
   */
  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async importPath(@Body() pathData: CreateLearningPathDto): Promise<LearningPathData> {
    return this.learningPathService.importLearningPath(pathData as any);
  }
}
