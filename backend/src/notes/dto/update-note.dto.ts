import { IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  videoTimestampSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
