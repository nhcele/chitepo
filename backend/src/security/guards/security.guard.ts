import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityService } from '../security.service';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly securityService: SecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    
    // Extract security context
    const securityContext = this.securityService.extractSecurityContext(request);
    
    // Add request ID to response headers
    response.setHeader('X-Request-ID', securityContext.requestId);
    
    // Add security headers
    const securityHeaders = this.securityService.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.setHeader(key, value);
    });
    
    // IP-based security check
    if (!this.securityService.isIpAllowed(securityContext.ipAddress)) {
      await this.logSecurityEvent(
        AuditAction.ACCESS_DENIED,
        AuditResource.AUTH,
        securityContext,
        undefined,
        { reason: 'IP blocked', ipAddress: securityContext.ipAddress },
        false,
        'Access denied: IP address not allowed',
      );
      
      response.status(403).json({
        message: 'Access denied',
        code: 'IP_BLOCKED',
      });
      return false;
    }
    
    // Check for audit metadata
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );
    
    if (auditOptions) {
      // Store audit options for later use in interceptor
      request.auditOptions = auditOptions;
      request.securityContext = securityContext;
      request.requestStartTime = startTime;
    }
    
    return true;
  }
  
  private async logSecurityEvent(
    action: AuditAction,
    resource: AuditResource,
    securityContext: any,
    resourceId?: string,
    details?: any,
    success: boolean = true,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.securityService.logAudit(
        action,
        resource,
        securityContext,
        resourceId,
        details,
        success,
        errorMessage,
      );
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }
}
