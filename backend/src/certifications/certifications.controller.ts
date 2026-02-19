import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificationsService } from './certifications.service';
import { PathwayType } from './entities/certification-pathway.entity';

@Controller('certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  // Get all certification pathways
  @Get('pathways')
  getAllPathways() {
    return this.certificationsService.getAllPathways();
  }

  // Get pathways by type
  @Get('pathways/type/:type')
  getPathwaysByType(@Param('type') type: PathwayType) {
    return this.certificationsService.getPathwaysByType(type);
  }

  // Get user's certification progress
  @Get('progress')
  @UseGuards(JwtAuthGuard)
  getUserProgress(@Req() req: any) {
    const userId = req.user.id;
    return this.certificationsService.getUserCertificationProgress(userId);
  }

  // Get recommended pathways for user
  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  getRecommendations(@Req() req: any) {
    const userId = req.user.id;
    return this.certificationsService.getRecommendedPathways(userId);
  }

  // Enroll in certification pathway
  @Post('enroll')
  @UseGuards(JwtAuthGuard)
  enrollInPathway(
    @Req() req: any,
    @Body() body: { pathwayId: string }
  ) {
    const userId = req.user.id;
    return this.certificationsService.enrollInPathway(userId, body.pathwayId);
  }

  // Check eligibility for certification
  @Get('eligibility/:pathwayId')
  @UseGuards(JwtAuthGuard)
  checkEligibility(
    @Req() req: any,
    @Param('pathwayId') pathwayId: string
  ) {
    const userId = req.user.id;
    return this.certificationsService.checkCertificationEligibility(userId, pathwayId);
  }

  // Award certification (admin only - would need RoleGuard)
  @Post('award')
  @UseGuards(JwtAuthGuard)
  awardCertification(
    @Body() body: { userId: string; pathwayId: string }
  ) {
    return this.certificationsService.awardCertification(body.userId, body.pathwayId);
  }
}

