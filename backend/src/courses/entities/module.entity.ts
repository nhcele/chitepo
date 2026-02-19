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
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id', nullable: true })
  courseId: string | null;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  summary: string;

  @Column({ name: 'author_id', nullable: true })
  authorId: string | null;

  @Column({ nullable: true })
  thumbnail: string | null;

  @Column({ name: 'estimated_duration_min', type: 'int', nullable: true })
  estimatedDurationMin: number | null;

  @Column('json', { nullable: true })
  tags: string[] | null;

  @Column({ type: 'enum', enum: ['public', 'private', 'shared'], default: 'private' })
  visibility: 'public' | 'private' | 'shared';

  @Column({ name: 'order_index' })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => Lesson, (lesson) => lesson.module, { cascade: true })
  lessons: Lesson[];
}
