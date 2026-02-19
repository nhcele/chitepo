import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PerformanceService, SystemMetrics } from './performance.service';
import { ErrorTrackingService, ErrorEvent, Alert } from './error-tracking.service';
import { HealthService, HealthCheck, DatabaseHealthCheck, DiskHealthCheck, ExternalServiceHealthCheck, MemoryHealthCheck, RedisHealthCheck } from './health.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly errorTrackingService: ErrorTrackingService,
    private readonly healthService: HealthService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return this.healthService.getHealthCheck();
  }

  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  async getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('health/detailed')
  @HttpCode(HttpStatus.OK)
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }

  @Get('performance')
  @HttpCode(HttpStatus.OK)
  async getPerformanceMetrics(@Query('start') start?: string, @Query('end') end?: string) {
    let timeRange;
    if (start && end) {
      timeRange = {
        start: new Date(start),
        end: new Date(end),
      };
    }

    return this.performanceService.getPerformanceMetrics(timeRange);
  }

  @Get('performance/system')
  @HttpCode(HttpStatus.OK)
  async getSystemMetrics(@Query('start') start?: string, @Query('end') end?: string) {
    let timeRange;
    if (start && end) {
      timeRange = {
        start: new Date(start),
        end: new Date(end),
      };
    }

    return this.performanceService.getSystemMetrics(timeRange);
  }

  @Get('performance/export')
  @HttpCode(HttpStatus.OK)
  async exportMetrics(@Query('format') format: 'json' | 'prometheus' = 'json') {
    const metrics = this.performanceService.exportMetrics(format);
    
    if (format === 'prometheus') {
      return {
        data: metrics,
        contentType: 'text/plain; version=0.0.4',
      };
    }
    
    return metrics;
  }

  @Get('errors')
  @HttpCode(HttpStatus.OK)
  async getErrors(
    @Query('level') level?: string,
    @Query('resolved') resolved?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const options: any = {};

    if (level) options.level = level;
    if (resolved !== undefined) options.resolved = resolved === 'true';
    if (tags) options.tags = tags.split(',');
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);
    if (start && end) {
      options.timeRange = {
        start: new Date(start),
        end: new Date(end),
      };
    }

    return this.errorTrackingService.getErrors(options);
  }

  @Get('errors/statistics')
  @HttpCode(HttpStatus.OK)
  async getErrorStatistics() {
    return this.errorTrackingService.getErrorStatistics();
  }

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  async getAlerts(
    @Query('resolved') resolved?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options: any = {};

    if (resolved !== undefined) options.resolved = resolved === 'true';
    if (severity) options.severity = severity;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    return this.errorTrackingService.getAlerts(options);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboardData() {
    const [health, performance, system, errorStats, alerts] = await Promise.all([
      this.healthService.getHealthCheck(),
      this.performanceService.getPerformanceMetrics(),
      this.performanceService.getSystemMetrics(),
      this.errorTrackingService.getErrorStatistics(),
      this.errorTrackingService.getAlerts({ resolved: false }),
    ]);

    return {
      health,
      performance,
      system,
      errors: errorStats,
      alerts: alerts.alerts.slice(0, 10), // Recent alerts
      timestamp: new Date(),
    };
  }
}
