import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcryptjs from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    role: 'learner' as const,
    isActive: true,
    emailVerified: true,
    avatar: null,
    jobTitle: null,
    skillInterests: [],
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockNotificationsService = {
      sendEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    configService.get.mockReturnValue('test-secret');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const password = 'password123';
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      usersRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      } as any);

      const result = await service.validateUser(mockUser.email, password);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        isActive: mockUser.isActive,
        emailVerified: mockUser.emailVerified,
        avatar: mockUser.avatar,
        jobTitle: mockUser.jobTitle,
        skillInterests: mockUser.skillInterests,
        emailVerificationToken: mockUser.emailVerificationToken,
        passwordResetToken: mockUser.passwordResetToken,
        passwordResetExpires: mockUser.passwordResetExpires,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });

    it('should return null when user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.validateUser(mockUser.email, 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return user when user is not active but credentials are valid', async () => {
      const password = 'password123';
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      usersRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        isActive: false,
      } as any);

      const result = await service.validateUser(mockUser.email, password);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        isActive: false,
        emailVerified: mockUser.emailVerified,
        avatar: mockUser.avatar,
        jobTitle: mockUser.jobTitle,
        skillInterests: mockUser.skillInterests,
        emailVerificationToken: mockUser.emailVerificationToken,
        passwordResetToken: mockUser.passwordResetToken,
        passwordResetExpires: mockUser.passwordResetExpires,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });
  });

  describe('login', () => {
    it('should return access token when login is successful', async () => {
      const expectedToken = 'jwt-token';
      const loginDto = { email: mockUser.email, password: 'password123' };
      const password = 'password123';
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      usersRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      } as any);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(result.access_token).toBe(expectedToken);
      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: `${mockUser.firstName} ${mockUser.lastName}`.trim(),
          role: mockUser.role,
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'wrong@example.com', password: 'wrongpassword' };
      
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'NewUser@Example.com',
      name: 'New User',
      password: 'Strong1!',
    };

    it('should create new user and return access token', async () => {
      const expectedToken = 'jwt-token';
      const newUser = {
        ...mockUser,
        email: registerDto.email.toLowerCase(),
        firstName: 'New',
        lastName: 'User',
        role: 'learner' as const,
      };
      
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(newUser as any);
      usersRepository.save.mockResolvedValue(newUser as any);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.register(registerDto as any);

      expect(result).toEqual({
        access_token: expectedToken,
        user: expect.objectContaining({
          id: newUser.id,
          email: newUser.email,
          firstName: 'New',
          lastName: 'User',
          role: newUser.role,
        }),
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email.toLowerCase() } });
      expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: registerDto.email.toLowerCase(),
        firstName: 'New',
        lastName: 'User',
        password: expect.any(String),
        passwordHistory: expect.arrayContaining([expect.any(String)]),
        lastPasswordChangedAt: expect.any(Date),
        passwordExpiryAt: expect.any(Date),
        jobTitle: undefined,
        skillInterests: undefined,
        role: newUser.role,
        isActive: true,
        emailVerified: false,
      }));
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
