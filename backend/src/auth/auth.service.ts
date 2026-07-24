import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { CreateUserDto, LoginDto, UserRole } from '@mindelta/shared';
import { addMonths } from 'date-fns';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly passwordExpiryMonths = 6;
  private readonly passwordHistoryLimit = 5;
  private readonly minPasswordLength = 8;
  private readonly lockoutThreshold = 5;
  private readonly lockoutWindowMs = 15 * 60 * 1000; // 15 minutes
  private readonly resetTokenTtlMs = 60 * 60 * 1000; // 1 hour

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  private isPasswordComplex(password: string): boolean {
    if (!password || password.length < this.minPasswordLength) {
      return false;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  }

  private computeExpiryDate(): Date {
    return addMonths(new Date(), this.passwordExpiryMonths);
  }

  private async enforceLockout(user: User): Promise<void> {
    const now = new Date();
    if (user.lockoutUntil && user.lockoutUntil > now) {
      throw new ForbiddenException('Account locked. Try again later.');
    }
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const now = new Date();
    const withinWindow = user.lastFailedLoginAt && now.getTime() - user.lastFailedLoginAt.getTime() <= this.lockoutWindowMs;
    const failedAttempts = withinWindow ? (user.failedLoginAttempts || 0) + 1 : 1;
    const update: Partial<User> = {
      failedLoginAttempts: failedAttempts,
      lastFailedLoginAt: now,
    };

    if (failedAttempts >= this.lockoutThreshold) {
      update.lockoutUntil = new Date(now.getTime() + this.lockoutWindowMs);
    }

    await this.usersRepository.update(user.id, update);
  }

  private async handleSuccessfulLogin(user: User): Promise<void> {
    const update: Partial<User> = {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      lockoutUntil: null,
      lastLoginAt: new Date(),
    };
    await this.usersRepository.update(user.id, update);
  }

  async validateUser(email: string, password: string): Promise<any> {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersRepository.findOne({ 
      where: { email: normalizedEmail } 
    });
    
    if (!user) {
      return null;
    }
    
    if (!user.password) {
      return null;
    }
    
    await this.enforceLockout(user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      return null;
    }

    // Password expiry check
    if (user.passwordExpiryAt && user.passwordExpiryAt < new Date()) {
      throw new UnauthorizedException('Password expired. Please reset your password.');
    }

    await this.handleSuccessfulLogin(user);

    const { password: _password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim(),
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email.toLowerCase().trim() }
    });
    
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    if (!this.isPasswordComplex(createUserDto.password)) {
      throw new BadRequestException('Password must be at least 8 characters and include upper, lower, digit, and special characters.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // Split name into firstName and lastName
    const nameParts = createUserDto.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const emailVerificationToken = randomBytes(32).toString('hex');

    const user = this.usersRepository.create({
      email: createUserDto.email.toLowerCase().trim(),
      firstName,
      lastName,
      password: hashedPassword,
      passwordHistory: [hashedPassword],
      lastPasswordChangedAt: new Date(),
      passwordExpiryAt: this.computeExpiryDate(),
      jobTitle: createUserDto.jobTitle,
      skillInterests: createUserDto.skillInterests,
      role: createUserDto.role || UserRole.LEARNER,
      isActive: true,
      emailVerified: false,
      emailVerificationToken,
    });

    const savedUser = await this.usersRepository.save(user);

    // Send verification email; never fail registration if email delivery is down.
    try {
      await this.notificationsService.sendVerificationEmail(savedUser.email, emailVerificationToken);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', err?.message || err);
    }

    const { password, ...result } = savedUser;
    
    const payload = { email: result.email, sub: result.id, role: result.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async googleLogin(req: any) {
    const profile = req.user;
    if (!profile || !profile.email) {
      throw new UnauthorizedException('No user from Google');
    }

    const normalizedEmail = String(profile.email).toLowerCase().trim();
    let user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // First-time Google sign-in: create the account.
      // firstName/lastName are NOT NULL columns, so always provide a value.
      user = this.usersRepository.create({
        email: normalizedEmail,
        firstName: profile.firstName || 'Google',
        lastName: profile.lastName || 'User',
        avatarUrl: profile.picture || null,
        googleId: profile.googleId || null,
        emailVerified: true,
        isActive: true,
        role: UserRole.LEARNER,
      });
      user = await this.usersRepository.save(user);
    } else if (!user.googleId) {
      // Existing local account: link the Google identity instead of failing.
      user.googleId = profile.googleId || user.googleId;
      if (!user.avatarUrl && profile.picture) {
        user.avatarUrl = profile.picture;
      }
      user.emailVerified = true;
      user = await this.usersRepository.save(user);
    }

    const { password: _password, ...result } = user;
    const payload = { email: result.email, sub: result.id, role: result.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    // Always return the same response to prevent account enumeration.
    const genericResponse = {
      message: 'If an account exists for that email, a password reset link has been sent.',
    };
    if (!normalizedEmail) return genericResponse;

    const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (!user) return genericResponse;

    const verifier = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(verifier, 10);
    await this.usersRepository.update(user.id, {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: new Date(Date.now() + this.resetTokenTtlMs),
    });

    // Token = "<userId>.<verifier>": the selector lets us find the user without a
    // full-table scan, while only a bcrypt hash of the verifier is stored at rest.
    const resetToken = `${user.id}.${verifier}`;
    try {
      await this.notificationsService.sendPasswordResetEmail(user.email, resetToken);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to send password reset email:', err?.message || err);
    }
    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const [userId, verifier] = String(token || '').split('.');
    if (!userId || !verifier) {
      throw new BadRequestException('Invalid or malformed reset token.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.passwordResetToken || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token.');
    }
    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }
    const tokenValid = await bcrypt.compare(verifier, user.passwordResetToken);
    if (!tokenValid) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (!this.isPasswordComplex(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters and include upper, lower, digit, and special characters.',
      );
    }

    // Prevent reuse of recent passwords.
    const history = user.passwordHistory || [];
    for (const oldHash of history) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        throw new BadRequestException(
          `New password must not match your last ${this.passwordHistoryLimit} passwords.`,
        );
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const newHistory = [newHash, ...history].slice(0, this.passwordHistoryLimit);

    await this.usersRepository.update(user.id, {
      password: newHash,
      passwordHistory: newHistory,
      lastPasswordChangedAt: new Date(),
      passwordExpiryAt: this.computeExpiryDate(),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastFailedLoginAt: null,
    });

    return { message: 'Your password has been reset successfully. You can now sign in.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const raw = String(token || '').trim();
    if (!raw) throw new BadRequestException('Verification token is required.');

    const user = await this.usersRepository.findOne({ where: { emailVerificationToken: raw } });
    if (!user) {
      throw new BadRequestException('Invalid or already-used verification token.');
    }

    await this.usersRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });
    return { message: 'Email verified successfully.' };
  }
}
