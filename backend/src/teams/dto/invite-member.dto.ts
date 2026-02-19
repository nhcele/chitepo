import { IsString, IsEmail, IsOptional, IsEnum, IsArray, MaxLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { InvitationRole } from '../entities/team-invitation.entity';

export class MemberPermissionsDto {
  @IsOptional()
  canInviteMembers?: boolean = false;

  @IsOptional()
  canRemoveMembers?: boolean = false;

  @IsOptional()
  canViewReports?: boolean = true;

  @IsOptional()
  canManageLicenses?: boolean = false;
}

export class InviteMemberDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  lastName?: string;

  @IsOptional()
  @IsEnum(InvitationRole, { message: 'Invalid role specified' })
  role?: InvitationRole = InvitationRole.MEMBER;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemberPermissionsDto)
  permissions?: MemberPermissionsDto;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Department cannot exceed 255 characters' })
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Job title cannot exceed 255 characters' })
  jobTitle?: string;
}

export class BulkInviteMembersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteMemberDto)
  members: InviteMemberDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Default message cannot exceed 500 characters' })
  defaultMessage?: string;

  @IsOptional()
  @IsEnum(InvitationRole, { message: 'Invalid default role specified' })
  defaultRole?: InvitationRole = InvitationRole.MEMBER;
}
