import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCompanionService } from './ai-companion.service';
import { AiCompanionController } from './ai-companion.controller';
import { MicroPacingService } from './micro-pacing.service';
import { MicroPacingController } from './micro-pacing.controller';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';
import { ContentGenerationService } from './content-generation.service';
import { ContentGenerationController } from './content-generation.controller';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { TeachingAssistantService } from './teaching-assistant.service';
import { AIAnalyticsController } from './ai-analytics.controller';
import { Lesson } from '../courses/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { Module as CourseModule } from '../courses/entities/module.entity';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { AdminModule } from '../admin/admin.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      User,
      Enrollment,
      Course,
      CourseModule,
      LessonProgress,
      QuizAttempt
    ]),
    AdminModule,
    SecurityModule
  ],
  controllers: [
    AiCompanionController,
    MicroPacingController,
    VectorStoreController,
    ContentGenerationController,
    AIAnalyticsController
  ],
  providers: [
    AiCompanionService,
    MicroPacingService,
    VectorStoreService,
    ContentGenerationService,
    PredictiveAnalyticsService,
    TeachingAssistantService
  ],
  exports: [
    AiCompanionService,
    MicroPacingService,
    VectorStoreService,
    ContentGenerationService,
    PredictiveAnalyticsService,
    TeachingAssistantService
  ],
})
export class AiCompanionModule {}
