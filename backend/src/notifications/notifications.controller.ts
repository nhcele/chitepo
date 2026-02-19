import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-email')
  @UseGuards(JwtAuthGuard)
  async sendEmail(@Body() emailData: { to: string; subject: string; html: string }) {
    await this.notificationsService.sendEmail(emailData.to, emailData.subject, emailData.html);
    return { message: 'Email sent successfully' };
  }

  @Post('welcome')
  @UseGuards(JwtAuthGuard)
  async sendWelcomeEmail(@Body() data: { userEmail: string; userName: string }) {
    await this.notificationsService.sendWelcomeEmail(data.userEmail, data.userName);
    return { message: 'Welcome email sent successfully' };
  }

  @Post('enrollment')
  @UseGuards(JwtAuthGuard)
  async sendEnrollmentEmail(@Body() data: { userEmail: string; userName: string; courseTitle: string }) {
    await this.notificationsService.sendCourseEnrollmentEmail(
      data.userEmail,
      data.userName,
      data.courseTitle
    );
    return { message: 'Enrollment email sent successfully' };
  }

  @Post('certificate')
  @UseGuards(JwtAuthGuard)
  async sendCertificateEmail(@Body() data: { 
    userEmail: string; 
    userName: string; 
    courseTitle: string; 
    certificateUrl: string 
  }) {
    await this.notificationsService.sendCertificateEmail(
      data.userEmail,
      data.userName,
      data.courseTitle,
      data.certificateUrl
    );
    return { message: 'Certificate email sent successfully' };
  }

  @Post('password-reset')
  async sendPasswordResetEmail(@Body() data: { userEmail: string; resetToken: string }) {
    await this.notificationsService.sendPasswordResetEmail(data.userEmail, data.resetToken);
    return { message: 'Password reset email sent successfully' };
  }

  @Post('reminder')
  @UseGuards(JwtAuthGuard)
  async sendReminderEmail(@Body() data: { userEmail: string; userName: string; courseTitle: string }) {
    await this.notificationsService.sendReminderEmail(
      data.userEmail,
      data.userName,
      data.courseTitle
    );
    return { message: 'Reminder email sent successfully' };
  }
}
