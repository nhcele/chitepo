import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleBasedLearningController } from './role-based-learning.controller';
import { RoleBasedLearningService } from './role-based-learning.service';
import { LearningPathManagementController } from './learning-path-management.controller';
import { LearningPathManagementService } from './learning-path-management.service';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { UserTrackAssignment } from '../tracks/entities/user-track-assignment.entity';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Course, Enrollment]),
    TracksModule,
  ],
  controllers: [RoleBasedLearningController, LearningPathManagementController],
  providers: [RoleBasedLearningService, LearningPathManagementService],
  exports: [RoleBasedLearningService, LearningPathManagementService],
})
export class RoleBasedLearningModule {}
