import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { JobRole } from '@mindelta/shared';

export interface LearningPathCourse {
  courseId: string;
  courseTitle?: string;
  priority: number;
  deadlineDays?: number;
  isRecurring?: boolean;
}

export interface LearningPathData {
  jobRole: JobRole;
  roleCategory: string;
  requiredCourses: LearningPathCourse[];
  recommendedCourses: LearningPathCourse[];
  electives: LearningPathCourse[];
  timeToCompleteWeeks: number;
  certificationRequirements: {
    mandatory: string[];
    optional: string[];
  };
}

@Injectable()
export class LearningPathManagementService {
  // In-memory storage for learning paths (replace with database in production)
  private learningPaths: Map<JobRole, LearningPathData> = new Map();

  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // Initialize with default paths
    this.initializeDefaultPaths();
  }

  private initializeDefaultPaths() {
    // Load default learning paths from the role-based-learning.service.ts definitions
    // This is a simplified version - in production, store in database
    const defaultPaths: Record<string, LearningPathData> = {
      teller: {
        jobRole: JobRole.TELLER,
        roleCategory: 'frontline',
        requiredCourses: [
          { courseId: 'aml-kyc-course', priority: 1, deadlineDays: 90, isRecurring: false },
          { courseId: 'fraud-prevention-course', priority: 2, deadlineDays: 90, isRecurring: false },
          { courseId: 'customer-service-course', priority: 3, deadlineDays: 90, isRecurring: false },
        ],
        recommendedCourses: [
          { courseId: 'retail-operations-course', priority: 4 },
        ],
        electives: [
          { courseId: 'communication-skills-course', priority: 5 },
        ],
        timeToCompleteWeeks: 12,
        certificationRequirements: {
          mandatory: ['frontline-certification'],
          optional: ['customer-excellence-certification'],
        },
      },
      compliance_officer: {
        jobRole: JobRole.COMPLIANCE_OFFICER,
        roleCategory: 'compliance',
        requiredCourses: [
          { courseId: 'aml-kyc-course', priority: 1, deadlineDays: 30, isRecurring: true },
          { courseId: 'information-security-course', priority: 2, deadlineDays: 30, isRecurring: true },
          { courseId: 'credit-risk-course', priority: 3, deadlineDays: 60, isRecurring: false },
        ],
        recommendedCourses: [
          { courseId: 'advanced-compliance-course', priority: 4 },
        ],
        electives: [
          { courseId: 'risk-management-course', priority: 5 },
        ],
        timeToCompleteWeeks: 16,
        certificationRequirements: {
          mandatory: ['compliance-certification', 'aml-certification'],
          optional: ['risk-management-certification'],
        },
      },
    };

    Object.values(defaultPaths).forEach(path => {
      this.learningPaths.set(path.jobRole, path);
    });
  }

  /**
   * Get all learning paths
   */
  async getAllLearningPaths(): Promise<LearningPathData[]> {
    return Array.from(this.learningPaths.values());
  }

  /**
   * Get learning path for a specific role
   */
  async getLearningPathByRole(jobRole: JobRole): Promise<LearningPathData> {
    const path = this.learningPaths.get(jobRole);
    
    if (!path) {
      throw new HttpException(
        `Learning path not found for role: ${jobRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    // Enrich with course details
    const enrichedPath = await this.enrichPathWithCourseDetails(path);
    return enrichedPath;
  }

  /**
   * Update learning path for a role
   */
  async updateLearningPath(
    jobRole: JobRole,
    pathData: Partial<LearningPathData>
  ): Promise<LearningPathData> {
    const existingPath = this.learningPaths.get(jobRole);
    
    const updatedPath: LearningPathData = {
      jobRole,
      roleCategory: pathData.roleCategory || existingPath?.roleCategory || 'general',
      requiredCourses: pathData.requiredCourses || existingPath?.requiredCourses || [],
      recommendedCourses: pathData.recommendedCourses || existingPath?.recommendedCourses || [],
      electives: pathData.electives || existingPath?.electives || [],
      timeToCompleteWeeks: pathData.timeToCompleteWeeks || existingPath?.timeToCompleteWeeks || 12,
      certificationRequirements: pathData.certificationRequirements || existingPath?.certificationRequirements || {
        mandatory: [],
        optional: [],
      },
    };

    this.learningPaths.set(jobRole, updatedPath);
    return updatedPath;
  }

  /**
   * Add course to learning path
   */
  async addCourseToPath(
    jobRole: JobRole,
    courseData: {
      courseId: string;
      type: 'required' | 'recommended' | 'elective';
      priority?: number;
      deadlineDays?: number;
      isRecurring?: boolean;
    }
  ): Promise<LearningPathData> {
    const path = this.learningPaths.get(jobRole);
    
    if (!path) {
      throw new HttpException(
        `Learning path not found for role: ${jobRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    // Verify course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseData.courseId },
    });

    if (!course) {
      throw new HttpException(
        `Course not found: ${courseData.courseId}`,
        HttpStatus.NOT_FOUND
      );
    }

    const newCourse: LearningPathCourse = {
      courseId: courseData.courseId,
      courseTitle: course.title,
      priority: courseData.priority || 0,
      deadlineDays: courseData.deadlineDays,
      isRecurring: courseData.isRecurring,
    };

    // Add to appropriate list
    if (courseData.type === 'required') {
      path.requiredCourses.push(newCourse);
    } else if (courseData.type === 'recommended') {
      path.recommendedCourses.push(newCourse);
    } else {
      path.electives.push(newCourse);
    }

    this.learningPaths.set(jobRole, path);
    return path;
  }

  /**
   * Remove course from learning path
   */
  async removeCourseFromPath(
    jobRole: JobRole,
    courseId: string,
    type: 'required' | 'recommended' | 'elective'
  ): Promise<LearningPathData> {
    const path = this.learningPaths.get(jobRole);
    
    if (!path) {
      throw new HttpException(
        `Learning path not found for role: ${jobRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    if (type === 'required') {
      path.requiredCourses = path.requiredCourses.filter(c => c.courseId !== courseId);
    } else if (type === 'recommended') {
      path.recommendedCourses = path.recommendedCourses.filter(c => c.courseId !== courseId);
    } else {
      path.electives = path.electives.filter(c => c.courseId !== courseId);
    }

    this.learningPaths.set(jobRole, path);
    return path;
  }

  /**
   * Update course settings in learning path
   */
  async updateCourseInPath(
    jobRole: JobRole,
    courseId: string,
    updates: {
      type: 'required' | 'recommended' | 'elective';
      priority?: number;
      deadlineDays?: number;
      isRecurring?: boolean;
    }
  ): Promise<LearningPathData> {
    const path = this.learningPaths.get(jobRole);
    
    if (!path) {
      throw new HttpException(
        `Learning path not found for role: ${jobRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    const courseList = updates.type === 'required' ? path.requiredCourses :
                       updates.type === 'recommended' ? path.recommendedCourses :
                       path.electives;

    const course = courseList.find(c => c.courseId === courseId);
    
    if (!course) {
      throw new HttpException(
        `Course not found in ${updates.type} list: ${courseId}`,
        HttpStatus.NOT_FOUND
      );
    }

    if (updates.priority !== undefined) course.priority = updates.priority;
    if (updates.deadlineDays !== undefined) course.deadlineDays = updates.deadlineDays;
    if (updates.isRecurring !== undefined) course.isRecurring = updates.isRecurring;

    this.learningPaths.set(jobRole, path);
    return path;
  }

  /**
   * Clone learning path from one role to another
   */
  async cloneLearningPath(sourceRole: JobRole, targetRole: JobRole): Promise<LearningPathData> {
    const sourcePath = this.learningPaths.get(sourceRole);
    
    if (!sourcePath) {
      throw new HttpException(
        `Source learning path not found for role: ${sourceRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    const clonedPath: LearningPathData = {
      ...JSON.parse(JSON.stringify(sourcePath)),
      jobRole: targetRole,
    };

    this.learningPaths.set(targetRole, clonedPath);
    return clonedPath;
  }

  /**
   * Get statistics for a learning path
   */
  async getPathStatistics(jobRole: JobRole): Promise<any> {
    const path = this.learningPaths.get(jobRole);
    
    if (!path) {
      throw new HttpException(
        `Learning path not found for role: ${jobRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    // Count users with this role
    const usersCount = await this.userRepository.count({
      where: { jobRole },
    });

    // Calculate total courses
    const totalCourses = path.requiredCourses.length + 
                        path.recommendedCourses.length + 
                        path.electives.length;

    // Calculate total deadline days
    const totalDeadlineDays = path.requiredCourses.reduce(
      (sum, course) => sum + (course.deadlineDays || 0),
      0
    );

    return {
      jobRole,
      usersAssigned: usersCount,
      totalCourses,
      requiredCoursesCount: path.requiredCourses.length,
      recommendedCoursesCount: path.recommendedCourses.length,
      electivesCount: path.electives.length,
      averageDeadlineDays: path.requiredCourses.length > 0 
        ? Math.round(totalDeadlineDays / path.requiredCourses.length)
        : 0,
      timeToCompleteWeeks: path.timeToCompleteWeeks,
      recurringCourses: path.requiredCourses.filter(c => c.isRecurring).length,
    };
  }

  /**
   * Validate learning path configuration
   */
  async validateLearningPath(jobRole: JobRole): Promise<any> {
    const path = this.learningPaths.get(jobRole);
    
    if (!path) {
      throw new HttpException(
        `Learning path not found for role: ${jobRole}`,
        HttpStatus.NOT_FOUND
      );
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if required courses exist
    for (const course of path.requiredCourses) {
      const exists = await this.courseRepository.findOne({
        where: { id: course.courseId },
      });
      if (!exists) {
        errors.push(`Required course not found: ${course.courseId}`);
      }
      if (!course.deadlineDays || course.deadlineDays <= 0) {
        warnings.push(`Required course ${course.courseId} has no deadline set`);
      }
    }

    // Check for duplicate courses
    const allCourseIds = [
      ...path.requiredCourses.map(c => c.courseId),
      ...path.recommendedCourses.map(c => c.courseId),
      ...path.electives.map(c => c.courseId),
    ];
    const duplicates = allCourseIds.filter((id, index) => allCourseIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate courses found: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedAt: new Date(),
    };
  }

  /**
   * Export learning path as JSON
   */
  async exportLearningPath(jobRole: JobRole): Promise<LearningPathData> {
    return this.getLearningPathByRole(jobRole);
  }

  /**
   * Import learning path from JSON
   */
  async importLearningPath(pathData: LearningPathData): Promise<LearningPathData> {
    // Validate the imported data
    const validation = await this.validateLearningPath(pathData.jobRole);
    
    if (!validation.valid) {
      throw new HttpException(
        `Invalid learning path data: ${validation.errors.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    this.learningPaths.set(pathData.jobRole, pathData);
    return pathData;
  }

  /**
   * Enrich learning path with course details
   */
  private async enrichPathWithCourseDetails(path: LearningPathData): Promise<LearningPathData> {
    const enrichCourse = async (course: LearningPathCourse) => {
      const courseDetails = await this.courseRepository.findOne({
        where: { id: course.courseId },
      });
      return {
        ...course,
        courseTitle: courseDetails?.title || 'Unknown Course',
      };
    };

    const enrichedPath = { ...path };
    enrichedPath.requiredCourses = await Promise.all(path.requiredCourses.map(enrichCourse));
    enrichedPath.recommendedCourses = await Promise.all(path.recommendedCourses.map(enrichCourse));
    enrichedPath.electives = await Promise.all(path.electives.map(enrichCourse));

    return enrichedPath;
  }
}
