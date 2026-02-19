import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import {
  OfficialPosition,
  ComplianceAlert,
  OfficialPositionType,
  ComplianceStatus,
} from './entities/official-position.entity';
import { UserCertification, CertificationStatus } from '../certifications/entities/user-certification.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(OfficialPosition)
    private positionRepository: Repository<OfficialPosition>,
    @InjectRepository(ComplianceAlert)
    private alertRepository: Repository<ComplianceAlert>,
    @InjectRepository(UserCertification)
    private certificationRepository: Repository<UserCertification>,
  ) {}

  // Get user's official positions
  async getUserPositions(userId: string): Promise<OfficialPosition[]> {
    return this.positionRepository.find({
      where: { userId, isActive: true },
      relations: ['alerts'],
      order: { startDate: 'DESC' },
    });
  }

  // Check compliance for a specific position
  async checkPositionCompliance(positionId: string): Promise<any> {
    const position = await this.positionRepository.findOne({
      where: { id: positionId },
      relations: ['user'],
    });

    if (!position) {
      throw new HttpException('Position not found', HttpStatus.NOT_FOUND);
    }

    // Get user's completed certifications
    const userCertifications = await this.certificationRepository.find({
      where: {
        userId: position.userId,
        status: CertificationStatus.AWARDED,
      },
      relations: ['pathway'],
    });

    const completedCertIds = userCertifications.map((cert) => cert.pathwayId);

    // Check if all required certifications are completed
    const requiredCerts = position.requiredCertifications || [];
    const missingCerts = requiredCerts.filter((reqId) => !completedCertIds.includes(reqId));

    const isCompliant = missingCerts.length === 0;

    // Determine compliance status
    let complianceStatus = ComplianceStatus.NON_COMPLIANT;
    const now = new Date();

    if (position.exemptionReason) {
      complianceStatus = ComplianceStatus.EXEMPTED;
    } else if (isCompliant) {
      complianceStatus = ComplianceStatus.COMPLIANT;
    } else if (position.gracePeriodEnd && now <= position.gracePeriodEnd) {
      complianceStatus = ComplianceStatus.GRACE_PERIOD;
    } else if (position.complianceDeadline && now <= position.complianceDeadline) {
      complianceStatus = ComplianceStatus.GRACE_PERIOD;
    }

    // Update position
    position.complianceStatus = complianceStatus;
    position.completedCertifications = completedCertIds;
    position.lastComplianceCheck = now;
    await this.positionRepository.save(position);

    return {
      position: {
        id: position.id,
        positionType: position.position,
        positionTitle: position.positionTitle,
        regionProvince: position.regionProvince,
      },
      complianceStatus,
      isCompliant,
      requiredCertifications: requiredCerts.length,
      completedCertifications: completedCertIds.length,
      missingCertifications: missingCerts.length,
      missingCertificationIds: missingCerts,
      complianceDeadline: position.complianceDeadline,
      gracePeriodEnd: position.gracePeriodEnd,
      daysUntilDeadline: position.complianceDeadline
        ? Math.ceil((position.complianceDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };
  }

  // Get all non-compliant officials (admin use)
  async getNonCompliantOfficials(): Promise<any[]> {
    const positions = await this.positionRepository.find({
      where: [
        { complianceStatus: ComplianceStatus.NON_COMPLIANT, isActive: true },
        { complianceStatus: ComplianceStatus.GRACE_PERIOD, isActive: true },
      ],
      relations: ['user'],
      order: { complianceDeadline: 'ASC' },
    });

    return positions.map((pos) => ({
      id: pos.id,
      userId: pos.userId,
      userName: pos.user?.name || 'Unknown',
      userEmail: pos.user?.email || '',
      position: pos.position,
      positionTitle: pos.positionTitle,
      regionProvince: pos.regionProvince,
      complianceStatus: pos.complianceStatus,
      complianceDeadline: pos.complianceDeadline,
      gracePeriodEnd: pos.gracePeriodEnd,
      requiredCertifications: pos.requiredCertifications?.length || 0,
      completedCertifications: pos.completedCertifications?.length || 0,
      daysOverdue: pos.complianceDeadline
        ? Math.ceil((new Date().getTime() - pos.complianceDeadline.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));
  }

  // Get compliance statistics (admin use)
  async getComplianceStatistics(): Promise<any> {
    const allPositions = await this.positionRepository.find({
      where: { isActive: true },
    });

    const totalOfficials = allPositions.length;
    const compliant = allPositions.filter((p) => p.complianceStatus === ComplianceStatus.COMPLIANT).length;
    const nonCompliant = allPositions.filter((p) => p.complianceStatus === ComplianceStatus.NON_COMPLIANT).length;
    const gracePeriod = allPositions.filter((p) => p.complianceStatus === ComplianceStatus.GRACE_PERIOD).length;
    const exempted = allPositions.filter((p) => p.complianceStatus === ComplianceStatus.EXEMPTED).length;

    // Group by position type
    const byPositionType: any = {};
    Object.values(OfficialPositionType).forEach((type) => {
      const typePositions = allPositions.filter((p) => p.position === type);
      const typeCompliant = typePositions.filter((p) => p.complianceStatus === ComplianceStatus.COMPLIANT).length;
      byPositionType[type] = {
        total: typePositions.length,
        compliant: typeCompliant,
        nonCompliant: typePositions.length - typeCompliant,
        complianceRate: typePositions.length > 0 ? (typeCompliant / typePositions.length) * 100 : 0,
      };
    });

    // Group by region/province
    const byRegion: any = {};
    allPositions.forEach((pos) => {
      if (pos.regionProvince) {
        if (!byRegion[pos.regionProvince]) {
          byRegion[pos.regionProvince] = { total: 0, compliant: 0, nonCompliant: 0 };
        }
        byRegion[pos.regionProvince].total++;
        if (pos.complianceStatus === ComplianceStatus.COMPLIANT) {
          byRegion[pos.regionProvince].compliant++;
        } else {
          byRegion[pos.regionProvince].nonCompliant++;
        }
      }
    });

    return {
      overall: {
        totalOfficials,
        compliant,
        nonCompliant,
        gracePeriod,
        exempted,
        complianceRate: totalOfficials > 0 ? (compliant / totalOfficials) * 100 : 0,
      },
      byPositionType,
      byRegion,
      lastUpdated: new Date(),
    };
  }

  // Create alert for non-compliant official
  async createComplianceAlert(positionId: string, alertType: string, message: string, severity: string, dueDate?: Date): Promise<ComplianceAlert> {
    const position = await this.positionRepository.findOne({
      where: { id: positionId },
    });

    if (!position) {
      throw new HttpException('Position not found', HttpStatus.NOT_FOUND);
    }

    const alert = this.alertRepository.create({
      positionId,
      userId: position.userId,
      alertType,
      message,
      severity,
      dueDate,
    });

    return this.alertRepository.save(alert);
  }

  // Get user's alerts
  async getUserAlerts(userId: string): Promise<ComplianceAlert[]> {
    return this.alertRepository.find({
      where: { userId, isResolved: false },
      relations: ['position'],
      order: { createdAt: 'DESC' },
    });
  }

  // Mark alert as read
  async markAlertAsRead(alertId: string, userId: string): Promise<ComplianceAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
    }

    alert.isRead = true;
    return this.alertRepository.save(alert);
  }

  // Register new official position
  async registerOfficialPosition(data: {
    userId: string;
    position: OfficialPositionType;
    positionTitle: string;
    regionProvince?: string;
    ward?: string;
    constituency?: string;
    startDate: Date;
    electionYear?: number;
    requiredCertifications: string[];
    complianceDeadline: Date;
  }): Promise<OfficialPosition> {
    // Calculate grace period (e.g., 6 months for new councillors)
    const gracePeriodEnd = new Date(data.startDate);
    gracePeriodEnd.setMonth(gracePeriodEnd.getMonth() + 6);

    const position = this.positionRepository.create({
      ...data,
      gracePeriodEnd,
      complianceStatus: ComplianceStatus.PENDING_VERIFICATION,
    });

    return this.positionRepository.save(position);
  }

  // Run daily compliance check (cron job)
  async runDailyComplianceCheck(): Promise<void> {
    const allPositions = await this.positionRepository.find({
      where: { isActive: true },
    });

    for (const position of allPositions) {
      await this.checkPositionCompliance(position.id);

      // Create alerts for upcoming deadlines
      const now = new Date();
      if (position.complianceDeadline) {
        const daysUntilDeadline = Math.ceil(
          (position.complianceDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilDeadline === 30 && position.complianceStatus !== ComplianceStatus.COMPLIANT) {
          await this.createComplianceAlert(
            position.id,
            'deadline_approaching',
            '30 days remaining to complete mandatory training',
            'warning',
            position.complianceDeadline,
          );
        } else if (daysUntilDeadline === 7 && position.complianceStatus !== ComplianceStatus.COMPLIANT) {
          await this.createComplianceAlert(
            position.id,
            'deadline_approaching',
            '7 days remaining to complete mandatory training',
            'critical',
            position.complianceDeadline,
          );
        } else if (daysUntilDeadline < 0 && position.complianceStatus === ComplianceStatus.NON_COMPLIANT) {
          await this.createComplianceAlert(
            position.id,
            'deadline_passed',
            'Mandatory training deadline has passed',
            'critical',
            position.complianceDeadline,
          );
        }
      }
    }

    console.log(`Compliance check completed for ${allPositions.length} officials`);
  }
}

