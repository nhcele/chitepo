import { IsString, IsOptional, IsEnum, IsEmail, IsUrl, MaxLength, MinLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TeamSize } from '../entities/team.entity';

export class TeamSettingsDto {
  @IsOptional()
  allowSelfEnrollment?: boolean = true;

  @IsOptional()
  requireApproval?: boolean = false;

  @IsOptional()
  defaultLearningPath?: string;

  @IsOptional()
  customBranding?: boolean = false;

  @IsOptional()
  @IsEnum(['weekly', 'monthly', 'quarterly'])
  reportingFrequency?: 'weekly' | 'monthly' | 'quarterly' = 'monthly';
}

export class CreateTeamDto {
  @IsString()
  @MinLength(2, { message: 'Team name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Team name cannot exceed 255 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Industry cannot exceed 255 characters' })
  industry?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @MaxLength(255, { message: 'Website cannot exceed 255 characters' })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Logo URL cannot exceed 500 characters' })
  logo?: string;

  @IsOptional()
  @IsEnum(TeamSize, { message: 'Invalid team size' })
  size?: TeamSize = TeamSize.SMALL;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamSettingsDto)
  settings?: TeamSettingsDto;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Billing email cannot exceed 255 characters' })
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Contact phone cannot exceed 255 characters' })
  contactPhone?: string;
}
