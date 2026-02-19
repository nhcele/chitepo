import { IsString, IsOptional, IsEnum, IsNumber, IsObject, MaxLength } from 'class-validator';

export enum ChatMode {
  ANSWER = 'answer',
  SUMMARIZE = 'summarize',
  EXPLAIN = 'explain'
}

export class ChatRagDto {
  @IsString()
  lessonId: string;

  @IsEnum(ChatMode)
  mode: ChatMode;

  @IsOptional()
  @IsNumber()
  @IsEnum([5, 15, 25])
  level?: 5 | 15 | 25;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class UsageStatsDto {
  @IsNumber()
  totalRequests: number;

  @IsNumber()
  remainingRequests: number;

  @IsNumber()
  resetTime: number;

  @IsString()
  timeframe: string;
}

export class ExplainConceptDto {
  @IsString()
  @MaxLength(200)
  concept: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  context?: string;
}

export class FeedbackDto {
  @IsString()
  lessonId: string;

  @IsString()
  @MaxLength(2000)
  feedback: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  category?: string;
}

export class LearningPathDto {
  @IsString()
  @MaxLength(100)
  topic: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  level?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class QuizQuestionDto {
  @IsString()
  lessonId: string;

  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;
}

export class SummarizeContentDto {
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  summaryType?: string;

  @IsOptional()
  @IsNumber()
  maxLength?: number;
}
