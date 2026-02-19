import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RPLService } from './rpl.service';
import { RPLStatus } from './entities/rpl-application.entity';

@Controller('rpl')
export class RPLController {
  constructor(private readonly rplService: RPLService) {}

  // Get user's applications
  @Get('applications')
  @UseGuards(JwtAuthGuard)
  getUserApplications(@Req() req: any) {
    const userId = req.user.id;
    return this.rplService.getUserApplications(userId);
  }

  // Get single application
  @Get('applications/:id')
  @UseGuards(JwtAuthGuard)
  getApplication(@Req() req: any, @Param('id') applicationId: string) {
    const userId = req.user.id;
    return this.rplService.getApplication(applicationId, userId);
  }

  // Create new application
  @Post('applications')
  @UseGuards(JwtAuthGuard)
  createApplication(
    @Req() req: any,
    @Body()
    body: {
      pathwayId: string;
      rationale: string;
      evidenceItems: any[];
      requestedCredits: any[];
    },
  ) {
    return this.rplService.createApplication({
      userId: req.user.id,
      ...body,
    });
  }

  // Alias endpoint for RPL application
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  applyForRPL(
    @Req() req: any,
    @Body()
    body: {
      pathwayId: string;
      rationale: string;
      evidenceItems: any[];
      requestedCredits: any[];
    },
  ) {
    return this.rplService.createApplication({
      userId: req.user.id,
      ...body,
    });
  }

  // Update application (draft only)
  @Put('applications/:id')
  @UseGuards(JwtAuthGuard)
  updateApplication(
    @Req() req: any,
    @Param('id') applicationId: string,
    @Body() body: any,
  ) {
    const userId = req.user.id;
    return this.rplService.updateApplication(applicationId, userId, body);
  }

  // Submit application for review
  @Post('applications/:id/submit')
  @UseGuards(JwtAuthGuard)
  submitApplication(@Req() req: any, @Param('id') applicationId: string) {
    const userId = req.user.id;
    return this.rplService.submitApplication(applicationId, userId);
  }

  // Admin/Assessor endpoints
  // Get applications for review
  @Get('admin/applications')
  @UseGuards(JwtAuthGuard)
  getApplicationsForReview(@Req() req: any) {
    // TODO: Add assessor role guard
    return this.rplService.getApplicationsForReview();
  }

  // Get statistics
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard)
  getStatistics() {
    // TODO: Add admin role guard
    return this.rplService.getStatistics();
  }

  // Start reviewing
  @Post('admin/applications/:id/review')
  @UseGuards(JwtAuthGuard)
  startReview(@Req() req: any, @Param('id') applicationId: string) {
    const assessorId = req.user.id;
    return this.rplService.startReview(applicationId, assessorId);
  }

  // Approve/reject application
  @Put('admin/applications/:id/decision')
  @UseGuards(JwtAuthGuard)
  reviewApplication(
    @Req() req: any,
    @Param('id') applicationId: string,
    @Body()
    body: {
      status: RPLStatus;
      approvedCredits?: any[];
      assessorNotes?: string;
    },
  ) {
    const assessorId = req.user.id;
    return this.rplService.reviewApplication(applicationId, assessorId, body);
  }

  // Request additional evidence
  @Post('admin/applications/:id/request-evidence')
  @UseGuards(JwtAuthGuard)
  requestEvidence(
    @Req() req: any,
    @Param('id') applicationId: string,
    @Body() body: { notes: string },
  ) {
    const assessorId = req.user.id;
    return this.rplService.requestEvidence(applicationId, assessorId, body.notes);
  }
}

