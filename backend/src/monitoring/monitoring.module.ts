import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { ErrorTrackingService } from './error-tracking.service';
import { HealthService } from './health.service';
import { MonitoringController } from './monitoring.controller';
import { PerformanceMiddleware } from './performance.middleware';

@Module({
  imports: [
    // Database and Config are already configured globally in AppModule
  ],
  controllers: [MonitoringController],
  providers: [
    PerformanceService,
    ErrorTrackingService,
    HealthService,
    PerformanceMiddleware,
  ],
  exports: [
    PerformanceService,
    ErrorTrackingService,
    HealthService,
    PerformanceMiddleware,
  ],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PerformanceMiddleware)
      .forRoutes('*');
  }
}
