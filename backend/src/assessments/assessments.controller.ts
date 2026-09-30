import { Body, Controller, ForbiddenException, Get, HttpException, HttpStatus, Inject, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssessmentsService } from './assessments.service';
import { AIQuizService } from './ai-quiz.service';
import { CreateQuizDto, CreateQuestionDto, SaveAttemptAnswerDto, SubmitQuizAttemptDto, QuestionType, UserRole } from '@mindelta/shared';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { GradeQuestionsDto } from './dto/grade-questions.dto';
import { SubmitKnowledgeCheckAnswerDto } from './dto/submit-knowledge-check-answer.dto';
import { Request } from 'express';
import { AdminService } from '../admin/admin.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Lesson } from '../courses/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';

@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly aiQuizService: AIQuizService,
    private readonly adminService: AdminService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async ensureEnabled() {
    const cacheKey = 'assessments:featureEnabled';
    let enabled: boolean | undefined | null;
    try {
      enabled = await this.cache.get<boolean>(cacheKey);
    } catch {
      enabled = undefined; // cache unavailable -> fall back to DB, never 500 on it
    }
    if (enabled === undefined || enabled === null) {
      const res = await this.adminService.getSettings();
      enabled = !!res?.settings?.['feature.assessmentsEnabled'];
      try {
        // Short TTL so toggling the flag takes effect quickly without a DB hit per request.
        await this.cache.set(cacheKey, enabled, 30000);
      } catch {
        // ignore cache write failures
      }
    }
    if (!enabled) throw new ForbiddenException('Assessments are disabled by admin');
  }

  /** Only instructors/admins may receive the answer key or read other users' attempts. */
  private canSeeAnswers(req: Request): boolean {
    const role = (req as any).user?.role;
    return role === UserRole.INSTRUCTOR || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  private isAdmin(req: Request): boolean {
    const role = (req as any).user?.role;
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  private async ensureCanManageLesson(req: Request, lessonId: string): Promise<void> {
    if (this.isAdmin(req)) return;

    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    if (role !== UserRole.INSTRUCTOR || !userId) {
      throw new ForbiddenException('Instructor or admin access is required.');
    }

    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }
    if (lesson.module?.course?.instructorId !== userId) {
      throw new ForbiddenException('You can only manage assessments for your own courses.');
    }
  }

  private async ensureCanManageCourse(req: Request, courseId: string): Promise<void> {
    if (this.isAdmin(req)) return;

    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    if (role !== UserRole.INSTRUCTOR || !userId) {
      throw new ForbiddenException('Instructor or admin access is required.');
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    if ((course as any).instructorId !== userId) {
      throw new ForbiddenException('You can only manage assessments for your own courses.');
    }
  }

  private async ensureCanReadLessonAssessment(req: Request, lessonId: string): Promise<void> {
    if (this.isAdmin(req)) return;
    if ((req as any).user?.role === UserRole.INSTRUCTOR) {
      try {
        await this.ensureCanManageLesson(req, lessonId);
        return;
      } catch {
        // Fall through to learner enrollment checks. Instructors should not get
        // broad assessment read access for courses they do not own.
      }
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module'],
    });
    if (!lesson || !lesson.module?.courseId) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }

    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId: lesson.module.courseId },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to view its quiz.');
    }
  }

  private async canSeeQuizAnswers(req: Request, quizId: string): Promise<boolean> {
    if (!this.canSeeAnswers(req)) return false;
    if (this.isAdmin(req)) return true;

    const quiz = await this.assessmentsService.findQuizById(quizId, false);
    if (!quiz) return false;
    try {
      await this.ensureCanManageLesson(req, (quiz as any).lessonId);
      return true;
    } catch {
      return false;
    }
  }

  private async canSeeLessonAnswers(req: Request, lessonId: string): Promise<boolean> {
    if (!this.canSeeAnswers(req)) return false;
    if (this.isAdmin(req)) return true;
    try {
      await this.ensureCanManageLesson(req, lessonId);
      return true;
    } catch {
      return false;
    }
  }

  @Post('quizzes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createQuiz(@Req() req: Request, @Body() createQuizDto: CreateQuizDto) {
    await this.ensureEnabled();
    await this.ensureCanManageLesson(req, createQuizDto.lessonId);
    return this.assessmentsService.createQuiz(createQuizDto);
  }

  @Get('quizzes/:id')
  @UseGuards(JwtAuthGuard)
  async findQuiz(@Req() req: Request, @Param('id') id: string) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(id, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanReadLessonAssessment(req, (quiz as any).lessonId);
    const includeAnswers = await this.canSeeQuizAnswers(req, id);
    if (!(quiz as any).isPublished && !includeAnswers) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    return this.assessmentsService.findQuizById(id, includeAnswers);
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createQuestion(@Req() req: Request, @Body() createQuestionDto: CreateQuestionDto) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(createQuestionDto.quizId, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    return this.assessmentsService.createQuestion(createQuestionDto);
  }

  @Get('objectives')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listObjectives(@Req() req: Request, @Query('courseId') courseId: string) {
    await this.ensureEnabled();
    if (!courseId) {
      throw new HttpException('courseId is required', HttpStatus.BAD_REQUEST);
    }
    await this.ensureCanManageCourse(req, courseId);
    return this.assessmentsService.listObjectives(courseId);
  }

  @Post('objectives')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async upsertObjective(@Req() req: Request, @Body() body: { id?: string; courseId: string; code?: string; title: string; description?: string }) {
    await this.ensureEnabled();
    await this.ensureCanManageCourse(req, body.courseId);
    return this.assessmentsService.upsertObjective(body);
  }

  @Get('question-bank')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listQuestionBankItems(
    @Req() req: Request,
    @Query('courseId') courseId: string,
    @Query('objectiveId') objectiveId?: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    await this.ensureEnabled();
    if (!courseId) {
      throw new HttpException('courseId is required', HttpStatus.BAD_REQUEST);
    }
    await this.ensureCanManageCourse(req, courseId);
    return this.assessmentsService.listQuestionBankItems({
      courseId,
      objectiveId,
      search,
      includeArchived: includeArchived === 'true',
    });
  }

  @Post('question-bank')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async upsertQuestionBankItem(@Req() req: Request, @Body() body: any) {
    await this.ensureEnabled();
    await this.ensureCanManageCourse(req, body.courseId);
    return this.assessmentsService.upsertQuestionBankItem(body);
  }

  @Post('question-bank/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async archiveQuestionBankItem(@Req() req: Request, @Param('id') id: string, @Body() body: { courseId: string }) {
    await this.ensureEnabled();
    await this.ensureCanManageCourse(req, body.courseId);
    return this.assessmentsService.archiveQuestionBankItem(id, body.courseId);
  }

  @Post('question-bank/:id/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async importQuestionBankItem(@Req() req: Request, @Param('id') id: string, @Body() body: { quizId: string; orderIndex?: number }) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(body.quizId, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    return this.assessmentsService.importBankItemToQuiz(id, body.quizId, body.orderIndex);
  }

  @Post('quizzes/upsert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async upsertQuiz(@Req() req: Request, @Body() body: {
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
    await this.ensureCanManageLesson(req, body.lessonId);
    if (body.quizId) {
      const existing = await this.assessmentsService.findQuizById(body.quizId, false);
      if (!existing) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      if ((existing as any).lessonId !== body.lessonId) {
        throw new ForbiddenException('Quiz does not belong to the requested lesson.');
      }
    }
    return this.assessmentsService.upsertQuizWithQuestions(body);
  }

  @Post('quizzes/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async publishQuiz(@Req() req: Request, @Param('id') id: string) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(id, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    return this.assessmentsService.setQuizPublished(id, true, (req as any).user?.id);
  }

  @Post('quizzes/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async unpublishQuiz(@Req() req: Request, @Param('id') id: string) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(id, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    return this.assessmentsService.setQuizPublished(id, false, (req as any).user?.id);
  }

  @Post('grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async grade(@Req() req: Request, @Body() dto: GradeQuestionsDto) {
    await this.ensureEnabled();
    if (!this.isAdmin(req)) {
      const questionIds = Array.from(new Set((dto.items || []).map((item) => item.questionId).filter(Boolean)));
      if (questionIds.length === 0) {
        return this.assessmentsService.gradeQuestions(dto.items);
      }
      const questions = await this.questionRepo.find({
        where: { id: In(questionIds) },
        relations: ['quiz'],
      });
      if (questions.length !== questionIds.length) {
        throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
      }
      const lessonIds = Array.from(new Set(questions.map((question) => question.quiz?.lessonId).filter(Boolean)));
      for (const lessonId of lessonIds) {
        await this.ensureCanManageLesson(req, lessonId);
      }
    }
    return this.assessmentsService.gradeQuestions(dto.items);
  }

  @Post('attempts/start')
  @UseGuards(JwtAuthGuard)
  startAttempt(@Req() req: Request, @Body() dto: StartAttemptDto) {
    return this.ensureEnabled().then(() => {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      return this.assessmentsService.startAttempt(userId, dto.quizId, (dto as any).idempotencyKey);
    });
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  resumeAttempt(@Req() req: Request, @Param('attemptId') attemptId: string) {
    return this.ensureEnabled().then(() => {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      return this.assessmentsService.resumeAttempt(userId, attemptId);
    });
  }

  @Get('grading/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listPendingGrading(@Req() req: Request, @Param('quizId') _unused?: string) {
    await this.ensureEnabled();
    const quizId = (req as any).query?.quizId as string | undefined;
    if (!this.isAdmin(req) && !quizId) {
      throw new HttpException('quizId is required for instructors.', HttpStatus.BAD_REQUEST);
    }
    if (quizId) {
      const quiz = await this.assessmentsService.findQuizById(quizId, false);
      if (!quiz) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    }
    return this.assessmentsService.listPendingGradingAttempts(quizId);
  }

  @Get('quizzes/:id/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getQuizSummary(@Req() req: Request, @Param('id') id: string) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(id, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    return this.assessmentsService.getQuizSummary(id);
  }

  @Get('quizzes/:id/item-analysis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getQuizItemAnalysis(@Req() req: Request, @Param('id') id: string) {
    await this.ensureEnabled();
    const quiz = await this.assessmentsService.findQuizById(id, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, (quiz as any).lessonId);
    return this.assessmentsService.getQuizItemAnalysis(id);
  }

  @Get('attempts/:attemptId/grading')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAttemptForGrading(@Req() req: Request, @Param('attemptId') attemptId: string) {
    await this.ensureEnabled();
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId }, relations: ['quiz'] });
    if (!attempt) {
      throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, attempt.quiz.lessonId);
    return this.assessmentsService.getAttemptForGrading(attemptId);
  }

  @Put('attempts/:attemptId/answers/:questionId')
  @UseGuards(JwtAuthGuard)
  saveAttemptAnswer(
    @Req() req: Request,
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveAttemptAnswerDto,
  ) {
    return this.ensureEnabled().then(() => {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      return this.assessmentsService.saveAttemptAnswer(userId, attemptId, questionId, dto.answer, dto.expectedRevision);
    });
  }

  @Post('attempts/:attemptId/submit')
  @UseGuards(JwtAuthGuard)
  submitAttempt(@Req() req: Request, @Param('attemptId') attemptId: string, @Body() body: { idempotencyKey?: string }) {
    return this.ensureEnabled().then(() => {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      return this.assessmentsService.submitAttempt(userId, attemptId, body?.idempotencyKey);
    });
  }

  @Post('attempts/:attemptId/items/:itemId/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async gradeAttemptItem(
    @Req() req: Request,
    @Param('attemptId') attemptId: string,
    @Param('itemId') itemId: string,
    @Body() body: { pointsEarned: number; isCorrect?: boolean; feedback?: string },
  ) {
    await this.ensureEnabled();
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId }, relations: ['quiz'] });
    if (!attempt) {
      throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanManageLesson(req, attempt.quiz.lessonId);
    return this.assessmentsService.gradeAttemptItem(attemptId, itemId, body);
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

  // Current user's attempts for a quiz
  @Get('attempts/me/:quizId')
  @UseGuards(JwtAuthGuard)
  async getMyQuizAttempts(@Req() req: Request, @Param('quizId') quizId: string) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const quiz = await this.assessmentsService.findQuizById(quizId, false);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureCanReadLessonAssessment(req, (quiz as any).lessonId);
    const includeAnswers = await this.canSeeQuizAnswers(req, quizId);
    if (!(quiz as any).isPublished && !includeAnswers) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    return this.assessmentsService.getQuizAttempts(userId, quizId);
  }

  @Get('attempts/:userId/:quizId')
  @UseGuards(JwtAuthGuard)
  async getQuizAttempts(@Req() req: Request, @Param('userId') userId: string, @Param('quizId') quizId: string) {
    await this.ensureEnabled();
    const requesterId = (req as any).user?.id;
    if (!requesterId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (userId === requesterId) {
      return this.getMyQuizAttempts(req, quizId);
    }
    if (this.isAdmin(req)) {
      return this.assessmentsService.getQuizAttempts(userId, quizId);
    }
    const canManageQuiz = await this.canSeeQuizAnswers(req, quizId);
    if (!canManageQuiz) {
      throw new ForbiddenException('You can only view attempts for assessments you manage.');
    }
    return this.assessmentsService.getQuizAttempts(userId, quizId);
  }

  // Fetch quiz by lesson id (for lesson pages)
  @Get('quizzes/by-lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  async getQuizByLesson(@Req() req: Request, @Param('lessonId') lessonId: string) {
    await this.ensureEnabled();
    await this.ensureCanReadLessonAssessment(req, lessonId);
    const includeAnswers = await this.canSeeLessonAnswers(req, lessonId);
    return this.assessmentsService.findQuizByLesson(lessonId, includeAnswers, !includeAnswers);
  }

  // Fetch all quizzes by lesson id (used to select module quizzes that are tied to the first lesson)
  @Get('quizzes/by-lesson/:lessonId/all')
  @UseGuards(JwtAuthGuard)
  async getQuizzesByLesson(@Req() req: Request, @Param('lessonId') lessonId: string) {
    await this.ensureEnabled();
    await this.ensureCanReadLessonAssessment(req, lessonId);
    const includeAnswers = await this.canSeeLessonAnswers(req, lessonId);
    return this.assessmentsService.findQuizzesByLesson(lessonId, includeAnswers, !includeAnswers);
  }

  // AI-powered quiz generation
  @Post('ai/generate-quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateQuiz(@Req() req: Request, @Body() body: {
    lessonId: string;
    questionCount: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[];
    focusAreas?: string[];
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }) {
    await this.ensureEnabled();
    await this.ensureCanManageLesson(req, body.lessonId);
    return this.aiQuizService.generateAdaptiveQuiz(body);
  }

  @Post('ai/generate-quiz-and-save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateQuizAndSave(@Req() req: Request, @Body() body: {
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
    await this.ensureCanManageLesson(req, lessonId);

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

    const provenance = this.aiQuizService.getProvenance();
    return this.assessmentsService.upsertQuizWithQuestions({
      lessonId,
      title: body.title || fallbackTitle,
      description: body.description,
      passingScore: 70,
      timeLimit: 15,
      maxAttempts: 0,
      randomizeQuestions: true,
      retakeCooldownHours: 0,
      isPublished: false,
      source: 'ai',
      aiProvider: provenance.provider,
      aiModel: provenance.model,
      aiGeneratedAt: new Date(),
      questions: normalizedQuestions,
    });
  }

  // Get intelligent feedback for quiz answer
  @Post('ai/feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async detectMisconceptions(@Body() body: {
    questionId: string;
    wrongAnswers: Array<{ answer: string; frequency: number }>;
    correctAnswer: string;
    questionText: string;
  }) {
    await this.ensureEnabled();
    return this.aiQuizService.detectMisconceptions(body);
  }

  // In-lesson formative knowledge checks
  @Get('lessons/:lessonId/knowledge-check')
  @UseGuards(JwtAuthGuard)
  async getKnowledgeCheck(@Req() req: Request, @Param('lessonId') lessonId: string) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    await this.ensureCanReadLessonAssessment(req, lessonId);
    return this.assessmentsService.getKnowledgeCheckForLesson(lessonId);
  }

  @Post('lessons/:lessonId/knowledge-check/submit')
  @UseGuards(JwtAuthGuard)
  async submitKnowledgeCheckAnswer(
    @Req() req: Request,
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitKnowledgeCheckAnswerDto,
  ) {
    await this.ensureEnabled();
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    await this.ensureCanReadLessonAssessment(req, lessonId);
    return this.assessmentsService.submitKnowledgeCheckAnswer(userId, lessonId, dto);
  }
}
