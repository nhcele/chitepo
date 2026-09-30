import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Lesson } from '../../courses/entities/lesson.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'passing_score', default: 70 })
  passingScore: number; // percentage

  @Column({ name: 'time_limit_minutes', nullable: true })
  timeLimitMinutes: number; // in minutes

  @Column({ name: 'randomize_questions', default: false })
  randomizeQuestions: boolean;

  @Column({ name: 'max_attempts', default: 0 }) // 0 => unlimited
  maxAttempts: number;

  @Column({ name: 'retake_cooldown_hours', default: 0 }) // 0 => no cooldown
  retakeCooldownHours: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ default: 'manual' })
  source: 'manual' | 'ai';

  @Column({
    type: 'enum',
    enum: ['lesson', 'knowledge_check', 'module'],
    default: 'lesson',
  })
  type: 'lesson' | 'knowledge_check' | 'module';

  @Column({ name: 'ai_provider', nullable: true })
  aiProvider: string;

  @Column({ name: 'ai_model', nullable: true })
  aiModel: string;

  @Column({ name: 'ai_generated_at', nullable: true })
  aiGeneratedAt: Date;

  @Column({ name: 'reviewed_by_id', nullable: true })
  reviewedById: string;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Lesson, (lesson) => lesson.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @OneToMany(() => Question, (question) => question.quiz, { cascade: true })
  questions: Question[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];
}
