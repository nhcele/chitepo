import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsUUID, IsObject } from 'class-validator';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer'
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  randomizeQuestions: boolean;
  maxAttempts: number;
  retakeCooldownHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  stem: string; // The question text
  options?: string[]; // For multiple choice
  correctAnswer: string | number; // Index for MC, text for short answer
  explanation?: string;
  points: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  answers: QuizAnswer[];
  startedAt: Date;
  completedAt?: Date;
  timeSpentSeconds: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  pointsEarned: number;
}

export class CreateQuizDto {
  @IsUUID()
  lessonId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  passingScore: number = 70;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean = false;

  @IsOptional()
  @IsNumber()
  maxAttempts?: number = 3;

  @IsOptional()
  @IsNumber()
  retakeCooldownHours?: number = 24;
}

export class CreateQuestionDto {
  @IsUUID()
  quizId: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  stem: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsString()
  correctAnswer: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsNumber()
  points: number = 1;

  @IsNumber()
  orderIndex: number;
}

export class SubmitQuizDto {
  @IsUUID()
  quizId: string;

  @IsArray()
  answers: {
    questionId: string;
    answer: string | number;
  }[];
}

export class SubmitQuizAttemptDto {
  @IsUUID()
  quizId: string;

  @IsObject()
  answers: Record<string, string | number>;
}
