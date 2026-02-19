import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SecurityService } from '../security.service';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  constructor(private readonly securityService: SecurityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const auditOptions = request.auditOptions;
    const securityContext = request.securityContext;
    const startTime = request.requestStartTime || Date.now();
    
    if (!auditOptions || !securityContext) {
      return next.handle();
    }

    let resourceId: string | undefined;
    let details: any = {};

    // Extract resource ID from URL parameters
    if (auditOptions.resourceIdParam) {
      resourceId = request.params[auditOptions.resourceIdParam];
    }

    // Extract details from request body
    if (auditOptions.detailsFromBody && request.body) {
      auditOptions.detailsFromBody.forEach(field => {
        if (request.body[field] !== undefined) {
          details[field] = request.body[field];
        }
      });
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const responseTime = Date.now() - startTime;
          
          // Include response data in audit if requested
          if (auditOptions.logResponse && responseData) {
            details.response = responseData;
          }

          await this.securityService.logAudit(
            auditOptions.action,
            auditOptions.resource,
            securityContext,
            resourceId,
            details,
            true, // Success
            undefined, // No error message
            responseTime,
          );

          // Add audit info to response headers (for debugging)
          response.setHeader('X-Audit-Logged', 'true');
          response.setHeader('X-Response-Time', `${responseTime}ms`);
        } catch (error) {
          this.logger.error('Failed to log successful audit:', error);
        }
      }),
      catchError(async (error) => {
        try {
          const responseTime = Date.now() - startTime;
          
          await this.securityService.logAudit(
            auditOptions.action,
            auditOptions.resource,
            securityContext,
            resourceId,
            {
              ...details,
              error: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            false, // Failed
            error.message,
            responseTime,
          );
        } catch (auditError) {
          this.logger.error('Failed to log error audit:', auditError);
        }
        
        throw error;
      }),
    );
  }
}
