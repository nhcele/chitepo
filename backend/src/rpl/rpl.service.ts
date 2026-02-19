import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RPLApplication, RPLStatus, RPLEvidenceType } from './entities/rpl-application.entity';
import { CertificationPathway } from '../certifications/entities/certification-pathway.entity';

@Injectable()
export class RPLService {
  constructor(
    @InjectRepository(RPLApplication)
    private rplRepository: Repository<RPLApplication>,
    @InjectRepository(CertificationPathway)
    private pathwayRepository: Repository<CertificationPathway>,
  ) {}

  // Create new RPL application
  async createApplication(data: {
    userId: string;
    pathwayId: string;
    rationale: string;
    evidenceItems: any[];
    requestedCredits: any[];
  }): Promise<RPLApplication> {
    // Verify pathway exists
    const pathway = await this.pathwayRepository.findOne({
      where: { id: data.pathwayId },
    });

    if (!pathway) {
      throw new HttpException('Pathway not found', HttpStatus.NOT_FOUND);
    }

    // Check if user already has an application for this pathway
    const existing = await this.rplRepository.findOne({
      where: {
        userId: data.userId,
        pathwayId: data.pathwayId,
        status: RPLStatus.SUBMITTED,
      },
    });

    if (existing) {
      throw new HttpException(
        'You already have a pending application for this pathway',
        HttpStatus.CONFLICT,
      );
    }

    const application = this.rplRepository.create({
      ...data,
      status: RPLStatus.DRAFT,
      creditsRequested: data.requestedCredits?.length || 0,
    });

    return this.rplRepository.save(application);
  }

  // Get user's applications
  async getUserApplications(userId: string): Promise<RPLApplication[]> {
    return this.rplRepository.find({
      where: { userId },
      relations: ['pathway', 'assessor'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get single application
  async getApplication(applicationId: string, userId: string): Promise<RPLApplication> {
    const application = await this.rplRepository.findOne({
      where: { id: applicationId, userId },
      relations: ['pathway', 'assessor'],
    });

    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    return application;
  }

  // Update application (before submission)
  async updateApplication(
    applicationId: string,
    userId: string,
    data: Partial<RPLApplication>,
  ): Promise<RPLApplication> {
    const application = await this.getApplication(applicationId, userId);

    if (application.status !== RPLStatus.DRAFT) {
      throw new HttpException(
        'Cannot update application after submission',
        HttpStatus.BAD_REQUEST,
      );
    }

    Object.assign(application, data);

    if (data.requestedCredits) {
      application.creditsRequested = data.requestedCredits.length;
    }

    return this.rplRepository.save(application);
  }

  // Submit application for review
  async submitApplication(applicationId: string, userId: string): Promise<RPLApplication> {
    const application = await this.getApplication(applicationId, userId);

    if (application.status !== RPLStatus.DRAFT) {
      throw new HttpException('Application already submitted', HttpStatus.BAD_REQUEST);
    }

    // Validate required fields
    if (!application.rationale || application.rationale.length < 100) {
      throw new HttpException(
        'Rationale must be at least 100 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!application.evidenceItems || application.evidenceItems.length === 0) {
      throw new HttpException('At least one evidence item is required', HttpStatus.BAD_REQUEST);
    }

    application.status = RPLStatus.SUBMITTED;
    application.submittedAt = new Date();

    return this.rplRepository.save(application);
  }

  // Get all applications for review (admin/assessor)
  async getApplicationsForReview(status?: RPLStatus): Promise<RPLApplication[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      // Default to showing applications that need review
      where.status = [RPLStatus.SUBMITTED, RPLStatus.UNDER_REVIEW];
    }

    return this.rplRepository.find({
      where,
      relations: ['user', 'pathway'],
      order: { submittedAt: 'ASC' },
    });
  }

  // Start reviewing application (assessor)
  async startReview(applicationId: string, assessorId: string): Promise<RPLApplication> {
    const application = await this.rplRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    if (application.status !== RPLStatus.SUBMITTED && application.status !== RPLStatus.REQUIRES_EVIDENCE) {
      throw new HttpException('Application not in reviewable state', HttpStatus.BAD_REQUEST);
    }

    application.status = RPLStatus.UNDER_REVIEW;
    application.assessorId = assessorId;

    return this.rplRepository.save(application);
  }

  // Approve/reject application (assessor)
  async reviewApplication(
    applicationId: string,
    assessorId: string,
    data: {
      status: RPLStatus;
      approvedCredits?: any[];
      assessorNotes?: string;
    },
  ): Promise<RPLApplication> {
    const application = await this.rplRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    if (application.status !== RPLStatus.UNDER_REVIEW) {
      throw new HttpException('Application not under review', HttpStatus.BAD_REQUEST);
    }

    application.status = data.status;
    application.assessorId = assessorId;
    application.assessorNotes = data.assessorNotes || '';
    application.reviewedAt = new Date();

    if (data.status === RPLStatus.APPROVED || data.status === RPLStatus.PARTIALLY_APPROVED) {
      application.approvedCredits = data.approvedCredits || [];
      application.creditsApproved = data.approvedCredits?.length || 0;
      application.approvedAt = new Date();
    }

    return this.rplRepository.save(application);
  }

  // Request additional evidence
  async requestEvidence(
    applicationId: string,
    assessorId: string,
    notes: string,
  ): Promise<RPLApplication> {
    const application = await this.rplRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    application.status = RPLStatus.REQUIRES_EVIDENCE;
    application.assessorId = assessorId;
    application.assessorNotes = notes;

    return this.rplRepository.save(application);
  }

  // Get statistics
  async getStatistics(): Promise<any> {
    const allApplications = await this.rplRepository.find();

    const totalApplications = allApplications.length;
    const submitted = allApplications.filter((a) => a.status === RPLStatus.SUBMITTED).length;
    const underReview = allApplications.filter((a) => a.status === RPLStatus.UNDER_REVIEW).length;
    const approved = allApplications.filter((a) => a.status === RPLStatus.APPROVED).length;
    const partiallyApproved = allApplications.filter((a) => a.status === RPLStatus.PARTIALLY_APPROVED).length;
    const rejected = allApplications.filter((a) => a.status === RPLStatus.REJECTED).length;
    const requiresEvidence = allApplications.filter((a) => a.status === RPLStatus.REQUIRES_EVIDENCE).length;

    const totalCreditsRequested = allApplications.reduce((sum, a) => sum + (a.creditsRequested || 0), 0);
    const totalCreditsApproved = allApplications.reduce((sum, a) => sum + (a.creditsApproved || 0), 0);

    const approvalRate =
      totalApplications > 0 ? ((approved + partiallyApproved) / totalApplications) * 100 : 0;

    return {
      totalApplications,
      byStatus: {
        submitted,
        underReview,
        approved,
        partiallyApproved,
        rejected,
        requiresEvidence,
      },
      credits: {
        totalRequested: totalCreditsRequested,
        totalApproved: totalCreditsApproved,
        approvalRate: totalCreditsApproved > 0 ? (totalCreditsApproved / totalCreditsRequested) * 100 : 0,
      },
      approvalRate: approvalRate.toFixed(1),
    };
  }
}

