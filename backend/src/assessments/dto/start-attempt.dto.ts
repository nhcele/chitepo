import { IsOptional, IsString, IsUUID } from 'class-validator';

export class StartAttemptDto {
  @IsUUID()
  quizId: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
