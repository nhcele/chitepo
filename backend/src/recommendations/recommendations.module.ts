import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { AiCompanionModule } from '../ai-companion/ai-companion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Course, Enrollment, LessonProgress, QuizAttempt]),
    AiCompanionModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

