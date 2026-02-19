import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsUUID } from 'class-validator';

export enum CourseStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  HTML = 'html',
  EMBED = 'embed',
  DOWNLOAD = 'download'
}

export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum CourseCategory {
  // Financial Services
  BANKING = 'banking',
  INSURANCE = 'insurance',
  FINTECH = 'fintech',
  FINANCIAL_COMPLIANCE = 'financial_compliance',
  
  // Mining & Resources
  MINING = 'mining',
  GEOLOGY = 'geology',
  MINING_SAFETY = 'mining_safety',
  ENVIRONMENTAL_MANAGEMENT = 'environmental_management',
  
  // Technology
  SOFTWARE_DEVELOPMENT = 'software_development',
  DATA_SCIENCE = 'data_science',
  CYBERSECURITY = 'cybersecurity',
  CLOUD_COMPUTING = 'cloud_computing',
  
  // Business & Management
  LEADERSHIP = 'leadership',
  PROJECT_MANAGEMENT = 'project_management',
  COMPLIANCE = 'compliance',
  RISK_MANAGEMENT = 'risk_management',
  
  // Healthcare
  HEALTHCARE = 'healthcare',
  MEDICAL_COMPLIANCE = 'medical_compliance',
  PATIENT_SAFETY = 'patient_safety',
  
  // Manufacturing
  MANUFACTURING = 'manufacturing',
  QUALITY_ASSURANCE = 'quality_assurance',
  LEAN_SIX_SIGMA = 'lean_six_sigma',
  
  // Food Safety
  FOOD_SAFETY = 'food_safety',
  FOOD_DEFENSE = 'food_defense',
  
  // Professional Development
  PROFESSIONAL_DEVELOPMENT = 'professional_development',
  SOFT_SKILLS = 'soft_skills',
  COMMUNICATION = 'communication',
  
  // Legacy categories (for backward compatibility)
  CORE_IDEOLOGY = 'core_ideology',
  CONTEMPORARY_STUDIES = 'contemporary_studies',
  PRACTICAL_GOVERNANCE = 'practical_governance',
  DIASPORA_PROGRAM = 'diaspora_program'
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  tags: string[];
  trailerVideoUrl?: string;
  coverImageUrl?: string;
  instructorId: string;
  status: CourseStatus;
  difficulty: CourseDifficulty;
  category?: CourseCategory;
  estimatedDuration: number; // in minutes
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  summary?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  contentUrl?: string;
  content?: string; // For text/HTML lessons
  durationSeconds?: number;
  transcript?: string;
  orderIndex: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  lastLessonSeenAt?: Date;
  completedAt?: Date;
  enrolledAt: Date;
  updatedAt: Date;
}

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsEnum(CourseDifficulty)
  difficulty: CourseDifficulty;

  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @IsNumber()
  estimatedDuration: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  trailerVideoUrl?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(CourseDifficulty)
  difficulty?: CourseDifficulty;

  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

export class CreateModuleDto {
  @IsUUID()
  courseId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsNumber()
  orderIndex: number;
}

export class CreateLessonDto {
  @IsUUID()
  moduleId: string;

  @IsString()
  title: string;

  @IsEnum(LessonType)
  type: LessonType;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsNumber()
  orderIndex: number;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean = false;
}
