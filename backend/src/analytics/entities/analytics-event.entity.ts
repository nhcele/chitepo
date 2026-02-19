import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AnalyticsEventType } from '@mindelta/shared';
import { User } from '../../users/entities/user.entity';

@Entity('analytics_events')
@Index(['userId', 'eventType', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 100,
  })
  eventType: string;

  @Column({ name: 'event_data', type: 'json', nullable: true })
  eventData: Record<string, any> | null;

  @Column({ name: 'course_id', nullable: true })
  courseId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Computed/virtual properties
  get timestamp(): Date {
    return this.createdAt;
  }

  get metadata(): Record<string, any> | null {
    return this.eventData;
  }

  // Relations
  @ManyToOne(() => User, (user) => user.analyticsEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
