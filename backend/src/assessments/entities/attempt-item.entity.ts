import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttemptItemGradingStatus, QuestionType } from '@mindelta/shared';
import { QuizAttempt } from './quiz-attempt.entity';
import { Question } from './question.entity';

export interface AttemptQuestionSnapshot {
  questionId: string;
  objectiveId?: string | null;
  bankItemId?: string | null;
  questionType: QuestionType;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | number | null;
  explanation: string | null;
  points: number;
  difficulty?: string | null;
  tags?: string[] | null;
  version: number;
}

@Entity('attempt_items')
@Index('IDX_attempt_items_attempt_id', ['attemptId'])
@Index('IDX_attempt_items_attempt_question', ['attemptId', 'questionId'], { unique: true })
export class AttemptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attempt_id' })
  attemptId: string;

  @Column({ name: 'question_id', nullable: true })
  questionId: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ type: 'json' })
  snapshot: AttemptQuestionSnapshot;

  @Column({ name: 'response', type: 'text', nullable: true })
  response: string | null;

  @Column({ name: 'response_revision', type: 'int', default: 0 })
  responseRevision: number;

  @Column({
    name: 'grading_status',
    type: 'enum',
    enum: AttemptItemGradingStatus,
    default: AttemptItemGradingStatus.UNANSWERED,
  })
  gradingStatus: AttemptItemGradingStatus;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @Column({ name: 'points_earned', type: 'decimal', precision: 8, scale: 2, nullable: true })
  pointsEarned: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => QuizAttempt, (attempt) => attempt.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: QuizAttempt;

  @ManyToOne(() => Question, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'question_id' })
  question: Question | null;
}
