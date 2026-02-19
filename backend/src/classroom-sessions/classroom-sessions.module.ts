import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassroomSessionsController } from './classroom-sessions.controller';
import { ClassroomSessionsService } from './classroom-sessions.service';
import {
  ClassroomSession,
  ClassroomSessionParticipant,
} from './entities/classroom-session.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { CoursesModule } from '../courses/courses.module';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassroomSession,
      ClassroomSessionParticipant,
      User,
      Course,
      Lesson,
    ]),
    CoursesModule,
    UsersModule,
    AnalyticsModule,
  ],
  controllers: [ClassroomSessionsController],
  providers: [ClassroomSessionsService],
  exports: [ClassroomSessionsService],
})
export class ClassroomSessionsModule {}

