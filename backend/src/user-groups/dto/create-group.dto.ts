import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { GroupType, GroupPrivacy } from '../entities/user-group.entity';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GroupType)
  type: GroupType;

  @IsEnum(GroupPrivacy)
  @IsOptional()
  privacy?: GroupPrivacy;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsOptional()
  maxMembers?: number;

  @IsBoolean()
  @IsOptional()
  allowJoinRequests?: boolean;

  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @IsObject()
  @IsOptional()
  meetingSchedule?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: string;
    time?: string;
    location?: string;
    virtual?: boolean;
  };

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  focusAreas?: string[];

  @IsString()
  @IsOptional()
  parentGroupId?: string; // For hierarchical structures
}


