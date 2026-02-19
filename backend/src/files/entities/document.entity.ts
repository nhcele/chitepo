import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '@mindelta/shared';

export enum DocumentState {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('document_resources')
@Index(['tenantId', 'state', 'createdAt'])
@Index(['tenantId', 'ownerId', 'createdAt'])
export class DocumentResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 36, nullable: true })
  tenantId: string;

  @Column({ name: 'title', type: 'varchar', length: 512 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'tags', type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ name: 'owner_id', type: 'varchar', length: 36, nullable: true })
  ownerId?: string;

  @Column({ name: 'department', type: 'varchar', length: 255, nullable: true })
  department?: string;

  @Column({ name: 'retention_until', type: 'timestamp', nullable: true })
  retentionUntil?: Date;

  @Column({ name: 'classification', type: 'varchar', length: 64, nullable: true })
  classification?: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'checksum', type: 'varchar', length: 256, nullable: true })
  checksum?: string;

  @Column({ name: 'source', type: 'varchar', length: 128, nullable: true })
  source?: string;

  @Column({ name: 'access_roles', type: 'simple-array', nullable: true })
  accessRoles?: UserRole[];

  @Column({ name: 'access_departments', type: 'simple-array', nullable: true })
  accessDepartments?: string[];

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'file_key', type: 'text', nullable: true })
  fileKey?: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 255, nullable: true })
  mimeType?: string;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes?: number;

  @Column({ name: 'state', type: 'enum', enum: DocumentState, default: DocumentState.ACTIVE })
  state: DocumentState;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'text_content', type: 'text', nullable: true })
  textContent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
