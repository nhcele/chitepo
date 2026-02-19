import { JobRole, RoleCategory, RoleLevel } from './user.types';

// Role-Based Learning Paths
export interface RoleLearningPath {
  id: string;
  jobRole: JobRole;
  roleCategory: RoleCategory;
  roleLevel: RoleLevel;
  requiredCourses: string[]; // Course IDs
  recommendedCourses: string[]; // Course IDs
  electives: string[]; // Course IDs
  certificationRequirements: {
    mandatory: string[]; // Certification IDs
    optional: string[]; // Certification IDs
  };
  timeToComplete: number; // Estimated weeks
  prerequisites: JobRole[];
  careerProgression: JobRole[];
  complianceDeadlines: {
    courseId: string;
    deadlineDays: number;
    recurring: boolean;
  }[];
}

// Role Competency Framework
export interface RoleCompetency {
  id: string;
  jobRole: JobRole;
  competency: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredCourses: string[];
  assessmentCriteria: string[];
  validationMethod: 'quiz' | 'project' | 'simulation' | 'peer_review';
}
