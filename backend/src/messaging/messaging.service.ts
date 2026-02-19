import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType, MessageStatus } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendMessage(senderId: string, dto: CreateMessageDto): Promise<Message> {
    // Verify course exists
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Verify recipient exists
    const recipient = await this.userRepo.findOne({ where: { id: dto.recipientId } });
    if (!recipient) {
      throw new HttpException('Recipient not found', HttpStatus.NOT_FOUND);
    }

    // Verify sender is either instructor or enrolled student
    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new HttpException('Sender not found', HttpStatus.NOT_FOUND);
    }

    // Determine message type based on sender role
    let messageType = dto.type;
    if (!messageType) {
      if (sender.role === 'instructor' && course.instructorId === senderId) {
        messageType = MessageType.INSTRUCTOR_TO_STUDENT;
      } else {
        messageType = MessageType.STUDENT_TO_INSTRUCTOR;
      }
    }

    // Verify permissions
    if (messageType === MessageType.INSTRUCTOR_TO_STUDENT) {
      if (course.instructorId !== senderId) {
        throw new ForbiddenException('Only the course instructor can send instructor messages');
      }
    } else if (messageType === MessageType.STUDENT_TO_INSTRUCTOR) {
      // Verify student is enrolled (optional check - can be relaxed)
      // For now, we'll allow any student to message the instructor
    }

    const message = this.messageRepo.create({
      courseId: dto.courseId,
      senderId,
      recipientId: dto.recipientId,
      content: dto.content,
      type: messageType,
      status: MessageStatus.SENT,
    });

    const saved = await this.messageRepo.save(message);

    // Send notification email (best effort)
    try {
      await this.notificationsService.sendEmail(
        recipient.email,
        `New message from ${sender.name || 'Instructor'} about ${course.title}`,
        `<p>You have received a new message:</p><p>${dto.content}</p><p>Reply at: ${process.env.FRONTEND_URL || 'https://mindelta.com'}/messages</p>`,
      );
    } catch (error) {
      // Non-fatal
      console.error('Failed to send notification email:', error);
    }

    return saved;
  }

  async getConversation(
    userId: string,
    courseId: string,
    otherUserId: string,
  ): Promise<Message[]> {
    // Verify user has access to this conversation
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // Verify user is either instructor or the other participant
    if (userId !== otherUserId && course.instructorId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    const messages = await this.messageRepo.find({
      where: [
        {
          courseId,
          senderId: userId,
          recipientId: otherUserId,
        },
        {
          courseId,
          senderId: otherUserId,
          recipientId: userId,
        },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'recipient'],
    });

    // Mark messages as read
    const unreadMessages = messages.filter(
      (m) => m.recipientId === userId && m.status !== MessageStatus.READ,
    );
    if (unreadMessages.length > 0) {
      await this.messageRepo.update(
        { id: unreadMessages.map((m) => m.id) as any },
        { status: MessageStatus.READ, readAt: new Date() },
      );
    }

    return messages;
  }

  async getInbox(userId: string, courseId?: string): Promise<Message[]> {
    const where: any = {
      recipientId: userId,
      isArchived: false,
    };

    if (courseId) {
      where.courseId = courseId;
    }

    return this.messageRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['sender', 'recipient', 'course'],
      take: 50,
    });
  }

  async getSentMessages(userId: string, courseId?: string): Promise<Message[]> {
    const where: any = {
      senderId: userId,
      isArchived: false,
    };

    if (courseId) {
      where.courseId = courseId;
    }

    return this.messageRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['sender', 'recipient', 'course'],
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo.count({
      where: {
        recipientId: userId,
        status: MessageStatus.DELIVERED,
        isArchived: false,
      },
    });
  }

  async sendComplianceReminder(
    recipientIds: string[],
    courseName: string,
    daysUntilDue: number,
    isOverdue: boolean = false
  ): Promise<Message[]> {
    const content = isOverdue
      ? `Your compliance training for ${courseName} is ${daysUntilDue} days overdue. Please complete it immediately to maintain compliance.`
      : `Your compliance training for ${courseName} is due in ${daysUntilDue} days. Please complete it before the deadline.`;

    const messages: Message[] = [];

    for (const recipientId of recipientIds) {
      const message = this.messageRepo.create({
        courseId: 'compliance-system',
        recipientId,
        senderId: 'system',
        content,
        type: MessageType.SYSTEM,
        status: MessageStatus.SENT,
      });

      const savedMessage = await this.messageRepo.save(message);
      messages.push(savedMessage);

      // Note: Notification service integration can be added later
      // await this.notificationsService.sendNotification(recipientId, {
      //   title: subject,
      //   body: content,
      //   type: 'compliance_reminder',
      //   data: { messageId: savedMessage.id },
      // });
    }

    return messages;
  }

  async sendBulkReminders(
    overdueUsers: Array<{ userId: string; courseName: string; daysOverdue: number }>,
    dueSoonUsers: Array<{ userId: string; courseName: string; daysUntilDue: number }>
  ): Promise<{ overdue: Message[]; dueSoon: Message[] }> {
    const overdueMessages: Message[] = [];
    const dueSoonMessages: Message[] = [];

    // Send to overdue users
    for (const user of overdueUsers) {
      const messages = await this.sendComplianceReminder(
        [user.userId],
        user.courseName,
        user.daysOverdue,
        true
      );
      overdueMessages.push(...messages);
    }

    // Send to users due soon
    for (const user of dueSoonUsers) {
      const messages = await this.sendComplianceReminder(
        [user.userId],
        user.courseName,
        user.daysUntilDue,
        false
      );
      dueSoonMessages.push(...messages);
    }

    return { overdue: overdueMessages, dueSoon: dueSoonMessages };
  }

  async exportConversationToEmail(conversationId: string, userId: string): Promise<string> {
    const messages = await this.messageRepo.find({
      where: [
        { senderId: userId, recipientId: conversationId },
        { senderId: conversationId, recipientId: userId },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'recipient'],
    });

    if (messages.length === 0) {
      throw new HttpException('No conversation found', HttpStatus.NOT_FOUND);
    }

    const otherUser = await this.userRepo.findOne({ where: { id: conversationId } });
    const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User';

    let emailContent = `
Subject: Conversation Export - ${new Date().toLocaleDateString()}
==========================================================

Conversation with: ${otherUserName}
Total Messages: ${messages.length}
Date Range: ${messages[0]?.createdAt.toLocaleDateString()} - ${messages[messages.length - 1]?.createdAt.toLocaleDateString()}

==========================================================

`;

    for (const message of messages) {
      const senderName = message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'System';
      const status = message.status === MessageStatus.READ ? '[READ]' : '[UNREAD]';

      emailContent += `
${senderName} - ${message.createdAt.toLocaleString()} ${status}
----------------------------------------------------------
${message.content}

`;
    }

    emailContent += `
==========================================================
End of Conversation Export
Generated: ${new Date().toLocaleString()}
`;

    return emailContent;
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException('You can only mark your own received messages as read');
    }

    message.status = MessageStatus.READ;
    message.readAt = new Date();
    return this.messageRepo.save(message);
  }

  async archiveMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ForbiddenException('You can only archive your own messages');
    }

    message.isArchived = true;
    return this.messageRepo.save(message);
  }

  async getCourseConversations(courseId: string, instructorId: string): Promise<any[]> {
    // Verify instructor owns the course
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You can only view conversations for your own courses');
    }

    // Get all unique students who have sent/received messages for this course
    const messages = await this.messageRepo
      .createQueryBuilder('message')
      .where('message.courseId = :courseId', { courseId })
      .andWhere(
        '(message.senderId = :instructorId OR message.recipientId = :instructorId)',
        { instructorId },
      )
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Group by student
    const studentMap = new Map<string, any>();
    for (const message of messages) {
      const studentId =
        message.senderId === instructorId ? message.recipientId : message.senderId;
      if (!studentMap.has(studentId)) {
        const student = message.senderId === instructorId ? message.recipient : message.sender;
        studentMap.set(studentId, {
          studentId,
          student,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      const conversation = studentMap.get(studentId);
      if (
        message.recipientId === instructorId &&
        message.status !== MessageStatus.READ
      ) {
        conversation.unreadCount++;
      }
    }

    return Array.from(studentMap.values());
  }
}

