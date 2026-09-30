import { IsOptional, IsString, IsUUID, IsInt, Min, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  videoTimestampSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
