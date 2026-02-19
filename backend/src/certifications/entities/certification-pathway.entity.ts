import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserCertification } from './user-certification.entity';

export enum PathwayType {
  GENERAL_EDUCATION = 'general_education',
  GOVERNMENT_OFFICIALS = 'government_officials',
  DIASPORA_ENGAGEMENT = 'diaspora_engagement',
  YOUTH_LEADERSHIP = 'youth_leadership',
  WOMENS_LEADERSHIP = 'womens_leadership',
  SPECIALIST = 'specialist',
}

@Entity('certification_pathways')
export class CertificationPathway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PathwayType,
  })
  type: PathwayType;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  level: number; // 0-5

  @Column({ name: 'level_title' })
  levelTitle: string; // e.g., "Certificate in Political Ideology"

  @Column({ name: 'estimated_duration_weeks' })
  estimatedDurationWeeks: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column('json', { name: 'required_courses', nullable: true })
  requiredCourses: string[] | null; // Array of course IDs

  @Column({ name: 'minimum_courses', default: 0 })
  minimumCourses: number;

  @Column({ name: 'pass_percentage', default: 50 })
  passPercentage: number;

  @Column('json', { nullable: true })
  requirements: string[] | null; // Array of requirement descriptions

  @Column('text', { nullable: true })
  outcome: string; // What you get upon completion

  @Column({ name: 'is_mandatory', default: false })
  isMandatory: boolean;

  @Column({ name: 'mandatory_for', nullable: true })
  mandatoryFor: string; // e.g., "Parliamentary candidates"

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'order_index', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserCertification, (userCert) => userCert.pathway)
  userCertifications: UserCertification[];
}

