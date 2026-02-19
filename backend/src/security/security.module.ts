import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { AuditLog } from './entities/audit-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    UsersModule,
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        // General API rate limiting
        {
          ttl: configService.get('RATE_LIMIT_TTL') || 60000, // 1 minute
          limit: configService.get('RATE_LIMIT_LIMIT') || 100,
        },
        // Strict rate limiting for AI companion
        {
          name: 'ai-companion',
          ttl: configService.get('AI_RATE_LIMIT_TTL') || 86400000, // 24 hours
          limit: configService.get('AI_RATE_LIMIT_LIMIT') || 30,
        },
        // Authentication endpoints - more restrictive
        {
          name: 'auth',
          ttl: configService.get('AUTH_RATE_LIMIT_TTL') || 900000, // 15 minutes
          limit: configService.get('AUTH_RATE_LIMIT_LIMIT') || 5,
        },
        // File upload endpoints
        {
          name: 'upload',
          ttl: configService.get('UPLOAD_RATE_LIMIT_TTL') || 3600000, // 1 hour
          limit: configService.get('UPLOAD_RATE_LIMIT_LIMIT') || 10,
        },
      ],
    }),
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
