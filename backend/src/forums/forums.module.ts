import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import {
  Forum,
  ForumPost,
  ForumMember,
  ForumPostLike,
} from './entities/forum.entity';
import { TrainingCohort } from '../cohorts/entities/training-cohort.entity';
import { CohortsModule } from '../cohorts/cohorts.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Forum, ForumPost, ForumMember, ForumPostLike, TrainingCohort]),
    CohortsModule,
    AnalyticsModule,
  ],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}

