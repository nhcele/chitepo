import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { AIQuizService } from './ai-quiz.service';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { Progress } from './entities/progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Module as CourseModule } from '../courses/entities/module.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Question, QuizAttempt, Progress, Lesson, CourseModule]),
    AdminModule
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AIQuizService],
  exports: [AssessmentsService, AIQuizService],
})
export class AssessmentsModule {}
