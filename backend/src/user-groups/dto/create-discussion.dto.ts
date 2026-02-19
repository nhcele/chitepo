import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateDiscussionDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CreateReplyDto {
  @IsString()
  content: string;

  @IsUUID()
  @IsOptional()
  parentReplyId?: string; // For nested replies
}


