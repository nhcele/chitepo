import { IsString, IsOptional } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  groupId: string;

  @IsString()
  @IsOptional()
  joinReason?: string; // For groups requiring approval
}

export class ApproveJoinRequestDto {
  @IsString()
  membershipId: string;

  @IsString()
  groupId: string;
}

export class InviteToGroupDto {
  @IsString()
  groupId: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  message?: string;
}


