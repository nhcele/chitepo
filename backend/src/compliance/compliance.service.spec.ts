import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OfficialPosition, OfficialPositionType, ComplianceAlert } from './entities/official-position.entity';
import { UserCertification, CertificationStatus } from '../certifications/entities/user-certification.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let positionRepository: jest.Mocked<Repository<OfficialPosition>>;
  let alertRepository: jest.Mocked<Repository<ComplianceAlert>>;
  let userCertRepository: jest.Mocked<Repository<UserCertification>>;

  const mockPosition: OfficialPosition = {
    id: 'position-123',
    userId: 'user-123',
    position: OfficialPositionType.MAYOR,
    positionTitle: 'Mayor of Harare',
    regionProvince: 'Harare',
    startDate: new Date('2024-01-01'),
    endDate: null,
    isActive: true,
    isElected: true,
    complianceStatus: 'compliant' as any,
    requiredCertifications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OfficialPosition;

  const mockAlert: ComplianceAlert = {
    id: 'alert-123',
    positionId: 'position-123',
    userId: 'user-123',
    alertType: 'deadline_approaching',
    message: 'Training deadline approaching',
    severity: 'warning',
    isRead: false,
    isResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ComplianceAlert;

  beforeEach(async () => {
    const mockPositionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockAlertRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserCertRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: getRepositoryToken(OfficialPosition),
          useValue: mockPositionRepo,
        },
        {
          provide: getRepositoryToken(ComplianceAlert),
          useValue: mockAlertRepo,
        },
        {
          provide: getRepositoryToken(UserCertification),
          useValue: mockUserCertRepo,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    positionRepository = module.get(getRepositoryToken(OfficialPosition)) as jest.Mocked<Repository<OfficialPosition>>;
    alertRepository = module.get(getRepositoryToken(ComplianceAlert)) as jest.Mocked<Repository<ComplianceAlert>>;
    userCertRepository = module.get(getRepositoryToken(UserCertification)) as jest.Mocked<Repository<UserCertification>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPositionCompliance', () => {
    it('should return compliant when requirements met', async () => {
      const requiredCert = {
        id: 'cert-123',
        userId: 'user-123',
        pathwayId: 'pathway-123',
        status: CertificationStatus.AWARDED,
        completedAt: new Date(),
      } as UserCertification;

      positionRepository.findOne.mockResolvedValue({
        ...mockPosition,
        user: { id: 'user-123' },
      } as any);
      userCertRepository.find.mockResolvedValue([requiredCert]);

      const result = await service.checkPositionCompliance('position-123');

      expect(result.isCompliant).toBe(true);
      expect(result.missingCertifications).toBe(0);
    });

    it('should return non-compliant when requirements not met', async () => {
      positionRepository.findOne.mockResolvedValue({
        ...mockPosition,
        user: { id: 'user-123' },
        requiredCertifications: ['pathway-123'],
      } as any);
      userCertRepository.find.mockResolvedValue([]);

      const result = await service.checkPositionCompliance('position-123');

      expect(result.isCompliant).toBe(false);
      expect(result.missingCertifications).toBeGreaterThan(0);
    });

    it('should throw error when position not found', async () => {
      positionRepository.findOne.mockResolvedValue(null);

      await expect(service.checkPositionCompliance('nonexistent'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('getUserPositions', () => {
    it('should return user positions', async () => {
      const positions = [mockPosition];
      positionRepository.find.mockResolvedValue(positions as any);

      const result = await service.getUserPositions('user-123');

      expect(result).toEqual(positions);
      expect(positionRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123', isActive: true },
        relations: ['alerts'],
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('getNonCompliantOfficials', () => {
    it('should return list of non-compliant officials', async () => {
      const positions = [mockPosition];

      positionRepository.find.mockResolvedValue(positions as any);
      userCertRepository.find.mockResolvedValue([]);

      const result = await service.getNonCompliantOfficials();

      expect(result).toHaveLength(1);
      expect(result[0].complianceStatus).toBeDefined();
    });
  });
});

