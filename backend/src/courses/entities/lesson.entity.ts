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
import { Module } from './module.entity';
import { Quiz } from '../../assessments/entities/quiz.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id' })
  moduleId: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  content: string; // For text/HTML lessons

  @Column({ name: 'video_url', nullable: true })
  videoUrl: string;

  @Column({ name: 'video_duration', nullable: true })
  videoDuration: number;

  @Column({ name: 'lesson_type', nullable: true, default: 'video' })
  type: string;

  @Column({ name: 'is_preview', default: false })
  isPreview: boolean;

  @Column({ name: 'transcript', type: 'text', nullable: true })
  transcript: string;

  @Column({ name: 'captions_url', type: 'varchar', length: 500, nullable: true })
  captionsUrl: string | null;

  @Column({ name: 'resource_links', type: 'json', nullable: true })
  resourceLinks: Array<{ title: string; url: string }> | null;

  @Column({ name: 'completion_mode', nullable: true, default: 'required' })
  completionMode: 'required' | 'optional' | 'manual';

  @Column({ name: 'minimum_watch_percent', type: 'int', nullable: true })
  minimumWatchPercent: number | null;

  @Column({ name: 'minimum_quiz_score', type: 'int', nullable: true })
  minimumQuizScore: number | null;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'has_quiz', default: false })
  hasQuiz: boolean;

  // Computed/virtual properties
  get durationSeconds(): number {
    return this.videoDuration;
  }

  get contentUrl(): string {
    return this.videoUrl || this.content;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Module, (module) => module.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @OneToMany(() => Quiz, (quiz) => quiz.lesson)
  quizzes: Quiz[];
}
