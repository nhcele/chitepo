import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'certificate_url', nullable: true })
  certificateUrl: string;

  @Column({ name: 'blockchain_tx_hash', nullable: true })
  blockchainTxHash: string; // Blockchain transaction hash

  @Column({ name: 'ipfs_hash', nullable: true })
  ipfsHash: string; // IPFS metadata hash

  @Column({ name: 'serial_number', nullable: true })
  serial: string;

  @Column({ name: 'final_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  finalScore: number;

  @Column('json', { nullable: true, name: 'skills_tags' })
  skillsTags: string[];

  @Column({ name: 'issued_at' })
  issuedAt: Date;

  @Column({ name: 'verified_at', nullable: true })
  verifiedAt: Date;

  // Computed/virtual properties
  get txHash(): string {
    return this.blockchainTxHash;
  }

  // Relations
  @ManyToOne(() => User, (user) => user.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, (course) => course.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;
}
