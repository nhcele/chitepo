import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CohortsController } from './cohorts.controller';
import { CohortsService } from './cohorts.service';
import { CohortGraduationService } from './cohort-graduation.service';
import { TrainingCohort, CohortEnrollment } from './entities/training-cohort.entity';
import { User } from '../users/entities/user.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemSetting } from '../admin/entities/system-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingCohort,
      CohortEnrollment,
      User,
      Certificate,
      SystemSetting,
    ]),
    NotificationsModule,
  ],
  controllers: [CohortsController],
  providers: [CohortsService, CohortGraduationService],
  exports: [CohortsService, CohortGraduationService],
})
export class CohortsModule {}

