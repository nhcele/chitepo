import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Lesson } from '../../courses/entities/lesson.entity';

@Entity('notes')
@Index(['userId', 'courseId'])
@Index(['userId', 'lessonId'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  courseId?: string;

  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  lessonId?: string;

  @Column({ name: 'video_timestamp_seconds', type: 'int', nullable: true })
  videoTimestampSeconds?: number;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @ManyToOne(() => Lesson, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Lesson;
}
