import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('send')
  async sendMessage(@Req() req: any, @Body() dto: CreateMessageDto) {
    const userId = req.user?.id;
    return this.messagingService.sendMessage(userId, dto);
  }

  @Get('conversation/:courseId/:otherUserId')
  async getConversation(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = req.user?.id;
    return this.messagingService.getConversation(userId, courseId, otherUserId);
  }

  @Get('inbox')
  async getInbox(@Req() req: any, @Query('courseId') courseId?: string) {
    const userId = req.user?.id;
    return this.messagingService.getInbox(userId, courseId);
  }

  @Get('sent')
  async getSentMessages(@Req() req: any, @Query('courseId') courseId?: string) {
    const userId = req.user?.id;
    return this.messagingService.getSentMessages(userId, courseId);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user?.id;
    return { count: await this.messagingService.getUnreadCount(userId) };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') messageId: string) {
    const userId = req.user?.id;
    return this.messagingService.markAsRead(messageId, userId);
  }

  @Patch(':id/archive')
  async archiveMessage(@Req() req: any, @Param('id') messageId: string) {
    const userId = req.user?.id;
    return this.messagingService.archiveMessage(messageId, userId);
  }

  @Get('course/:courseId/conversations')
  async getCourseConversations(@Req() req: any, @Param('courseId') courseId: string) {
    const instructorId = req.user?.id;
    return this.messagingService.getCourseConversations(courseId, instructorId);
  }

  @Post('compliance-reminder')
  async sendComplianceReminder(@Req() req: any, @Body() body: {
    recipientIds: string[];
    courseName: string;
    daysUntilDue: number;
    isOverdue?: boolean;
  }) {
    // Only admin can send compliance reminders
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.messagingService.sendComplianceReminder(
      body.recipientIds,
      body.courseName,
      body.daysUntilDue,
      body.isOverdue
    );
  }

  @Post('bulk-reminders')
  async sendBulkReminders(@Req() req: any, @Body() body: {
    overdueUsers: Array<{ userId: string; courseName: string; daysOverdue: number }>;
    dueSoonUsers: Array<{ userId: string; courseName: string; daysUntilDue: number }>;
  }) {
    // Only admin can send bulk reminders
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.messagingService.sendBulkReminders(body.overdueUsers, body.dueSoonUsers);
  }

  @Get('export/:userId')
  async exportConversation(@Req() req: any, @Param('userId') userId: string) {
    const currentUserId = req.user?.id;
    const emailContent = await this.messagingService.exportConversationToEmail(userId, currentUserId);
    
    return {
      emailContent,
      filename: `conversation-export-${new Date().toISOString().split('T')[0]}.txt`,
    };
  }
}

