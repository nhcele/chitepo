import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

// Entities
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Module as CourseModule } from '../courses/entities/module.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { Quiz } from '../assessments/entities/quiz.entity';
import { Question } from '../assessments/entities/question.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          User,
          Course,
          CourseModule,
          Lesson,
          Enrollment,
          Quiz,
          Question,
          QuizAttempt,
          Certificate,
          AnalyticsEvent,
        ],
        autoLoadEntities: true,
        synchronize: false, // Disabled - using migrations instead
        logging: configService.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
