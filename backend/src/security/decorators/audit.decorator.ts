import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: AuditAction;
  resource: AuditResource;
  resourceIdParam?: string;
  detailsFromBody?: string[];
  logResponse?: boolean;
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
