import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { AIQuizService } from './ai-quiz.service';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { AttemptItem } from './entities/attempt-item.entity';
import { LearningObjective } from './entities/learning-objective.entity';
import { QuestionBankItem } from './entities/question-bank-item.entity';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Module as CourseModule } from '../courses/entities/module.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { CoursesModule } from '../courses/courses.module';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      Question,
      QuizAttempt,
      AttemptItem,
      LearningObjective,
      QuestionBankItem,
      LessonProgress,
      Lesson,
      CourseModule,
      Course,
      Enrollment,
      User,
    ]),
    CoursesModule,
    AdminModule,
    NotificationsModule
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AIQuizService],
  exports: [AssessmentsService, AIQuizService],
})
export class AssessmentsModule {}
