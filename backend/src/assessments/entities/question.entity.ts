import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestionType } from '@mindelta/shared';
import { Quiz } from './quiz.entity';
import { LearningObjective } from './learning-objective.entity';
import { QuestionBankItem } from './question-bank-item.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @Column({ name: 'objective_id', nullable: true })
  objectiveId: string | null;

  @Column({ name: 'bank_item_id', nullable: true })
  bankItemId: string | null;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  questionType: QuestionType;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string; // The question text

  @Column('json', { nullable: true })
  options: string[]; // For multiple choice

  @Column({ name: 'correct_answer' })
  correctAnswer: string; // Index for MC, text for short answer

  @Column('text', { nullable: true })
  explanation: string;

  @Column({ default: 1 })
  points: number;

  @Column({ nullable: true })
  difficulty: string | null;

  @Column('json', { nullable: true })
  tags: string[] | null;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @ManyToOne(() => LearningObjective, (objective) => objective.questions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'objective_id' })
  objective: LearningObjective | null;

  @ManyToOne(() => QuestionBankItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bank_item_id' })
  bankItem: QuestionBankItem | null;
}
