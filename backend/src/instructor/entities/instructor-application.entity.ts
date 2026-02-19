import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum InstructorApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('instructor_applications')
export class InstructorApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', length: 200 })
  fullName!: string;

  @Column({ length: 200 })
  email!: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'sample_video_url', type: 'text', nullable: true })
  sampleVideoUrl?: string;

  @Column({ type: 'json', nullable: true })
  socials?: any;

  @Column({ name: 'agree_tos', default: false })
  agreeTos!: boolean;

  @Column({ name: 'agree_ownership', default: false })
  agreeOwnership!: boolean;

  @Column({ name: 'agree_revenue_share', default: false })
  agreeRevenueShare!: boolean;

  @Column({ type: 'enum', enum: InstructorApplicationStatus, default: InstructorApplicationStatus.PENDING })
  status!: InstructorApplicationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
