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
import { CourseStatus, CourseDifficulty, CourseCategory } from '@mindelta/shared';
import { User } from '../../users/entities/user.entity';
import { Module } from './module.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { TeamLicense } from '../../teams/entities/team-license.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column('text')
  description: string;

  @Column('json', { nullable: true })
  tags: string[] | null;

  @Column('json', { nullable: true })
  skills: string[] | null;

  @Column({ name: 'trailer_video_url', nullable: true })
  trailerVideoUrl: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @Column({ name: 'instructor_id' })
  instructorId: string;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({
    type: 'enum',
    enum: CourseDifficulty,
    default: CourseDifficulty.BEGINNER,
  })
  difficulty: CourseDifficulty;

  @Column({
    type: 'enum',
    enum: CourseCategory,
    nullable: true,
  })
  category: CourseCategory;

  @Column({ name: 'estimated_duration', default: 0 })
  estimatedDuration: number; // in minutes

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @Column({ name: 'total_enrollments', default: 0 })
  totalEnrollments: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed/virtual properties
  get published(): boolean {
    return this.status === CourseStatus.PUBLISHED;
  }

  // Relations
  @ManyToOne(() => User, (user) => user.coursesCreated)
  @JoinColumn({ name: 'instructor_id' })
  instructor: User;

  @OneToMany(() => Module, (module) => module.course, { cascade: true })
  modules: Module[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => Certificate, (certificate) => certificate.course)
  certificates: Certificate[];

  @OneToMany(() => TeamLicense, (teamLicense) => teamLicense.course)
  teamLicenses: TeamLicense[];
}
