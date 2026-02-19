import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('personalized')
  async getPersonalizedRecommendations(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.recommendationsService.getPersonalizedRecommendations(userId, limitNum);
  }

  @Get('learning-path')
  async getLearningPathRecommendations(@Req() req: any) {
    const userId = req.user?.id;
    return this.recommendationsService.getLearningPathRecommendations(userId);
  }

  @Get('struggling')
  async getStrugglingStudentRecommendations(@Req() req: any) {
    const userId = req.user?.id;
    return this.recommendationsService.getStrugglingStudentRecommendations(userId);
  }

  @Get('next-module')
  async getNextBestModule(
    @Req() req: any,
    @Query('courseId') courseId?: string,
  ) {
    const userId = req.user?.id;
    return this.recommendationsService.getNextBestModuleRecommendation(userId, courseId);
  }
}

