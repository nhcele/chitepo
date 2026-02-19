import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_gamification')
export class UserGamification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36, unique: true })
  userId: string;

  @Column({ name: 'points', type: 'int', default: 0 })
  points: number;

  @Column({ name: 'badges', type: 'json', nullable: true })
  badges: Array<{ code: string; awardedAt: string }>;

  @Column({ name: 'stats', type: 'json', nullable: true })
  stats: { lessons: number; courses: number; liveSessions: number } | null;

  @Column({ name: 'last_aggregated_at', type: 'timestamp', nullable: true })
  lastAggregatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
