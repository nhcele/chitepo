import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-redis-store';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { CertificationsModule } from './certifications/certifications.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { ComplianceModule } from './compliance/compliance.module';
import { RPLModule } from './rpl/rpl.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { FilesModule } from './files/files.module';
import { AiCompanionModule } from './ai-companion/ai-companion.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AdminModule } from './admin/admin.module';
import { InstructorModule } from './instructor/instructor.module';
import { VideoModule } from './video/video.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { SecurityModule } from './security/security.module';
import { TeamModule } from './teams/team.module';
import { UserGroupsModule } from './user-groups/user-groups.module';
import { ClassroomSessionsModule } from './classroom-sessions/classroom-sessions.module';
import { ForumsModule } from './forums/forums.module';
import { DiasporaModule } from './diaspora/diaspora.module';
import { MessagingModule } from './messaging/messaging.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { PlaceholderModule } from './placeholder/placeholder.module';
import { TracksModule } from './tracks/tracks.module';
import { RoleBasedLearningModule } from './role-learning/role-based-learning.module';
import { SuccessMetricsModule } from './success-metrics/success-metrics.module';
import { ScormModule } from './scorm/scorm.module';
import { GamificationModule } from './gamification/gamification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          store: redisStore as any,
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          ttl: 300, // 5 minutes default TTL
        };
      },
      inject: [ConfigService],
    }),

    // Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('RATE_LIMIT_TTL') || 60000,
          limit: configService.get('RATE_LIMIT_LIMIT') || 100,
        },
      ],
    }),

    // Feature modules
    SecurityModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssessmentsModule,
    CertificatesModule,
    CertificationsModule,
    CohortsModule,
    ComplianceModule,
    RPLModule,
    AnalyticsModule,
    MonitoringModule,
    FilesModule,
    AiCompanionModule,
    NotificationsModule,
    EnrollmentsModule,
    AdminModule,
    InstructorModule,
    VideoModule,
    BlockchainModule,
    TeamModule,
    UserGroupsModule,
    ClassroomSessionsModule,
    ForumsModule,
    DiasporaModule,
    MessagingModule,
    RecommendationsModule,
    PlaceholderModule,
    TracksModule,
    RoleBasedLearningModule,
    SuccessMetricsModule,
    ScormModule,
    GamificationModule,
  ],
})
export class AppModule {}

