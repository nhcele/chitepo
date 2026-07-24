import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lesson } from './lesson.entity';

@Entity('lesson_progress')
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ name: 'watch_percent', type: 'int', default: 0 })
  watchPercent: number;

  @Column({ name: 'best_quiz_score', type: 'int', nullable: true })
  bestQuizScore?: number;

  @Column({ name: 'quiz_attempts', type: 'int', default: 0 })
  quizAttempts: number;

  @Column({ name: 'last_quiz_attempt_at', type: 'timestamp', nullable: true })
  lastQuizAttemptAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
