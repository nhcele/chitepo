import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { ModulesController } from './modules.controller';
import { LessonsController } from './lessons.controller';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseModule as CourseModuleJoin } from './entities/course-module.entity';
import { Enrollment } from './entities/enrollment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseModule, Lesson, Enrollment, User, CourseModuleJoin])],
  controllers: [CoursesController, ModulesController, LessonsController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
