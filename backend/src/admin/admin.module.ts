import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { InstructorApplication } from '../instructor/entities/instructor-application.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { Quiz } from '../assessments/entities/quiz.entity';
import { ExportJob } from './entities/export-job.entity';
import { SystemSetting } from './entities/system-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, AnalyticsEvent, InstructorApplication, Enrollment, QuizAttempt, Quiz, ExportJob, SystemSetting]), UsersModule, CoursesModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
