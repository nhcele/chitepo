import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

@Entity('progress')
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course)
  course: Course;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @Column({ name: 'enrollment_id', nullable: true })
  enrollmentId?: string;

  @Column({ name: 'completed', default: false })
  completed: boolean;

  @Column({ name: 'watch_time', type: 'int', default: 0 })
  watchTime: number; // in seconds

  @Column({ name: 'last_accessed', type: 'timestamp', nullable: true })
  lastAccessed?: Date;

  @Column({ name: 'completion_date', type: 'timestamp', nullable: true })
  completionDate?: Date;

  @Column({ name: 'score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ name: 'attempts', default: 1 })
  attempts: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
