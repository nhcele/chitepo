import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ComplianceMessagingController } from './compliance-messaging.controller';
import { Message } from './entities/message.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Course, User]),
    NotificationsModule,
  ],
  controllers: [MessagingController, ComplianceMessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}

