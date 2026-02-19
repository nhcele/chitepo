import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGamification } from './entities/user-gamification.entity';
import { CohortEnrollment } from '../cohorts/entities/training-cohort.entity';

@Module({
  imports: [AnalyticsModule, TypeOrmModule.forFeature([UserGamification, CohortEnrollment])],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
