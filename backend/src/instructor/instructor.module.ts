import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { CoursesModule } from '../courses/courses.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { InstructorApplication } from './entities/instructor-application.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstructorApplication, Course, Enrollment, User, Progress, Lesson]), CoursesModule, AnalyticsModule, NotificationsModule],
  controllers: [InstructorController, PayoutController],
  providers: [InstructorService, PayoutService],
  exports: [InstructorService, PayoutService],
})
export class InstructorModule {}
