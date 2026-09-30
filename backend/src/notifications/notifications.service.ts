import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get('SMTP_PORT', 1025),
      secure: false,
      auth: this.configService.get('SMTP_USER') ? {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      } : undefined,
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get('FROM_EMAIL', 'noreply@chitepo.co.zw'),
      to,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const subject = 'Welcome to Chitepo!';
    const html = `
      <h1>Welcome to Chitepo, ${userName}!</h1>
      <p>Thank you for joining our professional learning platform.</p>
      <p>Get started by exploring our courses and building your skills.</p>
      <a href="${this.configService.get('FRONTEND_URL')}/courses">Browse Courses</a>
    `;
    
    await this.sendEmail(userEmail, subject, html);
  }

  async sendCourseEnrollmentEmail(userEmail: string, userName: string, courseTitle: string): Promise<void> {
    const subject = `Enrolled in ${courseTitle}`;
    const html = `
      <h1>Course Enrollment Confirmation</h1>
      <p>Hi ${userName},</p>
      <p>You have successfully enrolled in <strong>${courseTitle}</strong>.</p>
      <p>Start learning now!</p>
      <a href="${this.configService.get('FRONTEND_URL')}/dashboard">Go to Dashboard</a>
    `;
    
    await this.sendEmail(userEmail, subject, html);
  }

  async sendCertificateEmail(userEmail: string, userName: string, courseTitle: string, certificateUrl: string): Promise<void> {
    const subject = `Certificate Earned: ${courseTitle}`;
    const html = `
      <h1>Congratulations, ${userName}!</h1>
      <p>You have successfully completed <strong>${courseTitle}</strong> and earned your certificate.</p>
      <p>Download your certificate:</p>
      <a href="${certificateUrl}">Download Certificate</a>
    `;
    
    await this.sendEmail(userEmail, subject, html);
  }

  async sendVerificationEmail(userEmail: string, token: string): Promise<void> {
    const subject = 'Verify your email address';
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    const html = `
      <h1>Confirm your email</h1>
      <p>Thanks for registering. Please confirm your email address to activate your account.</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>If you did not create this account, you can ignore this email.</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<void> {
    const subject = 'Password Reset Request';
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your Chitepo account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    
    await this.sendEmail(userEmail, subject, html);
  }

  async sendReminderEmail(userEmail: string, userName: string, courseTitle: string): Promise<void> {
    const subject = `Continue Learning: ${courseTitle}`;
    const html = `
      <h1>Don't forget to continue learning!</h1>
      <p>Hi ${userName},</p>
      <p>You haven't made progress in <strong>${courseTitle}</strong> recently.</p>
      <p>Continue where you left off:</p>
      <a href="${this.configService.get('FRONTEND_URL')}/dashboard">Continue Learning</a>
    `;
    
    await this.sendEmail(userEmail, subject, html);
  }
}
