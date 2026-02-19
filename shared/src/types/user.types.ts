import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum UserRole {
  LEARNER = 'learner',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Job Roles and Banking Positions
export enum JobRole {
  // Frontline Roles
  TELLER = 'teller',
  CUSTOMER_SERVICE_REP = 'customer_service_rep',
  PERSONAL_BANKER = 'personal_banker',
  
  // Operations & Support
  OPERATIONS_CLERK = 'operations_clerk',
  COMPLIANCE_OFFICER = 'compliance_officer',
  RISK_ANALYST = 'risk_analyst',
  CREDIT_ANALYST = 'credit_analyst',
  
  // Technology
  IT_SUPPORT = 'it_support',
  SYSTEMS_ADMINISTRATOR = 'systems_administrator',
  CYBERSECURITY_ANALYST = 'cybersecurity_analyst',
  
  // Management
  BRANCH_MANAGER = 'branch_manager',
  OPERATIONS_MANAGER = 'operations_manager',
  COMPLIANCE_MANAGER = 'compliance_manager',
  RISK_MANAGER = 'risk_manager',
  
  // Executive
  CEO = 'ceo',
  CFO = 'cfo',
  CTO = 'cto',
  CCO = 'cco', // Chief Compliance Officer
  CRO = 'cro', // Chief Risk Officer
}

// Role Categories for Grouping
export enum RoleCategory {
  FRONTLINE = 'frontline',
  OPERATIONS = 'operations',
  TECHNOLOGY = 'technology',
  MANAGEMENT = 'management',
  EXECUTIVE = 'executive',
  COMPLIANCE = 'compliance',
  RISK = 'risk'
}

// Role Level Hierarchy
export enum RoleLevel {
  STAFF = 'staff',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive'
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  jobTitle?: string;
  skillInterests?: string[];
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  skillInterests?: string[];

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.LEARNER;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  skillInterests?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
