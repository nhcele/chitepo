import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  BadRequestException,
  ParseIntPipe,
  ValidationPipe,
  UseInterceptors,
  UsePipes,
  Req
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiConsumes
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { AiCompanionService } from './ai-companion.service';
import { 
  ChatRagDto, 
  ChatMode, 
  UsageStatsDto, 
  ExplainConceptDto,
  FeedbackDto,
  LearningPathDto,
  QuizQuestionDto,
  SummarizeContentDto
} from './dto/ai-companion.dto';
import { Audit, AuditOptions } from '../security/decorators/audit.decorator';
import { SecurityGuard } from '../security/guards/security.guard';
import { SecurityInterceptor } from '../security/interceptors/security.interceptor';
import { SecurityValidationPipe } from '../security/pipes/security-validation.pipe';
import { AuditAction, AuditResource } from '../security/entities/audit-log.entity';

@Controller('ai-companion')
@UseGuards(JwtAuthGuard, ThrottlerGuard, SecurityGuard)
@UseInterceptors(SecurityInterceptor)
@ApiTags('AI Companion')
@ApiBearerAuth()
export class AiCompanionController {
  constructor(
    private readonly aiCompanionService: AiCompanionService,
  ) {}

  private async ensureEnabled() {
    const enabled = await this.aiCompanionService.isFeatureEnabled();
    if (!enabled) {
      throw new BadRequestException('AI Companion is not enabled');
    }
  }

  @Post('chat')
  @Throttle({ default: { limit: 30, ttl: 60 } }) // 30 requests per minute
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: AuditAction.AI_REQUEST,
    resource: AuditResource.AI_COMPANION,
    resourceIdParam: 'lessonId',
    detailsFromBody: ['mode', 'level'],
    logResponse: false, // Don't log AI responses for privacy
  } as AuditOptions)
  @ApiOperation({ summary: 'Chat with AI companion using RAG' })
  @ApiResponse({ status: 200, description: 'AI response generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async chatRag(
    @Body(SecurityValidationPipe) chatRagDto: ChatRagDto,
    @Request() req,
  ) {
    await this.ensureEnabled();
    const response = await this.aiCompanionService.chatRag({
      lessonId: chatRagDto.lessonId,
      mode: chatRagDto.mode,
      level: chatRagDto.level,
      message: chatRagDto.message,
      userId: req.user.id,
    });
    return { response };
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async usage(@Req() req: Request) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    return this.aiCompanionService.getRemainingQuota(userId);
  }

  @Post('generate-quiz')
  @UseGuards(JwtAuthGuard)
  async generateQuiz(@Body() data: { courseContent: string; count?: number }) {
    await this.ensureEnabled();
    
    if (!data.courseContent || data.courseContent.trim().length === 0) {
      // No text/transcript to generate from: return empty so the client falls back
      // to persisted/module questions without logging a 400 error.
      return { questions: [] };
    }
    
    const questions = await this.aiCompanionService.generateQuizQuestions(
      data.courseContent,
      data.count || 5
    );
    
    if (!questions || questions.length === 0) {
      throw new HttpException('Failed to generate quiz questions. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return { questions };
  }

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  async provideFeedback(@Body() data: { 
    userAnswer: string; 
    correctAnswer: string; 
    question: string 
  }) {
    await this.ensureEnabled();
    const feedback = await this.aiCompanionService.provideFeedback(
      data.userAnswer,
      data.correctAnswer,
      data.question
    );
    return { feedback };
  }

  @Post('learning-path')
  @UseGuards(JwtAuthGuard)
  async suggestLearningPath(@Body() data: { 
    userProfile: any; 
    completedCourses: string[] 
  }) {
    await this.ensureEnabled();
    const suggestions = await this.aiCompanionService.suggestLearningPath(
      data.userProfile,
      data.completedCourses
    );
    return { suggestions };
  }

  @Post('explain')
  @UseGuards(JwtAuthGuard)
  async explainConcept(@Body() data: { concept: string; context?: string }) {
    await this.ensureEnabled();
    const explanation = await this.aiCompanionService.explainConcept(
      data.concept,
      data.context
    );
    return { explanation };
  }

  @Get('recommendations/:userId')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Req() req: Request) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    const recommendations = await this.aiCompanionService.getPersonalizedRecommendations(userId);
    return { recommendations };
  }

  @Get('insights/:userId')
  @UseGuards(JwtAuthGuard)
  async getInsights(@Req() req: Request) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    const insights = await this.aiCompanionService.getProgressInsights(userId);
    return { insights };
  }

  @Post('adaptive-difficulty')
  @UseGuards(JwtAuthGuard)
  async adjustDifficulty(@Body() data: { 
    userId: string; 
    lessonId: string; 
    performance: number 
  }) {
    await this.ensureEnabled();
    const adjustment = await this.aiCompanionService.adaptDifficulty(
      data.userId,
      data.lessonId,
      data.performance
    );
    return adjustment;
  }
}
