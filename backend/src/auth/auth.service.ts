import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { CreateUserDto, LoginDto, UserRole } from '@mindelta/shared';
import { addMonths } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly passwordExpiryMonths = 6;
  private readonly passwordHistoryLimit = 5;
  private readonly minPasswordLength = 8;
  private readonly lockoutThreshold = 5;
  private readonly lockoutWindowMs = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
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
    });

    const savedUser = await this.usersRepository.save(user);
    const { password, ...result } = savedUser;
    
    const payload = { email: result.email, sub: result.id, role: result.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    let user = await this.usersRepository.findOne({
      where: { email: req.user.email }
    });

    if (!user) {
      user = this.usersRepository.create({
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.picture,
        emailVerified: true,
        role: UserRole.LEARNER,
      });
      user = await this.usersRepository.save(user);
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
