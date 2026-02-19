import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';
import { SecurityService } from './security.service';
import { AuditAction, AuditResource } from './entities/audit-log.entity';

@ApiTags('Security')
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('resource') resource?: AuditResource,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    return this.securityService.getAuditLogs(
      userId,
      action,
      resource,
      limit,
      offset,
    );
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security analytics' })
  @ApiResponse({ status: 200, description: 'Security analytics retrieved successfully' })
  async getSecurityAnalytics(
    @Query('timeframe') timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
  ) {
    return this.securityService.getSecurityAnalytics(timeframe);
  }

  @Post('test-validation')
  @ApiOperation({ summary: 'Test input validation (for development)' })
  @ApiResponse({ status: 200, description: 'Input validation test completed' })
  async testValidation(@Body() data: any) {
    const allowedFields = ['name', 'email', 'message'];
    const sanitized = this.securityService.validateAndSanitizeInput(data, allowedFields);
    
    return {
      original: data,
      sanitized,
      valid: true,
    };
  }

  @Get('headers')
  @ApiOperation({ summary: 'Get security headers configuration' })
  @ApiResponse({ status: 200, description: 'Security headers retrieved successfully' })
  getSecurityHeaders() {
    return {
      headers: this.securityService.getSecurityHeaders(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('log-security-event')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Log a custom security event' })
  @ApiResponse({ status: 201, description: 'Security event logged successfully' })
  async logSecurityEvent(
    @Request() req,
    @Body() eventData: {
      action: AuditAction;
      resource: AuditResource;
      resourceId?: string;
      details?: Record<string, any>;
      success?: boolean;
      errorMessage?: string;
    },
  ) {
    const context = this.securityService.extractSecurityContext(req);
    
    await this.securityService.logAudit(
      eventData.action,
      eventData.resource,
      context,
      eventData.resourceId,
      eventData.details,
      eventData.success ?? true,
      eventData.errorMessage,
    );

    return {
      message: 'Security event logged successfully',
      eventId: context.requestId,
    };
  }

  @Get('ip-check/:ipAddress')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Check if IP address is allowed' })
  @ApiResponse({ status: 200, description: 'IP check completed' })
  async checkIp(@Param('ipAddress') ipAddress: string) {
    const isAllowed = this.securityService.isIpAllowed(ipAddress);
    
    return {
      ipAddress,
      allowed: isAllowed,
      timestamp: new Date().toISOString(),
    };
  }
}
