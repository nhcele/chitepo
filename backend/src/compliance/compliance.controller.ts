import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from './compliance.service';
import { OfficialPositionType } from './entities/official-position.entity';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // Get user's official positions
  @Get('positions')
  @UseGuards(JwtAuthGuard)
  getUserPositions(@Req() req: any) {
    const userId = req.user.id;
    return this.complianceService.getUserPositions(userId);
  }

  // Check compliance for a position
  @Get('positions/:id/check')
  @UseGuards(JwtAuthGuard)
  checkPositionCompliance(@Param('id') positionId: string) {
    return this.complianceService.checkPositionCompliance(positionId);
  }

  // Get user's compliance alerts
  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  getUserAlerts(@Req() req: any) {
    const userId = req.user.id;
    return this.complianceService.getUserAlerts(userId);
  }

  // Mark alert as read
  @Put('alerts/:id/read')
  @UseGuards(JwtAuthGuard)
  markAlertAsRead(@Req() req: any, @Param('id') alertId: string) {
    const userId = req.user.id;
    return this.complianceService.markAlertAsRead(alertId, userId);
  }

  // Register new official position
  @Post('positions/register')
  @UseGuards(JwtAuthGuard)
  registerPosition(
    @Req() req: any,
    @Body()
    body: {
      position: OfficialPositionType;
      positionTitle: string;
      regionProvince?: string;
      ward?: string;
      constituency?: string;
      startDate: string;
      electionYear?: number;
      requiredCertifications: string[];
      complianceDeadline: string;
    },
  ) {
    return this.complianceService.registerOfficialPosition({
      userId: req.user.id,
      ...body,
      startDate: new Date(body.startDate),
      complianceDeadline: new Date(body.complianceDeadline),
    });
  }

  // Admin endpoints
  // Get all non-compliant officials
  @Get('admin/non-compliant')
  @UseGuards(JwtAuthGuard)
  getNonCompliantOfficials() {
    // TODO: Add admin role guard
    return this.complianceService.getNonCompliantOfficials();
  }

  // Get compliance statistics
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard)
  getComplianceStatistics() {
    // TODO: Add admin role guard
    return this.complianceService.getComplianceStatistics();
  }

  // Manually run compliance check
  @Post('admin/run-check')
  @UseGuards(JwtAuthGuard)
  async runComplianceCheck() {
    // TODO: Add admin role guard
    await this.complianceService.runDailyComplianceCheck();
    return { message: 'Compliance check completed' };
  }
}

