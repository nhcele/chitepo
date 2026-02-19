import { Test, TestingModule } from '@nestjs/testing';
import { RPLService } from './rpl.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RPLApplication, RPLStatus, RPLEvidenceType } from './entities/rpl-application.entity';
import { CertificationPathway, PathwayType } from '../certifications/entities/certification-pathway.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('RPLService', () => {
  let service: RPLService;
  let rplRepository: jest.Mocked<Repository<RPLApplication>>;
  let pathwayRepository: jest.Mocked<Repository<CertificationPathway>>;

  const mockPathway: CertificationPathway = {
    id: 'pathway-123',
    name: 'Test Pathway',
    type: PathwayType.GENERAL_EDUCATION,
    level: 1,
    minimumCourses: 3,
    isActive: true,
  } as CertificationPathway;

  const mockApplication: RPLApplication = {
    id: 'rpl-123',
    userId: 'user-123',
    pathwayId: 'pathway-123',
    status: RPLStatus.DRAFT,
    rationale:
      'This is a detailed rationale explaining prior learning and professional experience exceeding one hundred characters.',
    evidenceItems: [
      {
        type: RPLEvidenceType.PROFESSIONAL_CERTIFICATION,
        title: 'Test Certificate',
        description: 'Test Description',
        fileUrl: 'https://example.com/cert.pdf',
      },
    ],
    requestedCredits: [
      {
        courseId: 'course-1',
        courseName: 'Test Course',
        justification: 'Test justification',
      },
    ],
    approvedCredits: null,
    creditsRequested: 3,
    creditsApproved: 0,
    assessorId: null,
    assessorNotes: null,
    submittedAt: null,
    reviewedAt: null,
    approvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RPLApplication;

  beforeEach(async () => {
    const mockRplRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockPathwayRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RPLService,
        {
          provide: getRepositoryToken(RPLApplication),
          useValue: mockRplRepo,
        },
        {
          provide: getRepositoryToken(CertificationPathway),
          useValue: mockPathwayRepo,
        },
      ],
    }).compile();

    service = module.get<RPLService>(RPLService);
    rplRepository = module.get(getRepositoryToken(RPLApplication)) as jest.Mocked<Repository<RPLApplication>>;
    pathwayRepository = module.get(getRepositoryToken(CertificationPathway)) as jest.Mocked<Repository<CertificationPathway>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApplication', () => {
    it('should create new RPL application', async () => {
      const data = {
        userId: 'user-123',
        pathwayId: 'pathway-123',
        rationale: 'Test rationale',
        evidenceItems: mockApplication.evidenceItems,
        requestedCredits: mockApplication.requestedCredits,
      };

      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      rplRepository.findOne.mockResolvedValue(null);
      rplRepository.create.mockReturnValue(mockApplication as any);
      rplRepository.save.mockResolvedValue(mockApplication);

      const result = await service.createApplication(data);

      expect(result).toEqual(mockApplication);
      expect(rplRepository.create).toHaveBeenCalledWith({
        ...data,
        status: RPLStatus.DRAFT,
        creditsRequested: data.requestedCredits.length,
      });
    });

    it('should throw error when pathway not found', async () => {
      pathwayRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createApplication({
          userId: 'user-123',
          pathwayId: 'nonexistent',
          rationale: 'Test',
          evidenceItems: [],
          requestedCredits: [],
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw error when application already exists', async () => {
      pathwayRepository.findOne.mockResolvedValue(mockPathway);
      rplRepository.findOne.mockResolvedValue(mockApplication);

      await expect(
        service.createApplication({
          userId: 'user-123',
          pathwayId: 'pathway-123',
          rationale: 'Test',
          evidenceItems: [],
          requestedCredits: [],
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('submitApplication', () => {
    it('should submit application for review', async () => {
      rplRepository.findOne.mockResolvedValue(mockApplication);
      rplRepository.save.mockResolvedValue({
        ...mockApplication,
        status: RPLStatus.SUBMITTED,
        submittedAt: new Date(),
      } as any);

      const result = await service.submitApplication('rpl-123', 'user-123');

      expect(result.status).toBe(RPLStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
    });

    it('should throw error when rationale too short', async () => {
      const shortRationaleApp = {
        ...mockApplication,
        rationale: 'Short',
      };
      rplRepository.findOne.mockResolvedValue(shortRationaleApp as any);

      await expect(service.submitApplication('rpl-123', 'user-123'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('reviewApplication', () => {
    it('should approve application with valid evidence', async () => {
      const assessorId = 'assessor-123';
      const reviewData = {
        status: RPLStatus.APPROVED,
        approvedCredits: mockApplication.requestedCredits,
        assessorNotes: 'Approved',
      };

      rplRepository.findOne.mockResolvedValue({
        ...mockApplication,
        status: RPLStatus.UNDER_REVIEW,
      } as any);
      rplRepository.save.mockResolvedValue({
        ...mockApplication,
        status: RPLStatus.APPROVED,
        creditsApproved: 3,
        assessorId,
        reviewedAt: new Date(),
      } as any);

      const result = await service.reviewApplication(
        'rpl-123',
        assessorId,
        reviewData,
      );

      expect(result.status).toBe(RPLStatus.APPROVED);
      expect(result.creditsApproved).toBe(3);
    });

    it('should reject application with insufficient evidence', async () => {
      const assessorId = 'assessor-123';
      const reviewData = {
        status: RPLStatus.REJECTED,
        assessorNotes: 'Insufficient evidence',
      };

      rplRepository.findOne.mockResolvedValue({
        ...mockApplication,
        status: RPLStatus.UNDER_REVIEW,
      } as any);
      rplRepository.save.mockResolvedValue({
        ...mockApplication,
        status: RPLStatus.REJECTED,
        assessorId,
        reviewedAt: new Date(),
      } as any);

      const result = await service.reviewApplication(
        'rpl-123',
        assessorId,
        reviewData,
      );

      expect(result.status).toBe(RPLStatus.REJECTED);
    });
  });
});

