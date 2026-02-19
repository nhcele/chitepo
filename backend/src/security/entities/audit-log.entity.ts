import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AI_REQUEST = 'AI_REQUEST',
  FILE_UPLOAD = 'FILE_UPLOAD',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

export enum AuditResource {
  USER = 'USER',
  COURSE = 'COURSE',
  LESSON = 'LESSON',
  ASSESSMENT = 'ASSESSMENT',
  CERTIFICATE = 'CERTIFICATE',
  AI_COMPANION = 'AI_COMPANION',
  FILE = 'FILE',
  AUTH = 'AUTH',
  ADMIN = 'ADMIN',
}

@Entity('audit_logs')
@Index(['userId', 'action', 'createdAt'])
@Index(['resource', 'resourceId', 'createdAt'])
@Index(['ipAddress', 'userAgent', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditResource,
  })
  resource: AuditResource;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'json', nullable: true })
  details: Record<string, any>;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ name: 'response_time_ms', nullable: true })
  responseTimeMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
