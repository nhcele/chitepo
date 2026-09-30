import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AttemptStatus } from '@mindelta/shared';
import { User } from '../../users/entities/user.entity';
import { Quiz } from './quiz.entity';
import { AttemptItem } from './attempt-item.entity';

@Entity('quiz_attempts')
@Index('IDX_quiz_attempts_user_quiz_status', ['userId', 'quizId', 'status'])
@Index('IDX_quiz_attempts_user_quiz_created', ['userId', 'quizId', 'createdAt'])
@Index('IDX_quiz_attempts_deadline', ['status', 'deadlineAt'])
@Index('IDX_quiz_attempts_user_quiz_number', ['userId', 'quizId', 'attemptNumber'], { unique: true })
@Index('IDX_quiz_attempts_idempotency_key', ['idempotencyKey'], { unique: true })
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS,
  })
  status: AttemptStatus;

  @Column({ name: 'attempt_number', type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @Column({ name: 'max_score', type: 'decimal', precision: 8, scale: 2, nullable: true })
  maxScore: number | null;

  @Column({ nullable: true })
  passed: boolean | null;

  @Column('json')
  answers: {
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    pointsEarned: number;
  }[];

  @Column({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'deadline_at', type: 'timestamp', nullable: true })
  deadlineAt: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'last_saved_at', type: 'timestamp', nullable: true })
  lastSavedAt: Date | null;

  @Column({ name: 'idempotency_key', length: 128, nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'time_spent_seconds', default: 0 })
  timeSpentSeconds: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @OneToMany(() => AttemptItem, (item) => item.attempt, { cascade: true })
  items: AttemptItem[];
}
