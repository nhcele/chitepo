import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MicroPacingService, LearningProfile, PacingRecommendation } from './micro-pacing.service';
import { Request } from 'express';

@Controller('ai-pacing')
@UseGuards(JwtAuthGuard)
export class MicroPacingController {
  constructor(private readonly microPacingService: MicroPacingService) {}

  @Get('profile')
  async getLearningProfile(@Req() req: Request) {
    const userId = (req as any).user?.id;
    const profile = await this.microPacingService.analyzeLearningProfile(userId);
    return { profile };
  }

  @Get('recommendation')
  async getPacingRecommendation(@Req() req: Request) {
    const userId = (req as any).user?.id;
    const recommendation = await this.microPacingService.generatePacingRecommendation(userId);
    return { recommendation };
  }

  @Post('adapt-content')
  async adaptContent(@Req() req: Request, @Body() data: {
    content: string;
    userPerformance: number;
  }) {
    const userId = (req as any).user?.id;
    const adaptedContent = await this.microPacingService.adaptContentDifficulty(
      userId,
      data.content,
      data.userPerformance
    );
    return { adaptedContent };
  }

  @Post('study-plan')
  async generateStudyPlan(@Req() req: Request, @Body() data: {
    courseId: string;
    targetCompletionDate: string;
  }) {
    const userId = (req as any).user?.id;
    const targetDate = new Date(data.targetCompletionDate);
    const studyPlan = await this.microPacingService.generateStudyPlan(
      userId,
      data.courseId,
      targetDate
    );
    return { studyPlan };
  }
}
