import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog, AuditAction, AuditResource } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';
// import * as sanitizeHtml from 'sanitize-html'; // Temporarily commented until npm install is run
import { Request } from 'express';

export interface SecurityContext {
  user?: User;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  requestId?: string;
}

@Injectable()
export class SecurityService {
  private readonly sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'ssn', 'socialSecurityNumber', 'creditCard', 'bankAccount'
  ];

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private configService: ConfigService,
  ) {}

  // Audit Logging
  async logAudit(
    action: AuditAction,
    resource: AuditResource,
    context: SecurityContext,
    resourceId?: string,
    details?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string,
    responseTimeMs?: number,
  ): Promise<void> {
    try {
      // Sanitize sensitive data from details
      const sanitizedDetails = this.sanitizeLogData(details);

      const auditLog = this.auditLogRepository.create({
        userId: context.user?.id,
        action,
        resource,
        resourceId,
        details: sanitizedDetails,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        success,
        errorMessage,
        responseTimeMs,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log audit failures to console but don't throw to avoid breaking main flow
      console.error('Failed to create audit log:', error);
    }
  }

  // Temporary HTML sanitization function (fallback until sanitize-html is installed)
  private sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<input\b[^>]*>/gi, '')
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
      .trim();
  }

  // Input Validation and Sanitization
  validateAndSanitizeInput(data: any, allowedFields?: string[]): any {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid input data');
    }

    // Remove fields not in whitelist if provided
    if (allowedFields) {
      const sanitized = {};
      allowedFields.forEach(field => {
        if (data.hasOwnProperty(field)) {
          sanitized[field] = this.sanitizeFieldValue(data[field]);
        }
      });
      return sanitized;
    }

    // Sanitize all fields
    const sanitized = {};
    Object.keys(data).forEach(key => {
      sanitized[key] = this.sanitizeFieldValue(data[key]);
    });

    return sanitized;
  }

  private sanitizeFieldValue(value: any): any {
    if (typeof value === 'string') {
      // Basic XSS protection using temporary sanitization
      // TODO: Replace with sanitize-html library after npm install
      return this.sanitizeHtml(value).substring(0, 10000); // Limit length
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeFieldValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      Object.keys(value).forEach(key => {
        sanitized[key] = this.sanitizeFieldValue(value[key]);
      });
      return sanitized;
    }

    return value;
  }

  // SQL Injection Protection
  validateSqlInput(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|;|\/\*|\*\/|xp_|sp_)/i,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i,
    ];

    return !sqlPatterns.some(pattern => pattern.test(input));
  }

  // Rate Limiting Check
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    resource: string,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    // This would integrate with Redis for distributed rate limiting
    // For now, return allowed (actual implementation would use Redis)
    const resetTime = new Date(Date.now() + windowMs);
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetTime,
    };
  }

  // IP-based Security
  isIpAllowed(ipAddress: string): boolean {
    const blockedIps = this.configService.get<string[]>('BLOCKED_IPS') || [];
    const allowedIps = this.configService.get<string[]>('ALLOWED_IPS') || [];
    
    if (blockedIps.includes(ipAddress)) {
      return false;
    }
    
    if (allowedIps.length > 0 && !allowedIps.includes(ipAddress)) {
      return false;
    }
    
    return true;
  }

  // Security Headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': this.getCSP(),
    };
  }

  private getCSP(): string {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const frontendOrigin = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline/eval for dev tools
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      `connect-src 'self' ${frontendOrigin} http://127.0.0.1:3000`,
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    if (isDev) {
      directives.push("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    }

    return directives.join('; ');
  }

  // Data sanitization for logs
  private sanitizeLogData(data: Record<string, any>): Record<string, any> {
    if (!data) return {};

    const sanitized = {};
    Object.keys(data).forEach(key => {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof data[key] === 'string') {
        sanitized[key] = data[key].substring(0, 500); // Limit log entry length
      } else {
        sanitized[key] = data[key];
      }
    });

    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    return this.sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  // Generate secure request ID
  generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Extract security context from request
  extractSecurityContext(req: Request): SecurityContext {
    return {
      user: req.user as User,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('User-Agent') || '',
      sessionId: (req as any).sessionID || (req as any).session?.id || req.headers['x-session-id'] as string,
      requestId: req.headers['x-request-id'] as string || this.generateRequestId(),
    };
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }

  // Audit log queries
  async getAuditLogs(
    userId?: string,
    action?: AuditAction,
    resource?: AuditResource,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    if (resource) {
      queryBuilder.andWhere('audit.resource = :resource', { resource });
    }

    const [logs, total] = await queryBuilder
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { logs, total };
  }

  // Security analytics
  async getSecurityAnalytics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalRequests: number;
    failedRequests: number;
    uniqueIps: number;
    topActions: Array<{ action: string; count: number }>;
    suspiciousActivity: Array<{ type: string; count: number; details: any }>;
  }> {
    const timeOffset = this.getTimeOffset(timeframe);
    
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :timeOffset', { timeOffset });

    const totalRequests = await queryBuilder.getCount();
    
    const failedRequests = await queryBuilder
      .andWhere('audit.success = :success', { success: false })
      .getCount();

    const uniqueIps = await queryBuilder
      .select('COUNT(DISTINCT audit.ipAddress)')
      .getRawOne()
      .then(result => parseInt(Object.values(result)[0] as string));

    const topActions = await queryBuilder
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const suspiciousActivity = await this.detectSuspiciousActivity(timeOffset);

    return {
      totalRequests,
      failedRequests,
      uniqueIps,
      topActions,
      suspiciousActivity,
    };
  }

  private async detectSuspiciousActivity(timeOffset: Date): Promise<Array<{ type: string; count: number; details: any }>> {
    const suspicious = [];

    // Detect rate limit exceeded
    const rateLimitExceeded = await this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :timeOffset', { timeOffset })
      .andWhere('audit.action = :action', { action: AuditAction.RATE_LIMIT_EXCEEDED })
      .getCount();

    if (rateLimitExceeded > 0) {
      suspicious.push({
        type: 'Rate Limit Exceeded',
        count: rateLimitExceeded,
        details: { threshold: 'Multiple attempts detected' }
      });
    }

    // Detect access denied patterns
    const accessDenied = await this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :timeOffset', { timeOffset })
      .andWhere('audit.action = :action', { action: AuditAction.ACCESS_DENIED })
      .groupBy('audit.ipAddress')
      .having('COUNT(*) > 10')
      .getCount();

    if (accessDenied > 0) {
      suspicious.push({
        type: 'Suspicious Access Patterns',
        count: accessDenied,
        details: { threshold: 'Multiple access denied from same IP' }
      });
    }

    return suspicious;
  }

  private getTimeOffset(timeframe: 'hour' | 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}
