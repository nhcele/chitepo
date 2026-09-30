import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsUUID, IsObject, IsInt, Min } from 'class-validator';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer'
}

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  AUTO_SUBMITTED = 'auto_submitted',
  PENDING_GRADING = 'pending_grading',
  GRADED = 'graded',
  FINALIZED = 'finalized',
  ABANDONED = 'abandoned'
}

export enum AttemptItemGradingStatus {
  UNANSWERED = 'unanswered',
  AUTO_GRADED = 'auto_graded',
  PENDING_MANUAL = 'pending_manual',
  MANUALLY_GRADED = 'manually_graded'
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  timeLimitMinutes?: number | null;
  randomizeQuestions: boolean;
  maxAttempts: number;
  retakeCooldownHours: number;
  isPublished: boolean;
  source?: 'manual' | 'ai';
  aiProvider?: string | null;
  aiModel?: string | null;
  aiGeneratedAt?: Date | string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | string | null;
  questions?: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  objectiveId?: string | null;
  bankItemId?: string | null;
  type: QuestionType;
  stem: string; // The question text
  options?: string[]; // For multiple choice
  correctAnswer: string | number | (string | number)[]; // Index(es) for MC, text for short answer
  explanation?: string;
  points: number;
  difficulty?: string | null;
  tags?: string[] | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningObjective {
  id: string;
  courseId: string;
  code?: string | null;
  title: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionBankItem {
  id: string;
  courseId: string;
  objectiveId?: string | null;
  questionType: QuestionType;
  questionText: string;
  options?: string[] | null;
  correctAnswer: string;
  explanation?: string | null;
  points: number;
  difficulty?: string | null;
  tags?: string[] | null;
  status: 'active' | 'archived';
  source: 'manual' | 'ai';
  objective?: LearningObjective | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  status: AttemptStatus;
  attemptNumber: number;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  answers: QuizAnswer[];
  startedAt: Date;
  deadlineAt?: Date | null;
  submittedAt?: Date | null;
  completedAt?: Date | null;
  lastSavedAt?: Date | null;
  timeSpentSeconds: number;
}

export interface AttemptItem {
  id: string;
  attemptId: string;
  questionId: string;
  objectiveId?: string | null;
  bankItemId?: string | null;
  orderIndex: number;
  type: QuestionType;
  stem: string;
  options?: string[];
  points: number;
  difficulty?: string | null;
  tags?: string[] | null;
  response?: string | number | (string | number)[] | null;
  responseRevision: number;
  gradingStatus: AttemptItemGradingStatus;
  isCorrect?: boolean | null;
  pointsEarned?: number | null;
  explanation?: string | null;
}

export interface ItemAnalysisRow {
  questionId: string;
  objectiveId?: string | null;
  objectiveTitle?: string | null;
  bankItemId?: string | null;
  stem: string;
  type: QuestionType;
  difficulty?: string | null;
  tags?: string[] | null;
  attempts: number;
  responses: number;
  correct: number;
  correctRate: number;
  averagePoints: number;
  maxPoints: number;
}

export interface ObjectiveAnalysisRow {
  objectiveId: string | null;
  objectiveTitle: string;
  questionCount: number;
  attempts: number;
  responses: number;
  correct: number;
  correctRate: number;
  averagePoints: number;
}

export interface QuizItemAnalysis {
  quizId: string;
  items: ItemAnalysisRow[];
  objectives: ObjectiveAnalysisRow[];
}

export interface AssessmentAttemptView {
  attempt: QuizAttempt;
  items: AttemptItem[];
  serverTime: string;
  remainingSeconds: number | null;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | number | (string | number)[];
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

  @IsOptional()
  @IsUUID()
  objectiveId?: string;

  @IsOptional()
  @IsUUID()
  bankItemId?: string;

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

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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
  answers: Record<string, string | number | (string | number)[]>;
}

export class StartAssessmentAttemptDto {
  @IsUUID()
  quizId: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class SaveAttemptAnswerDto {
  @IsOptional()
  answer?: string | number | (string | number)[] | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedRevision?: number;
}
