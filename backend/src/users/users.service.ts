import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto, UserRole } from '@mindelta/shared';
import { User } from './entities/user.entity';
import { addMonths } from 'date-fns';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private readonly passwordExpiryMonths = 6;
  private readonly passwordHistoryLimit = 5;
  private readonly minPasswordLength = 8;

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

  private async ensureNotInPasswordHistory(user: User, newPassword: string): Promise<void> {
    const history = user.passwordHistory || [];
    for (const hash of history) {
      const isSame = await bcrypt.compare(newPassword, hash);
      if (isSame) {
        throw new BadRequestException('New password must not match any of the last 5 passwords.');
      }
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (!this.isPasswordComplex(createUserDto.password)) {
      throw new BadRequestException('Password must be at least 8 characters and include upper, lower, digit, and special characters.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    
    // Split name into firstName and lastName
    const nameParts = createUserDto.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = this.userRepository.create({
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

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'avatarUrl', 'jobTitle', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'avatarUrl', 'bio', 'jobTitle', 'skillInterests', 'role', 'isActive', 'emailVerified', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { googleId },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // If name is provided, split it into firstName and lastName
    if (updateUserDto.name) {
      const nameParts = updateUserDto.name.trim().split(/\s+/);
      user.firstName = nameParts[0] || user.firstName;
      user.lastName = nameParts.slice(1).join(' ') || user.lastName;
    }
    
    // Update other fields
    if (updateUserDto.jobTitle !== undefined) {
      user.jobTitle = updateUserDto.jobTitle;
    }
    if (updateUserDto.skillInterests !== undefined) {
      user.skillInterests = updateUserDto.skillInterests;
    }
    if (updateUserDto.avatar !== undefined) {
      user.avatarUrl = updateUserDto.avatar;
    }
    
    return this.userRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.isPasswordComplex(newPassword)) {
      throw new BadRequestException('Password must be at least 8 characters and include upper, lower, digit, and special characters.');
    }

    await this.ensureNotInPasswordHistory(user, newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const newHistory = [hashedPassword, ...(user.passwordHistory || [])].slice(0, this.passwordHistoryLimit);
    await this.userRepository.update(id, {
      password: hashedPassword,
      passwordHistory: newHistory,
      lastPasswordChangedAt: new Date(),
      passwordExpiryAt: this.computeExpiryDate(),
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastFailedLoginAt: null,
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerified: true,
      emailVerificationToken: null,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.userRepository.update(id, {
      isActive: false,
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getUserStats(id: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.enrollments', 'enrollment')
      .leftJoinAndSelect('user.certificates', 'certificate')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalEnrollments = user.enrollments?.length || 0;
    const completedCourses = user.enrollments?.filter(e => e.completedAt).length || 0;
    const totalCertificates = user.certificates?.length || 0;

    return {
      totalEnrollments,
      completedCourses,
      totalCertificates,
      completionRate: totalEnrollments > 0 ? (completedCourses / totalEnrollments) * 100 : 0,
    };
  }

  // Dev utility: set user role by email
  async setRoleByEmail(email: string, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.userRepository.save(user);
  }
}
