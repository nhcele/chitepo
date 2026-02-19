import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { TeachingAssistantService } from './teaching-assistant.service';
import { Request } from 'express';

@Controller('ai-analytics')
@UseGuards(JwtAuthGuard)
export class AIAnalyticsController {
  constructor(
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService,
    private readonly teachingAssistantService: TeachingAssistantService,
  ) {}

  // Predictive Analytics Endpoints

  @Get('predict-completion/:courseId')
  async predictCompletion(@Req() req: Request, @Param('courseId') courseId: string) {
    const userId = (req as any).user?.id;
    return this.predictiveAnalyticsService.predictCompletion(userId, courseId);
  }

  @Get('at-risk-profile')
  async getAtRiskProfile(@Req() req: Request) {
    const userId = (req as any).user?.id;
    return this.predictiveAnalyticsService.identifyAtRiskLearners(userId);
  }

  @Post('skill-mastery-forecast')
  async forecastSkillMastery(
    @Req() req: Request,
    @Body() body: { skill: string; targetLevel?: number }
  ) {
    const userId = (req as any).user?.id;
    return this.predictiveAnalyticsService.forecastSkillMastery(
      userId,
      body.skill,
      body.targetLevel
    );
  }

  @Post('optimal-schedule')
  async generateOptimalSchedule(
    @Req() req: Request,
    @Body() body: { courseId: string; targetCompletionDate: string }
  ) {
    const userId = (req as any).user?.id;
    const targetDate = new Date(body.targetCompletionDate);
    return this.predictiveAnalyticsService.generateOptimalSchedule(
      userId,
      body.courseId,
      targetDate
    );
  }

  // Teaching Assistant Endpoints

  @Get('class-analytics/:courseId')
  async getClassAnalytics(@Param('courseId') courseId: string) {
    return this.teachingAssistantService.analyzeClassPerformance(courseId);
  }

  @Post('discussion-prompts')
  async generateDiscussionPrompts(
    @Body() body: {
      topic: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      count?: number;
    }
  ) {
    return this.teachingAssistantService.generateDiscussionPrompts(
      body.topic,
      body.difficulty,
      body.count
    );
  }

  @Post('faq-response')
  async respondToFAQ(
    @Body() body: {
      question: string;
      courseContext: string;
      lessonContext?: string;
    }
  ) {
    return this.teachingAssistantService.respondToFAQ(
      body.question,
      body.courseContext,
      body.lessonContext
    );
  }

  @Get('content-feedback/:lessonId')
  async analyzeContentQuality(@Param('lessonId') lessonId: string) {
    return this.teachingAssistantService.analyzeContentQuality(lessonId);
  }

  @Post('student-feedback')
  async generateStudentFeedback(
    @Body() body: {
      studentId: string;
      assignmentTitle: string;
      submission: string;
      rubric: string;
      maxScore: number;
    }
  ) {
    return this.teachingAssistantService.generateStudentFeedback(body);
  }
}
