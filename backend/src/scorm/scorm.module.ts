import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { ScormController } from './scorm.controller';
import { ScormService } from './scorm.service';
import { ScormPackage } from './entities/scorm-package.entity';
import { ScormRun } from './entities/scorm-run.entity';
import { ScormRunsController } from './scorm-runs.controller';
import { ScormRunsService } from './scorm-runs.service';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScormPackage, ScormRun, LessonProgress]), EnrollmentsModule],
  controllers: [ScormController, ScormRunsController],
  providers: [ScormService, ScormRunsService],
  exports: [ScormService, ScormRunsService],
})
export class ScormModule {}
