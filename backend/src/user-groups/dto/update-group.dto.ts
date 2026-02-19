import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { GroupStatus } from '../entities/user-group.entity';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsEnum(GroupStatus)
  @IsOptional()
  status?: GroupStatus;
}


