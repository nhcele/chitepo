import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { UserTrackAssignment } from '../tracks/entities/user-track-assignment.entity';
import { TracksService, TrackAssignmentSource } from '../tracks/tracks.service';
import { PathwayType } from '../certifications/entities/certification-pathway.entity';
import { JobRole, RoleCategory, RoleLevel } from '@mindelta/shared';

@Injectable()
export class RoleBasedLearningService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    private tracksService: TracksService,
  ) {}

  /**
   * Get role-based learning path for a user
   */
  async getRoleLearningPath(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['enrollments'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const userEnrollments = user.enrollments || [];

    // If user doesn't have a job role, return general learning information
    if (!user.jobRole) {
      return {
        user: {
          id: user.id,
          name: user.name,
          jobRole: null,
          roleCategory: null,
          roleLevel: null,
          department: user.department,
        },
        learningPath: {
          requiredCourses: [],
          recommendedCourses: [],
          electives: [],
          certificationRequirements: {
            mandatory: [],
            optional: [],
          },
          timeToComplete: 0,
          prerequisites: [],
          careerProgression: [],
          complianceDeadlines: [],
          progress: 0,
          nextRecommendedCourse: null,
        },
        message: 'No job role assigned. Please contact your administrator to get a role assigned for personalized learning paths.',
      };
    }

    const learningPath = this.getLearningPathByRole(user.jobRole);

    // Mark completed courses
    const coursesWithStatus = learningPath.requiredCourses.map(course => ({
      ...course,
      status: this.getCourseStatus(course.id, userEnrollments),
      enrollmentDate: this.getEnrollmentDate(course.id, userEnrollments),
      completedAt: this.getCompletionDate(course.id, userEnrollments),
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        jobRole: user.jobRole,
        roleCategory: user.roleCategory,
        roleLevel: user.roleLevel,
        department: user.department,
      },
      learningPath: {
        requiredCourses: coursesWithStatus,
        recommendedCourses: learningPath.recommendedCourses,
        electives: learningPath.electives,
        certificationRequirements: learningPath.certificationRequirements,
        timeToComplete: learningPath.timeToComplete,
        prerequisites: learningPath.prerequisites,
        careerProgression: learningPath.careerProgression,
        complianceDeadlines: this.getUpcomingDeadlines(coursesWithStatus, user.hireDate),
        progress: this.calculatePathProgress(coursesWithStatus),
        nextRecommendedCourse: this.getNextRecommendedCourse(coursesWithStatus),
      },
    };
  }

  /**
   * Auto-assign courses based on user role
   */
  async autoAssignRoleBasedCourses(userId: string): Promise<Enrollment[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.jobRole) {
      return [];
    }

    const learningPath = this.getLearningPathByRole(user.jobRole);
    const enrollments: Enrollment[] = [];

    for (const courseData of learningPath.requiredCourses) {
      const course = await this.courseRepository.findOne({
        where: { id: courseData.id },
      });

      if (!course) continue;

      // Check if already enrolled
      const existingEnrollment = await this.enrollmentRepository.findOne({
        where: { userId, courseId: course.id },
      });

      if (!existingEnrollment) {
        const enrollment = this.enrollmentRepository.create({
          userId,
          courseId: course.id,
          enrolledAt: new Date(),
          progressPercentage: 0,
        });
        
        enrollments.push(await this.enrollmentRepository.save(enrollment));
      }
    }

    // Assign track if available
    try {
      await this.tracksService.assignTrack(userId, this.getTrackTypeByRole(user.jobRole), {
        source: 'automatic' as any,
        assignedReason: `Auto-assigned based on role: ${user.jobRole}`,
        isMandatory: true,
        mandatoryReason: 'Required for job role compliance',
      });
    } catch (error) {
      // Track might already exist, which is fine
    }

    return enrollments;
  }

  /**
   * Get compliance status for a user
   */
  async getComplianceStatus(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['enrollments'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // If user doesn't have a job role, return general compliance information
    if (!user.jobRole) {
      return {
        userId: user.id,
        jobRole: null,
        complianceScore: 0,
        status: 'no_role_assigned',
        complianceItems: [],
        summary: {
          total: 0,
          completed: 0,
          overdue: 0,
          pending: 0,
        },
        message: 'No job role assigned. Compliance tracking requires a job role assignment.',
      };
    }

    const learningPath = this.getLearningPathByRole(user.jobRole);
    const userEnrollments = user.enrollments || [];
    const hireDate = user.hireDate || new Date();

    const complianceItems = learningPath.complianceDeadlines.map(deadline => {
      const course = learningPath.requiredCourses.find(c => c.id === deadline.courseId);
      const enrollment = userEnrollments.find(e => e.courseId === deadline.courseId);
      const dueDate = new Date(hireDate.getTime() + deadline.deadlineDays * 24 * 60 * 60 * 1000);
      
      return {
        courseId: deadline.courseId,
        courseTitle: course?.title || 'Unknown Course',
        dueDate,
        isOverdue: new Date() > dueDate && !enrollment?.completedAt,
        isCompleted: !!enrollment?.completedAt,
        daysUntilDue: Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        isRecurring: deadline.recurring,
      };
    });

    const overdueCount = complianceItems.filter(item => item.isOverdue).length;
    const completedCount = complianceItems.filter(item => item.isCompleted).length;

    return {
      userId: user.id,
      jobRole: user.jobRole,
      complianceScore: Math.round((completedCount / complianceItems.length) * 100),
      status: overdueCount === 0 ? (completedCount === complianceItems.length ? 'compliant' : 'in_progress') : 'non_compliant',
      complianceItems,
      summary: {
        total: complianceItems.length,
        completed: completedCount,
        overdue: overdueCount,
        pending: complianceItems.length - completedCount - overdueCount,
      },
    };
  }

  /**
   * Get learning path definition by role
   */
  private getLearningPathByRole(jobRole: JobRole): any {
    const paths: Record<JobRole, any> = {
      [JobRole.TELLER]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 90 },
          { id: 'fraud-prevention-course', priority: 2, deadlineDays: 90 },
          { id: 'customer-service-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'retail-operations-course', priority: 4 },
        ],
        electives: [
          { id: 'communication-skills-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['frontline-certification'],
          optional: ['customer-excellence-certification'],
        },
        timeToComplete: 12,
        prerequisites: [],
        careerProgression: [JobRole.PERSONAL_BANKER, JobRole.OPERATIONS_CLERK],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 90, recurring: false },
          { courseId: 'fraud-prevention-course', deadlineDays: 90, recurring: false },
        ],
      },
      [JobRole.COMPLIANCE_OFFICER]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 30 },
          { id: 'information-security-course', priority: 2, deadlineDays: 30 },
          { id: 'credit-risk-course', priority: 3, deadlineDays: 60 },
        ],
        recommendedCourses: [
          { id: 'advanced-compliance-course', priority: 4 },
        ],
        electives: [
          { id: 'risk-management-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['compliance-certification', 'aml-certification'],
          optional: ['risk-management-certification'],
        },
        timeToComplete: 16,
        prerequisites: [],
        careerProgression: [JobRole.COMPLIANCE_MANAGER, JobRole.RISK_ANALYST],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 30, recurring: true },
          { courseId: 'information-security-course', deadlineDays: 30, recurring: true },
        ],
      },
      [JobRole.RISK_ANALYST]: {
        requiredCourses: [
          { id: 'credit-risk-course', priority: 1, deadlineDays: 60 },
          { id: 'aml-kyc-course', priority: 2, deadlineDays: 90 },
          { id: 'risk-analytics-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'financial-analysis-course', priority: 4 },
        ],
        electives: [
          { id: 'market-risk-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['risk-analyst-certification'],
          optional: ['financial-analysis-certification'],
        },
        timeToComplete: 16,
        prerequisites: [],
        careerProgression: [JobRole.RISK_MANAGER, JobRole.CREDIT_ANALYST],
        complianceDeadlines: [
          { courseId: 'credit-risk-course', deadlineDays: 60, recurring: false },
          { courseId: 'aml-kyc-course', deadlineDays: 90, recurring: false },
        ],
      },
      [JobRole.CREDIT_ANALYST]: {
        requiredCourses: [
          { id: 'credit-risk-course', priority: 1, deadlineDays: 60 },
          { id: 'aml-kyc-course', priority: 2, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'financial-analysis-course', priority: 3 },
        ],
        electives: [
          { id: 'commercial-lending-course', priority: 4 },
        ],
        certificationRequirements: {
          mandatory: ['credit-risk-certification'],
          optional: ['commercial-lending-certification'],
        },
        timeToComplete: 14,
        prerequisites: [],
        careerProgression: [JobRole.RISK_ANALYST, JobRole.OPERATIONS_MANAGER],
        complianceDeadlines: [
          { courseId: 'credit-risk-course', deadlineDays: 60, recurring: false },
        ],
      },
      // Add more role definitions as needed
      [JobRole.CUSTOMER_SERVICE_REP]: {
        requiredCourses: [
          { id: 'customer-service-course', priority: 1, deadlineDays: 90 },
          { id: 'fraud-prevention-course', priority: 2, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'communication-skills-course', priority: 3 },
        ],
        electives: [
          { id: 'retail-operations-course', priority: 4 },
        ],
        certificationRequirements: {
          mandatory: ['customer-service-certification'],
          optional: ['frontline-certification'],
        },
        timeToComplete: 10,
        prerequisites: [],
        careerProgression: [JobRole.PERSONAL_BANKER, JobRole.TELLER],
        complianceDeadlines: [
          { courseId: 'customer-service-course', deadlineDays: 90, recurring: false },
        ],
      },
      [JobRole.IT_SUPPORT]: {
        requiredCourses: [
          { id: 'information-security-course', priority: 1, deadlineDays: 30 },
        ],
        recommendedCourses: [
          { id: 'cybersecurity-fundamentals-course', priority: 2 },
        ],
        electives: [
          { id: 'it-governance-course', priority: 3 },
        ],
        certificationRequirements: {
          mandatory: ['it-security-certification'],
          optional: ['cybersecurity-certification'],
        },
        timeToComplete: 12,
        prerequisites: [],
        careerProgression: [JobRole.SYSTEMS_ADMINISTRATOR, JobRole.CYBERSECURITY_ANALYST],
        complianceDeadlines: [
          { courseId: 'information-security-course', deadlineDays: 30, recurring: true },
        ],
      },
      // Default fallback for other roles
      [JobRole.BRANCH_MANAGER]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 60 },
          { id: 'credit-risk-course', priority: 2, deadlineDays: 60 },
          { id: 'information-security-course', priority: 3, deadlineDays: 60 },
        ],
        recommendedCourses: [
          { id: 'leadership-course', priority: 4 },
          { id: 'operations-management-course', priority: 5 },
        ],
        electives: [
          { id: 'financial-strategy-course', priority: 6 },
        ],
        certificationRequirements: {
          mandatory: ['management-certification', 'compliance-certification'],
          optional: ['leadership-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.OPERATIONS_MANAGER, JobRole.CFO],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 60, recurring: true },
          { courseId: 'credit-risk-course', deadlineDays: 60, recurring: false },
          { courseId: 'information-security-course', deadlineDays: 60, recurring: true },
        ],
      },
      [JobRole.PERSONAL_BANKER]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 90 },
          { id: 'customer-service-course', priority: 2, deadlineDays: 90 },
          { id: 'credit-risk-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'sales-techniques-course', priority: 4 },
        ],
        electives: [
          { id: 'wealth-management-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['personal-banker-certification'],
          optional: ['sales-certification'],
        },
        timeToComplete: 16,
        prerequisites: [],
        careerProgression: [JobRole.BRANCH_MANAGER, JobRole.CREDIT_ANALYST],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 90, recurring: false },
          { courseId: 'customer-service-course', deadlineDays: 90, recurring: false },
        ],
      },
      [JobRole.OPERATIONS_CLERK]: {
        requiredCourses: [
          { id: 'retail-operations-course', priority: 1, deadlineDays: 90 },
          { id: 'fraud-prevention-course', priority: 2, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'operational-efficiency-course', priority: 3 },
        ],
        electives: [
          { id: 'process-improvement-course', priority: 4 },
        ],
        certificationRequirements: {
          mandatory: ['operations-certification'],
          optional: ['process-improvement-certification'],
        },
        timeToComplete: 12,
        prerequisites: [],
        careerProgression: [JobRole.OPERATIONS_MANAGER, JobRole.BRANCH_MANAGER],
        complianceDeadlines: [
          { courseId: 'fraud-prevention-course', deadlineDays: 90, recurring: false },
        ],
      },
      [JobRole.SYSTEMS_ADMINISTRATOR]: {
        requiredCourses: [
          { id: 'information-security-course', priority: 1, deadlineDays: 30 },
          { id: 'cybersecurity-fundamentals-course', priority: 2, deadlineDays: 60 },
        ],
        recommendedCourses: [
          { id: 'system-administration-course', priority: 3 },
        ],
        electives: [
          { id: 'cloud-computing-course', priority: 4 },
        ],
        certificationRequirements: {
          mandatory: ['system-admin-certification'],
          optional: ['cloud-certification'],
        },
        timeToComplete: 16,
        prerequisites: [],
        careerProgression: [JobRole.CYBERSECURITY_ANALYST, JobRole.CTO],
        complianceDeadlines: [
          { courseId: 'information-security-course', deadlineDays: 30, recurring: true },
        ],
      },
      [JobRole.CYBERSECURITY_ANALYST]: {
        requiredCourses: [
          { id: 'information-security-course', priority: 1, deadlineDays: 30 },
          { id: 'cybersecurity-fundamentals-course', priority: 2, deadlineDays: 60 },
          { id: 'advanced-threat-detection-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'incident-response-course', priority: 4 },
        ],
        electives: [
          { id: 'penetration-testing-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['cybersecurity-certification'],
          optional: ['incident-response-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.CTO, JobRole.CRO],
        complianceDeadlines: [
          { courseId: 'information-security-course', deadlineDays: 30, recurring: true },
          { courseId: 'cybersecurity-fundamentals-course', deadlineDays: 60, recurring: false },
        ],
      },
      [JobRole.OPERATIONS_MANAGER]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 60 },
          { id: 'credit-risk-course', priority: 2, deadlineDays: 60 },
          { id: 'operations-management-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'leadership-course', priority: 4 },
          { id: 'financial-management-course', priority: 5 },
        ],
        electives: [
          { id: 'strategic-planning-course', priority: 6 },
        ],
        certificationRequirements: {
          mandatory: ['operations-management-certification', 'compliance-certification'],
          optional: ['leadership-certification'],
        },
        timeToComplete: 24,
        prerequisites: [],
        careerProgression: [JobRole.BRANCH_MANAGER, JobRole.CFO],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 60, recurring: true },
          { courseId: 'credit-risk-course', deadlineDays: 60, recurring: false },
        ],
      },
      [JobRole.COMPLIANCE_MANAGER]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 30 },
          { id: 'information-security-course', priority: 2, deadlineDays: 30 },
          { id: 'advanced-compliance-course', priority: 3, deadlineDays: 60 },
        ],
        recommendedCourses: [
          { id: 'compliance-management-course', priority: 4 },
        ],
        electives: [
          { id: 'regulatory-affairs-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['compliance-management-certification', 'aml-certification'],
          optional: ['regulatory-affairs-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.CCO, JobRole.BRANCH_MANAGER],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 30, recurring: true },
          { courseId: 'information-security-course', deadlineDays: 30, recurring: true },
        ],
      },
      [JobRole.RISK_MANAGER]: {
        requiredCourses: [
          { id: 'credit-risk-course', priority: 1, deadlineDays: 60 },
          { id: 'aml-kyc-course', priority: 2, deadlineDays: 60 },
          { id: 'enterprise-risk-management-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'risk-analytics-course', priority: 4 },
        ],
        electives: [
          { id: 'strategic-risk-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['risk-management-certification'],
          optional: ['enterprise-risk-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.CRO, JobRole.CFO],
        complianceDeadlines: [
          { courseId: 'credit-risk-course', deadlineDays: 60, recurring: false },
          { courseId: 'aml-kyc-course', deadlineDays: 60, recurring: true },
        ],
      },
      // Executive roles
      [JobRole.CEO]: {
        requiredCourses: [
          { id: 'strategic-leadership-course', priority: 1, deadlineDays: 90 },
          { id: 'corporate-governance-course', priority: 2, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'financial-strategy-course', priority: 3 },
          { id: 'digital-transformation-course', priority: 4 },
        ],
        electives: [
          { id: 'board-management-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['executive-leadership-certification'],
          optional: ['board-certification'],
        },
        timeToComplete: 16,
        prerequisites: [],
        careerProgression: [],
        complianceDeadlines: [
          { courseId: 'corporate-governance-course', deadlineDays: 90, recurring: false },
        ],
      },
      [JobRole.CFO]: {
        requiredCourses: [
          { id: 'financial-management-course', priority: 1, deadlineDays: 60 },
          { id: 'credit-risk-course', priority: 2, deadlineDays: 60 },
          { id: 'financial-strategy-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'treasury-management-course', priority: 4 },
        ],
        electives: [
          { id: 'international-finance-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['cfo-certification'],
          optional: ['treasury-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.CEO],
        complianceDeadlines: [
          { courseId: 'credit-risk-course', deadlineDays: 60, recurring: false },
        ],
      },
      [JobRole.CTO]: {
        requiredCourses: [
          { id: 'information-security-course', priority: 1, deadlineDays: 30 },
          { id: 'digital-transformation-course', priority: 2, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'technology-strategy-course', priority: 3 },
        ],
        electives: [
          { id: 'innovation-management-course', priority: 4 },
        ],
        certificationRequirements: {
          mandatory: ['cto-certification'],
          optional: ['digital-transformation-certification'],
        },
        timeToComplete: 18,
        prerequisites: [],
        careerProgression: [JobRole.CEO],
        complianceDeadlines: [
          { courseId: 'information-security-course', deadlineDays: 30, recurring: true },
        ],
      },
      [JobRole.CCO]: {
        requiredCourses: [
          { id: 'aml-kyc-course', priority: 1, deadlineDays: 30 },
          { id: 'compliance-management-course', priority: 2, deadlineDays: 60 },
          { id: 'regulatory-affairs-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'corporate-governance-course', priority: 4 },
        ],
        electives: [
          { id: 'international-compliance-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['cco-certification', 'aml-certification'],
          optional: ['international-compliance-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.CEO],
        complianceDeadlines: [
          { courseId: 'aml-kyc-course', deadlineDays: 30, recurring: true },
        ],
      },
      [JobRole.CRO]: {
        requiredCourses: [
          { id: 'enterprise-risk-management-course', priority: 1, deadlineDays: 60 },
          { id: 'credit-risk-course', priority: 2, deadlineDays: 60 },
          { id: 'strategic-risk-course', priority: 3, deadlineDays: 90 },
        ],
        recommendedCourses: [
          { id: 'risk-analytics-course', priority: 4 },
        ],
        electives: [
          { id: 'board-risk-oversight-course', priority: 5 },
        ],
        certificationRequirements: {
          mandatory: ['cro-certification'],
          optional: ['board-risk-certification'],
        },
        timeToComplete: 20,
        prerequisites: [],
        careerProgression: [JobRole.CEO],
        complianceDeadlines: [
          { courseId: 'enterprise-risk-management-course', deadlineDays: 60, recurring: false },
        ],
      },
    };

    return paths[jobRole] || paths[JobRole.TELLER]; // Default to teller path
  }

  private getTrackTypeByRole(jobRole: JobRole): PathwayType {
    const trackMapping: Record<JobRole, PathwayType> = {
      [JobRole.TELLER]: PathwayType.GENERAL_EDUCATION,
      [JobRole.CUSTOMER_SERVICE_REP]: PathwayType.GENERAL_EDUCATION,
      [JobRole.PERSONAL_BANKER]: PathwayType.GENERAL_EDUCATION,
      [JobRole.OPERATIONS_CLERK]: PathwayType.SPECIALIST,
      [JobRole.COMPLIANCE_OFFICER]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.RISK_ANALYST]: PathwayType.SPECIALIST,
      [JobRole.CREDIT_ANALYST]: PathwayType.SPECIALIST,
      [JobRole.IT_SUPPORT]: PathwayType.SPECIALIST,
      [JobRole.SYSTEMS_ADMINISTRATOR]: PathwayType.SPECIALIST,
      [JobRole.CYBERSECURITY_ANALYST]: PathwayType.SPECIALIST,
      [JobRole.BRANCH_MANAGER]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.OPERATIONS_MANAGER]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.COMPLIANCE_MANAGER]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.RISK_MANAGER]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.CEO]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.CFO]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.CTO]: PathwayType.SPECIALIST,
      [JobRole.CCO]: PathwayType.GOVERNMENT_OFFICIALS,
      [JobRole.CRO]: PathwayType.GOVERNMENT_OFFICIALS,
    };

    return trackMapping[jobRole] || PathwayType.GENERAL_EDUCATION;
  }

  private getCourseStatus(courseId: string, enrollments: Enrollment[]): string {
    const enrollment = enrollments.find(e => e.courseId === courseId);
    if (!enrollment) return 'not_started';
    if (enrollment.completedAt) return 'completed';
    return 'in_progress';
  }

  private getEnrollmentDate(courseId: string, enrollments: Enrollment[]): Date | null {
    const enrollment = enrollments.find(e => e.courseId === courseId);
    return enrollment?.enrolledAt || null;
  }

  private getCompletionDate(courseId: string, enrollments: Enrollment[]): Date | null {
    const enrollment = enrollments.find(e => e.courseId === courseId);
    return enrollment?.completedAt || null;
  }

  private calculatePathProgress(courses: any[]): number {
    if (courses.length === 0) return 0;
    const completedCount = courses.filter(course => course.status === 'completed').length;
    return Math.round((completedCount / courses.length) * 100);
  }

  private getNextRecommendedCourse(courses: any[]): any {
    const inProgressCourses = courses.filter(course => course.status === 'in_progress');
    if (inProgressCourses.length > 0) {
      return inProgressCourses.sort((a, b) => a.priority - b.priority)[0];
    }
    
    const notStartedCourses = courses.filter(course => course.status === 'not_started');
    if (notStartedCourses.length > 0) {
      return notStartedCourses.sort((a, b) => a.priority - b.priority)[0];
    }
    
    return null;
  }

  private getUpcomingDeadlines(courses: any[], hireDate?: Date): any[] {
    if (!hireDate) return [];
    
    const now = new Date();
    return courses
      .filter(course => course.deadlineDays && course.status !== 'completed')
      .map(course => ({
        courseId: course.id,
        courseTitle: course.title,
        dueDate: new Date(hireDate.getTime() + course.deadlineDays * 24 * 60 * 60 * 1000),
        daysUntilDue: Math.ceil((new Date(hireDate.getTime() + course.deadlineDays * 24 * 60 * 60 * 1000).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .filter(deadline => deadline.daysUntilDue >= 0 && deadline.daysUntilDue <= 30)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }
}
