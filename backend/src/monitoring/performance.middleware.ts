import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';
import { ErrorTrackingService } from './error-tracking.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(
    private readonly performanceService: PerformanceService,
    private readonly errorTrackingService: ErrorTrackingService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const originalSend = res.send;
    const middleware = this; // Capture middleware context

    // Override response.send to capture response time and status
    res.send = function(this: Response, body: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record performance metrics
      try {
        const user = (req as any).user;
        const performanceService = middleware.performanceService || 
          (req as any).app.get('PerformanceService');
        
        if (performanceService) {
          performanceService.recordRequest({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: user?.userId,
            timestamp: new Date(),
          }, {
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
          });
        }

        // Log slow requests
        if (responseTime > 5000) {
          middleware.logger.warn(`Slow request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
        }

        // Log errors
        if (res.statusCode >= 400) {
          middleware.logger.error(`Error request: ${req.method} ${req.originalUrl} - ${res.statusCode}`);
        }

      } catch (error) {
        middleware.logger.error('Failed to record performance metrics:', error);
      }

      return originalSend.call(this, body);
    }.bind(res);

    // Handle request errors
    res.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      middleware.errorTrackingService.trackError(error, {
        method: req.method,
        url: req.originalUrl,
        userId: (req as any).user?.id || (req as any).user?.userId,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] as string || req.ip,
      }, 'critical');

      middleware.logger.error(`Request error: ${req.method} ${req.originalUrl} - ${error.message}`, error.stack);
    });

    next();
  }
}
