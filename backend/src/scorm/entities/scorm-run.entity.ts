import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ScormRunStatus = 'in_progress' | 'completed';

@Entity('scorm_runs')
export class ScormRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'scorm_package_id', type: 'varchar', length: 36 })
  scormPackageId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'course_id', type: 'varchar', length: 36, nullable: true })
  courseId: string | null;

  @Column({ name: 'enrollment_id', type: 'varchar', length: 36, nullable: true })
  enrollmentId: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'in_progress' })
  status: ScormRunStatus;

  // SCORM 1.2: cmi.core.lesson_status
  @Column({ name: 'lesson_status', type: 'varchar', length: 40, nullable: true })
  lessonStatus: string | null;

  @Column({ name: 'score_raw', type: 'decimal', precision: 8, scale: 2, nullable: true })
  scoreRaw: number | null;

  @Column({ name: 'score_min', type: 'decimal', precision: 8, scale: 2, nullable: true })
  scoreMin: number | null;

  @Column({ name: 'score_max', type: 'decimal', precision: 8, scale: 2, nullable: true })
  scoreMax: number | null;

  @Column({ name: 'total_time_seconds', type: 'int', default: 0 })
  totalTimeSeconds: number;

  @Column({ name: 'cmi', type: 'json', nullable: true })
  cmi: any;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
