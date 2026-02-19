import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';

interface ComplianceMessage {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  type: 'compliance_reminder' | 'compliance_chat' | 'system';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  readAt?: Date;
  sender?: any;
  recipient?: any;
  metadata?: any;
}

// In-memory storage for compliance messages (for demo purposes)
const complianceMessages: ComplianceMessage[] = [];
let messageIdCounter = 1;

@Controller('compliance-messaging')
@UseGuards(JwtAuthGuard)
export class ComplianceMessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversation/:userId')
  async getComplianceConversation(
    @Req() req: any,
    @Param('userId') userId: string,
  ) {
    const currentUserId = req.user?.id;
    
    // Get messages between current user and target user
    const messages = complianceMessages.filter(msg => 
      (msg.senderId === currentUserId && msg.recipientId === userId) ||
      (msg.senderId === userId && msg.recipientId === currentUserId)
    );

    // Sort by date
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Mark unread messages as read
    const unreadMessages = messages.filter(msg => 
      msg.recipientId === currentUserId && msg.status !== 'read'
    );
    
    for (const msg of unreadMessages) {
      msg.status = 'read';
      msg.readAt = new Date();
    }

    return messages;
  }

  @Post('send')
  async sendComplianceMessage(
    @Req() req: any,
    @Body() body: {
      recipientId: string;
      content: string;
      subject?: string;
      type?: 'compliance_reminder' | 'compliance_chat';
    },
  ) {
    const senderId = req.user?.id;
    
    const message: ComplianceMessage = {
      id: `comp-msg-${messageIdCounter++}`,
      senderId,
      recipientId: body.recipientId,
      subject: body.subject || 'Compliance Message',
      content: body.content,
      type: body.type || 'compliance_chat',
      status: 'sent',
      createdAt: new Date(),
      metadata: { source: 'compliance_system' },
    };

    complianceMessages.push(message);

    // Simulate delivery
    setTimeout(() => {
      message.status = 'delivered';
    }, 500);

    return message;
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user?.id;
    const count = complianceMessages.filter(msg => 
      msg.recipientId === userId && msg.status !== 'read'
    ).length;
    
    return { count };
  }

  @Put(':messageId/read')
  async markAsRead(
    @Req() req: any,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user?.id;
    const message = complianceMessages.find(msg => 
      msg.id === messageId && msg.recipientId === userId
    );

    if (!message) {
      throw new Error('Message not found');
    }

    message.status = 'read';
    message.readAt = new Date();

    return message;
  }

  @Get('export/:userId')
  async exportComplianceConversation(
    @Req() req: any,
    @Param('userId') userId: string,
  ) {
    const currentUserId = req.user?.id;
    
    const messages = complianceMessages.filter(msg => 
      (msg.senderId === currentUserId && msg.recipientId === userId) ||
      (msg.senderId === userId && msg.recipientId === currentUserId)
    );

    if (messages.length === 0) {
      return {
        emailContent: 'No messages found in this conversation.',
        filename: `compliance-conversation-${new Date().toISOString().split('T')[0]}.txt`,
      };
    }

    // Sort by date
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    let emailContent = `
Subject: Compliance Conversation Export - ${new Date().toLocaleDateString()}
==========================================================

Compliance Conversation
Total Messages: ${messages.length}
Date Range: ${messages[0]?.createdAt.toLocaleDateString()} - ${messages[messages.length - 1]?.createdAt.toLocaleDateString()}

==========================================================

`;

    for (const message of messages) {
      const senderName = message.senderId === currentUserId ? 'You' : 'User';
      const status = message.status === 'read' ? '[READ]' : '[UNREAD]';

      emailContent += `
${senderName} - ${message.createdAt.toLocaleString()} ${status}
----------------------------------------------------------
${message.content}

`;
    }

    emailContent += `
==========================================================
End of Compliance Conversation Export
Generated: ${new Date().toLocaleString()}
`;

    return {
      emailContent,
      filename: `compliance-conversation-${new Date().toISOString().split('T')[0]}.txt`,
    };
  }

  @Post('bulk-reminders')
  async sendBulkComplianceReminders(
    @Req() req: any,
    @Body() body: {
      overdueUsers: Array<{ userId: string; courseName: string; daysOverdue: number }>;
      dueSoonUsers: Array<{ userId: string; courseName: string; daysUntilDue: number }>;
    },
  ) {
    const senderId = req.user?.id;
    const sentMessages = { overdue: [], dueSoon: [] };

    // Send to overdue users
    for (const user of body.overdueUsers) {
      const message: ComplianceMessage = {
        id: `comp-msg-${messageIdCounter++}`,
        senderId,
        recipientId: user.userId,
        subject: `URGENT: ${user.courseName} - Overdue Compliance Training`,
        content: `Your compliance training for ${user.courseName} is ${user.daysOverdue} days overdue. Please complete it immediately to maintain compliance.`,
        type: 'compliance_reminder',
        status: 'sent',
        createdAt: new Date(),
        metadata: { courseName: user.courseName, daysOverdue: user.daysOverdue, isOverdue: true },
      };

      complianceMessages.push(message);
      sentMessages.overdue.push(message);
    }

    // Send to due soon users
    for (const user of body.dueSoonUsers) {
      const message: ComplianceMessage = {
        id: `comp-msg-${messageIdCounter++}`,
        senderId,
        recipientId: user.userId,
        subject: `Reminder: ${user.courseName} - Compliance Training Due Soon`,
        content: `Your compliance training for ${user.courseName} is due in ${user.daysUntilDue} days. Please complete it before the deadline.`,
        type: 'compliance_reminder',
        status: 'sent',
        createdAt: new Date(),
        metadata: { courseName: user.courseName, daysUntilDue: user.daysUntilDue, isOverdue: false },
      };

      complianceMessages.push(message);
      sentMessages.dueSoon.push(message);
    }

    return sentMessages;
  }
}
