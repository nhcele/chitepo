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
