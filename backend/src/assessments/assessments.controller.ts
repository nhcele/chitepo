import { Body, Controller, ForbiddenException, Get, HttpException, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssessmentsService } from './assessments.service';
import { AIQuizService } from './ai-quiz.service';
import { CreateQuizDto, CreateQuestionDto, SubmitQuizAttemptDto, QuestionType } from '@mindelta/shared';
import { Request } from 'express';
import { AdminService } from '../admin/admin.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../courses/entities/lesson.entity';

@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly aiQuizService: AIQuizService,
    private readonly adminService: AdminService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
  ) {}

  private async ensureEnabled() {
    const res = await this.adminService.getSettings();
    const enabled = !!res?.settings?.['feature.assessmentsEnabled'];
    if (!enabled) throw new ForbiddenException('Assessments are disabled by admin');
  }

  @Post('quizzes')
  @UseGuards(JwtAuthGuard)
  createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.ensureEnabled().then(() =>
      this.assessmentsService.createQuiz(createQuizDto)
    );
  }

  @Get('quizzes/:id')
  findQuiz(@Param('id') id: string) {
    return this.ensureEnabled().then(() => this.assessmentsService.findQuizById(id));
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard)
  createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.ensureEnabled().then(() => this.assessmentsService.createQuestion(createQuestionDto));
  }

  @Post('quizzes/upsert')
  @UseGuards(JwtAuthGuard)
  async upsertQuiz(@Body() body: {
    quizId?: string;
    lessonId: string;
    title: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    maxAttempts?: number;
    randomizeQuestions?: boolean;
    retakeCooldownHours?: number;
    isPublished?: boolean;
    questions: Array<{
      id?: string;
      type: QuestionType | 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple_choice' | 'true_false' | 'short_answer';
      stem: string;
      options?: string[];
      correctAnswer: string | number;
      explanation?: string;
      points?: number;
      orderIndex?: number;
    }>;
  }) {
    await this.ensureEnabled();
    return this.assessmentsService.upsertQuizWithQuestions(body);
  }

  @Post('attempts')
  @UseGuards(JwtAuthGuard)
  submitQuizAttempt(@Req() req: Request, @Body() submitQuizAttemptDto: SubmitQuizAttemptDto) {
    return this.ensureEnabled().then(() => {
      // Get userId from JWT token
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      return this.assessmentsService.submitQuizAttempt(submitQuizAttemptDto, userId);
    });
  }

  @Get('attempts/:userId/:quizId')
  @UseGuards(JwtAuthGuard)
  getQuizAttempts(@Param('userId') userId: string, @Param('quizId') quizId: string) {
    return this.ensureEnabled().then(() => this.assessmentsService.getQuizAttempts(userId, quizId));
  }

  // Fetch quiz by lesson id (for lesson pages)
  @Get('quizzes/by-lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  getQuizByLesson(@Param('lessonId') lessonId: string) {
    return this.ensureEnabled().then(() => this.assessmentsService.findQuizByLesson(lessonId));
  }

  // Fetch all quizzes by lesson id (used to select module quizzes that are tied to the first lesson)
  @Get('quizzes/by-lesson/:lessonId/all')
  @UseGuards(JwtAuthGuard)
  getQuizzesByLesson(@Param('lessonId') lessonId: string) {
    return this.ensureEnabled().then(() => this.assessmentsService.findQuizzesByLesson(lessonId));
  }

  // Current user's attempts for a quiz
  @Get('attempts/me/:quizId')
  @UseGuards(JwtAuthGuard)
  getMyQuizAttempts(@Req() req: Request, @Param('quizId') quizId: string) {
    return this.ensureEnabled().then(() => {
      const userId = (req as any).user?.id;
      return this.assessmentsService.getQuizAttempts(userId, quizId);
    });
  }

  // AI-powered quiz generation
  @Post('ai/generate-quiz')
  @UseGuards(JwtAuthGuard)
  async generateQuiz(@Body() body: {
    lessonId: string;
    questionCount: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[];
    focusAreas?: string[];
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }) {
    await this.ensureEnabled();
    return this.aiQuizService.generateAdaptiveQuiz(body);
  }

  @Post('ai/generate-quiz-and-save')
  @UseGuards(JwtAuthGuard)
  async generateQuizAndSave(@Body() body: {
    lessonId: string;
    moduleId?: string;
    questionCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    questionTypes?: ('multiple-choice' | 'true-false' | 'short-answer')[];
    focusAreas?: string[];
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    title?: string;
    description?: string;
    onlyIfMissing?: boolean;
  }) {
    await this.ensureEnabled();

    const lessonId = body.lessonId;
    if (!lessonId) {
      throw new HttpException('lessonId is required', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.assessmentsService.findQuizzesByLesson(lessonId);
    if (body.onlyIfMissing !== false) {
      if (body.title) {
        const match = (existing || []).find((q: any) => String(q.title || '') === body.title);
        if (match) {
          return match;
        }
      }
    }

    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    const fallbackTitle = lesson ? `${lesson.title} - Lesson Quiz` : 'Lesson Quiz';

    const questions = body.moduleId
      ? await this.aiQuizService.generateModuleQuizFromModule({
          moduleId: body.moduleId,
          questionCount: body.questionCount ?? 6,
          difficulty: body.difficulty ?? 'intermediate',
          questionTypes: body.questionTypes ?? ['multiple-choice'],
          focusAreas: body.focusAreas,
          bloomLevel: body.bloomLevel,
        })
      : await this.aiQuizService.generateAdaptiveQuiz({
          lessonId,
          questionCount: body.questionCount ?? 5,
          difficulty: body.difficulty ?? 'intermediate',
          questionTypes: body.questionTypes ?? ['multiple-choice'],
          focusAreas: body.focusAreas,
          bloomLevel: body.bloomLevel,
        });

    const normalizedQuestions = (questions || []).map((q: any, index: number) => ({
      type: q.type || 'multiple-choice',
      stem: q.question || q.stem || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? q.answer ?? '',
      explanation: q.explanation,
      points: 1,
      orderIndex: index,
    }));

    return this.assessmentsService.upsertQuizWithQuestions({
      lessonId,
      title: body.title || fallbackTitle,
      description: body.description,
      passingScore: 70,
      timeLimit: 15,
      maxAttempts: 3,
      randomizeQuestions: true,
      retakeCooldownHours: 24,
      isPublished: true,
      questions: normalizedQuestions,
    });
  }

  // Get intelligent feedback for quiz answer
  @Post('ai/feedback')
  @UseGuards(JwtAuthGuard)
  async getIntelligentFeedback(@Body() body: {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    questionText: string;
    questionType: string;
    lessonContext?: string;
  }) {
    await this.ensureEnabled();
    return this.aiQuizService.provideIntelligentFeedback(body);
  }

  // Calculate adaptive difficulty
  @Post('ai/adaptive-difficulty')
  @UseGuards(JwtAuthGuard)
  async calculateDifficulty(@Req() req: Request, @Body() body: {
    currentDifficulty: number;
    recentPerformance: number[];
    timeSpent: number[];
  }) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    return this.aiQuizService.calculateAdaptiveDifficulty({
      userId,
      ...body
    });
  }

  // Grade short answer with AI
  @Post('ai/grade-short-answer')
  @UseGuards(JwtAuthGuard)
  async gradeShortAnswer(@Body() body: {
    question: string;
    studentAnswer: string;
    modelAnswer: string;
    rubric?: string;
    maxPoints: number;
  }) {
    await this.ensureEnabled();
    return this.aiQuizService.gradeShortAnswer(body);
  }

  // Generate progressive hints
  @Post('ai/hints')
  @UseGuards(JwtAuthGuard)
  async generateHints(@Body() body: {
    questionText: string;
    correctAnswer: string;
    hintLevel: 1 | 2 | 3;
  }) {
    await this.ensureEnabled();
    return this.aiQuizService.generateProgressiveHints(body);
  }

  // Detect misconceptions from wrong answers
  @Post('ai/detect-misconceptions')
  @UseGuards(JwtAuthGuard)
  async detectMisconceptions(@Body() body: {
    questionId: string;
    wrongAnswers: Array<{ answer: string; frequency: number }>;
    correctAnswer: string;
    questionText: string;
  }) {
    await this.ensureEnabled();
    return this.aiQuizService.detectMisconceptions(body);
  }
}
