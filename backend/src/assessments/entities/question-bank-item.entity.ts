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
import { QuestionType } from '@mindelta/shared';
import { Course } from '../../courses/entities/course.entity';
import { LearningObjective } from './learning-objective.entity';

@Entity('question_bank_items')
@Index('IDX_question_bank_items_course', ['courseId'])
@Index('IDX_question_bank_items_objective', ['objectiveId'])
export class QuestionBankItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'objective_id', nullable: true })
  objectiveId: string | null;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  questionType: QuestionType;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column('json', { nullable: true })
  options: string[] | null;

  @Column({ name: 'correct_answer' })
  correctAnswer: string;

  @Column('text', { nullable: true })
  explanation: string | null;

  @Column({ default: 1 })
  points: number;

  @Column({ nullable: true })
  difficulty: string | null;

  @Column('json', { nullable: true })
  tags: string[] | null;

  @Column({ default: 'active' })
  status: 'active' | 'archived';

  @Column({ default: 'manual' })
  source: 'manual' | 'ai';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => LearningObjective, (objective) => objective.bankItems, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'objective_id' })
  objective: LearningObjective | null;
}
