import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial, In, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { AttemptItem, AttemptQuestionSnapshot } from './entities/attempt-item.entity';
import { LearningObjective } from './entities/learning-objective.entity';
import { QuestionBankItem } from './entities/question-bank-item.entity';
import {
  AssessmentAttemptView,
  AttemptItemGradingStatus,
  AttemptStatus,
  CreateQuizDto,
  CreateQuestionDto,
  QuestionType,
  SubmitQuizAttemptDto,
} from '@mindelta/shared';
import { CoursesService } from '../courses/courses.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(AttemptItem)
    private attemptItemRepository: Repository<AttemptItem>,
    @InjectRepository(LearningObjective)
    private learningObjectiveRepository: Repository<LearningObjective>,
    @InjectRepository(QuestionBankItem)
    private questionBankItemRepository: Repository<QuestionBankItem>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private coursesService: CoursesService,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private startKey(userId: string, quizId: string): string {
    return `attempt:start:${userId}:${quizId}`;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Shape a quiz for the API. By default (learner view) the correct answer and
   * explanation are stripped so the answer key is never sent to the browser,
   * and questions are shuffled if the quiz enables randomization.
   * Instructors/admins pass includeAnswers=true to get the full record for editing.
   */
  private normalizeQuiz(quiz: Quiz | null, includeAnswers = false): any {
    if (!quiz) return quiz as any;
    const q: any = { ...(quiz as any) };
    if (Array.isArray(q.questions)) {
      let questions = q.questions
        .filter((question: Question) => !(question as any).isArchived)
        .slice()
        .sort((a: Question, b: Question) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((question: any) => {
          const shaped: any = {
            ...question,
            stem: question.questionText,
            type: question.questionType,
          };
          if (!includeAnswers) {
            delete shaped.correctAnswer;
            delete shaped.explanation;
          }
          return shaped;
        });

      if (!includeAnswers && q.randomizeQuestions) {
        questions = this.shuffle(questions);
      }
      q.questions = questions;
    }
    return q;
  }

  async createQuiz(createQuizDto: CreateQuizDto): Promise<Quiz> {
    const quizPayload = this.buildQuizPayload(createQuizDto);
    const quiz: Quiz = this.quizRepository.create(quizPayload);
    const saved = (await this.quizRepository.save(quiz as any)) as any;
    return saved as Quiz;
  }

  async deleteQuiz(quizId: string): Promise<{ status: string }> {
    await this.quizRepository.delete({ id: quizId } as any);
    return { status: 'ok' };
  }

  async findQuizById(id: string, includeAnswers = false): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
    return this.normalizeQuiz(quiz, includeAnswers) as any;
  }

  async findQuizByLesson(lessonId: string, includeAnswers = false, publishedOnly = false): Promise<Quiz | null> {
    const quizzes = await this.quizRepository.find({ where: { lessonId }, relations: ['questions'] });
    const visibleQuizzes = publishedOnly ? quizzes.filter((quiz) => quiz.isPublished) : quizzes;
    if (!visibleQuizzes || visibleQuizzes.length === 0) return null;

    const preferred =
      visibleQuizzes.find((q) => !/\bmodule\s*quiz\b/i.test(String((q as any).title || ''))) ?? visibleQuizzes[0];
    return this.normalizeQuiz(preferred as any, includeAnswers) as any;
  }

  async findQuizzesByLesson(lessonId: string, includeAnswers = false, publishedOnly = false): Promise<Quiz[]> {
    const quizzes = await this.quizRepository.find({ where: { lessonId }, relations: ['questions'] });
    return quizzes
      .filter((quiz) => !publishedOnly || quiz.isPublished)
      .map((quiz) => this.normalizeQuiz(quiz, includeAnswers) as any);
  }

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const type = this.normalizeQuestionType((createQuestionDto as any).type);
    let options = createQuestionDto.options ?? null;
    let rawCorrect = (createQuestionDto as any).correctAnswer;

    // True/false: guarantee canonical options + correct index so grading is
    // consistent regardless of whether the client submits text or an index.
    if (type === QuestionType.TRUE_FALSE) {
      if (!Array.isArray(options) || options.length < 2) {
        options = ['True', 'False'];
      }
      rawCorrect = this.normalizeTrueFalse(rawCorrect);
    }

    const normalizedCorrect = this.normalizeCorrectAnswer(options, rawCorrect);

    const questionPayload: DeepPartial<Question> = {
      quizId: createQuestionDto.quizId,
      objectiveId: (createQuestionDto as any).objectiveId ?? null,
      bankItemId: (createQuestionDto as any).bankItemId ?? null,
      questionType: type,
      questionText: (createQuestionDto as any).stem,
      options,
      correctAnswer: normalizedCorrect,
      explanation: createQuestionDto.explanation ?? null,
      points: createQuestionDto.points ?? 1,
      difficulty: (createQuestionDto as any).difficulty ?? null,
      tags: this.normalizeTags((createQuestionDto as any).tags),
      orderIndex: createQuestionDto.orderIndex,
    };
    const question: Question = this.questionRepository.create(questionPayload);
    const saved = (await this.questionRepository.save(question as any)) as any;
    return saved as Question;
  }

  async upsertQuizWithQuestions(params: {
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
    source?: 'manual' | 'ai';
    aiProvider?: string | null;
    aiModel?: string | null;
    aiGeneratedAt?: Date | string | null;
    reviewedById?: string | null;
    reviewedAt?: Date | string | null;
    questions: Array<{
      id?: string;
      type: QuestionType | 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple_choice' | 'true_false' | 'short_answer';
      stem: string;
      options?: string[];
      correctAnswer: string | number;
      explanation?: string;
      points?: number;
      orderIndex?: number;
      objectiveId?: string | null;
      bankItemId?: string | null;
      difficulty?: string | null;
      tags?: string[] | null;
    }>;
  }): Promise<Quiz> {
    const { quizId, questions } = params;

    let quiz: Quiz | null = null;
    if (quizId) {
      quiz = await this.quizRepository.findOne({ where: { id: quizId } });
      if (!quiz) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      const quizPayload = this.buildQuizPayload(params);
      quizPayload.isPublished = params.isPublished ?? quiz.isPublished;
      (quizPayload as any).source = params.source ?? (quiz as any).source ?? 'manual';
      (quizPayload as any).aiProvider = params.aiProvider ?? (quiz as any).aiProvider ?? null;
      (quizPayload as any).aiModel = params.aiModel ?? (quiz as any).aiModel ?? null;
      (quizPayload as any).aiGeneratedAt = params.aiGeneratedAt ?? (quiz as any).aiGeneratedAt ?? null;
      (quizPayload as any).reviewedById = params.reviewedById ?? (quiz as any).reviewedById ?? null;
      (quizPayload as any).reviewedAt = params.reviewedAt ?? (quiz as any).reviewedAt ?? null;
      await this.quizRepository.update({ id: quizId } as any, quizPayload);
      quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    } else {
      const quizPayload = this.buildQuizPayload(params);
      quiz = await this.quizRepository.save(this.quizRepository.create(quizPayload) as any);
    }

    if (!quiz) {
      throw new HttpException('Failed to save quiz', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await this.questionRepository.update({ quizId: quiz.id } as any, { isArchived: true } as any);

    const normalizedQuestions = (questions || []).map((q, index) => ({
      quizId: quiz!.id,
      type: this.normalizeQuestionType(q.type),
      stem: q.stem,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points ?? 1,
      orderIndex: q.orderIndex ?? index,
      objectiveId: q.objectiveId ?? null,
      bankItemId: q.bankItemId ?? null,
      difficulty: q.difficulty ?? null,
      tags: this.normalizeTags(q.tags),
    }));

    for (const q of normalizedQuestions) {
      await this.createQuestion(q as any);
    }

    // Return the full record (with answers) so the instructor editor can round-trip it.
    return this.findQuizById(quiz.id, true);
  }

  async setQuizPublished(quizId: string, isPublished: boolean, reviewerId?: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['questions'],
    });
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }

    if (isPublished) {
      this.validateQuizCanPublish(quiz);
    }

    await this.quizRepository.update(
      { id: quizId } as any,
      {
        isPublished,
        ...(isPublished ? { reviewedById: reviewerId ?? null, reviewedAt: new Date() } : {}),
      } as any,
    );
    return this.findQuizById(quizId, true);
  }

  private validateQuizCanPublish(quiz: Quiz): void {
    const questions = (quiz.questions || []).filter((question) => !(question as any).isArchived);
    if (questions.length === 0) {
      throw new HttpException('Add at least one question before publishing this quiz.', HttpStatus.BAD_REQUEST);
    }

    for (const [index, question] of questions.entries()) {
      const label = `Question ${index + 1}`;
      if (!String(question.questionText || '').trim()) {
        throw new HttpException(`${label} needs question text before publishing.`, HttpStatus.BAD_REQUEST);
      }
      if (!Number.isFinite(Number(question.points)) || Number(question.points) <= 0) {
        throw new HttpException(`${label} must have a positive point value.`, HttpStatus.BAD_REQUEST);
      }

      const type = this.normalizeQuestionType((question as any).questionType);
      if (type === QuestionType.MULTIPLE_CHOICE) {
        const options = Array.isArray(question.options) ? question.options.filter((option) => String(option).trim()) : [];
        const correctIndex = Number(question.correctAnswer);
        if (options.length < 2 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
          throw new HttpException(`${label} needs at least two options and a valid correct answer.`, HttpStatus.BAD_REQUEST);
        }
      }

      if (type === QuestionType.TRUE_FALSE && !['0', '1', 'true', 'false'].includes(String(question.correctAnswer).toLowerCase())) {
        throw new HttpException(`${label} needs a valid true/false answer.`, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private buildQuizPayload(params: {
    lessonId: string;
    title: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    maxAttempts?: number;
    randomizeQuestions?: boolean;
    retakeCooldownHours?: number;
    isPublished?: boolean;
    source?: 'manual' | 'ai';
    aiProvider?: string | null;
    aiModel?: string | null;
    aiGeneratedAt?: Date | string | null;
    reviewedById?: string | null;
    reviewedAt?: Date | string | null;
  }): DeepPartial<Quiz> {
    const timeLimit = (params as any).timeLimit;
    const timeLimitMinutes =
      typeof timeLimit === 'number'
        ? timeLimit > 60
          ? Math.ceil(timeLimit / 60)
          : timeLimit
        : null;

    return {
      lessonId: params.lessonId,
      title: params.title,
      description: params.description ?? null,
      passingScore: params.passingScore ?? 70,
      timeLimitMinutes: timeLimitMinutes ?? null,
      randomizeQuestions: params.randomizeQuestions ?? false,
      maxAttempts: params.maxAttempts ?? 0, // 0 => unlimited
      retakeCooldownHours: params.retakeCooldownHours ?? 0, // 0 => no cooldown
      isPublished: params.isPublished ?? false,
      source: params.source ?? 'manual',
      aiProvider: params.aiProvider ?? null,
      aiModel: params.aiModel ?? null,
      aiGeneratedAt: params.aiGeneratedAt ? new Date(params.aiGeneratedAt) : null,
      reviewedById: params.reviewedById ?? null,
      reviewedAt: params.reviewedAt ? new Date(params.reviewedAt) : null,
    };
  }

  private async getQuizCourseContext(quizId: string): Promise<{ quiz: Quiz; lesson: Lesson; courseId: string }> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: quiz.lessonId },
      relations: ['module', 'module.course', 'module.course.instructor'],
    });
    if (!lesson || !lesson.module?.courseId) {
      throw new HttpException('Quiz lesson is not linked to a course.', HttpStatus.BAD_REQUEST);
    }

    return { quiz, lesson, courseId: lesson.module.courseId };
  }

  private async notifyPendingManualGrading(attempt: QuizAttempt): Promise<void> {
    try {
      const { quiz, lesson } = await this.getQuizCourseContext(attempt.quizId);
      const instructor = lesson.module?.course?.instructor;
      if (!instructor?.email) return;
      await this.notificationsService.sendEmail(
        instructor.email,
        `Manual grading needed: ${quiz.title}`,
        `
          <h1>Manual grading needed</h1>
          <p>An assessment attempt is waiting for review.</p>
          <p><strong>Quiz:</strong> ${quiz.title}</p>
          <p><strong>Attempt:</strong> ${attempt.attemptNumber}</p>
        `,
      );
    } catch (error) {
      console.error('Failed to send manual grading notification:', error);
    }
  }

  private async notifyLearnerAssessmentFinalized(attempt: QuizAttempt): Promise<void> {
    try {
      const learner = await this.userRepository.findOne({ where: { id: attempt.userId } });
      if (!learner?.email) return;
      const { quiz } = await this.getQuizCourseContext(attempt.quizId);
      await this.notificationsService.sendEmail(
        learner.email,
        `Assessment result available: ${quiz.title}`,
        `
          <h1>Your assessment has been graded</h1>
          <p>Your result for <strong>${quiz.title}</strong> is now available.</p>
          <p><strong>Score:</strong> ${Number(attempt.score || 0).toFixed(0)}%</p>
          <p><strong>Status:</strong> ${attempt.passed ? 'Passed' : 'Not passed'}</p>
        `,
      );
    } catch (error) {
      console.error('Failed to send assessment result notification:', error);
    }
  }

  private async ensureLearnerCanAttempt(userId: string, quiz: Quiz): Promise<{ lessonId: string; courseId: string }> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: quiz.lessonId },
      relations: ['module'],
    });
    if (!lesson || !lesson.module?.courseId) {
      throw new HttpException('Quiz lesson is not linked to a course.', HttpStatus.BAD_REQUEST);
    }

    const courseId = lesson.module.courseId;
    const enrollment = await this.enrollmentRepository.findOne({ where: { userId, courseId } });
    if (!enrollment) {
      throw new HttpException('You must be enrolled in this course to take the quiz.', HttpStatus.FORBIDDEN);
    }

    const access = await this.coursesService.checkLessonAccess(userId, courseId, lesson.id);
    if (!access?.hasAccess) {
      throw new HttpException(access?.reason || 'You do not have access to this lesson yet.', HttpStatus.FORBIDDEN);
    }

    return { lessonId: lesson.id, courseId };
  }

  /** Normalize noisy answer text for comparison (strip punctuation/case/extra spaces). */
  private cleanAnswerText(s: string | number | null | undefined): string {
    return String(s ?? '')
      .trim()
      .toLowerCase()
      .replace(/[.\)\(\]\[\}\{,:;!?"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeTrueFalse(raw: string | number): string {
    const s = String(raw ?? '').trim().toLowerCase();
    if (['true', 't', 'yes', 'y'].includes(s)) return 'True';
    if (['false', 'f', 'no', 'n'].includes(s)) return 'False';
    return String(raw); // numeric index or already-correct text; resolved by normalizeCorrectAnswer
  }

  /**
   * Resolve a correct answer to a canonical stored form. For option-based
   * questions this is the option index as a string. Matching is tolerant of
   * letter prefixes ("B) London"), letter answers ("B"), and casing/punctuation.
   * If nothing matches confidently it stores the raw TEXT (still gradeable by
   * text comparison) rather than silently defaulting to index 0.
   */
  private normalizeCorrectAnswer(options: string[] | null, rawCorrect: string | number | (string | number)[]): string {
    if (Array.isArray(rawCorrect)) {
      const normalized = rawCorrect.map((answer) => this.normalizeCorrectAnswer(options, answer));
      return JSON.stringify(Array.from(new Set(normalized)).sort());
    }
    const rawStr = (typeof rawCorrect === 'number' ? String(rawCorrect) : String(rawCorrect ?? '')).trim();

    if (!Array.isArray(options) || options.length === 0) {
      return rawStr;
    }

    const cleaned = this.cleanAnswerText(rawStr);

    // 1) Exact option-text match FIRST, so numeric option VALUES (e.g. "20" in
    //    ["10","20","30"]) are not misread as an out-of-range option index.
    let idx = options.findIndex((o) => this.cleanAnswerText(o) === cleaned);
    if (idx >= 0) return String(idx);

    // 2) Otherwise a bare number is treated as the option index
    if (/^\d+$/.test(rawStr)) {
      const i = Number(rawStr);
      return i >= 0 && i < options.length ? String(i) : rawStr;
    }

    // 3) Single-letter answer -> index (A=0, B=1, ...)
    if (/^[a-z]$/.test(cleaned)) {
      const li = cleaned.toUpperCase().charCodeAt(0) - 65;
      if (li >= 0 && li < options.length) return String(li);
    }

    // 4) Strip a leading label like "b " / "3 " then match again
    const stripped = cleaned.replace(/^[a-z0-9][\).\:\-\s]+/i, '').trim();
    if (stripped && stripped !== cleaned) {
      idx = options.findIndex((o) => this.cleanAnswerText(o) === stripped);
      if (idx >= 0) return String(idx);
    }

    // 5) No confident match: keep the raw text (fail-safe, never a wrong index)
    return rawStr;
  }

  private normalizeQuestionType(
    type: QuestionType | 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple_choice' | 'true_false' | 'short_answer'
  ): QuestionType {
    const normalized = String(type);
    if (normalized === QuestionType.MULTIPLE_CHOICE || normalized === 'multiple_choice' || normalized === 'multiple-choice') {
      return QuestionType.MULTIPLE_CHOICE;
    }
    if (normalized === QuestionType.TRUE_FALSE || normalized === 'true_false' || normalized === 'true-false') {
      return QuestionType.TRUE_FALSE;
    }
    if (normalized === QuestionType.SHORT_ANSWER || normalized === 'short_answer' || normalized === 'short-answer') {
      return QuestionType.SHORT_ANSWER;
    }
    return QuestionType.MULTIPLE_CHOICE;
  }

  private normalizeTags(tags?: string[] | null): string[] | null {
    const normalized = (tags || [])
      .map((tag) => String(tag).trim())
      .filter(Boolean);
    return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
  }

  private parseSelectedAnswers(answer: string | number | (string | number)[] | null | undefined): string[] {
    if (Array.isArray(answer)) return answer.map(String).map((value) => value.trim()).filter(Boolean).sort();
    const value = String(answer ?? '').trim();
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean).sort();
    } catch {}
    return [value];
  }

  private isAnswerCorrect(question: Question, rawUserAnswer: string | number | (string | number)[] | undefined): boolean {
    const userAnswers = this.parseSelectedAnswers(rawUserAnswer);
    const correctAnswers = this.parseSelectedAnswers(question.correctAnswer);
    if (userAnswers.length === 0 || correctAnswers.length === 0) return false;
    if (userAnswers.length > 1 || correctAnswers.length > 1) {
      return userAnswers.length === correctAnswers.length && userAnswers.every((answer, index) => answer === correctAnswers[index]);
    }

    const userAnswer = userAnswers[0];
    const correctAnswer = correctAnswers[0];
    if (userAnswer === correctAnswer) return true;

    const options = Array.isArray(question.options) ? question.options : [];
    if (options.length === 0) {
      // Short answer (or legacy T/F without options): normalized comparison.
      return this.cleanAnswerText(userAnswer) === this.cleanAnswerText(correctAnswer);
    }

    const selectedIndex = /^\d+$/.test(userAnswer) ? Number(userAnswer) : -1;
    const selectedOption =
      selectedIndex >= 0 && selectedIndex < options.length ? String(options[selectedIndex]).trim() : userAnswer;

    if (/^\d+$/.test(correctAnswer)) {
      const correctIndex = Number(correctAnswer);
      const correctOption =
        correctIndex >= 0 && correctIndex < options.length ? String(options[correctIndex]).trim() : '';
      return (
        selectedIndex === correctIndex ||
        (!!correctOption && this.cleanAnswerText(selectedOption) === this.cleanAnswerText(correctOption))
      );
    }

    return this.cleanAnswerText(selectedOption) === this.cleanAnswerText(correctAnswer);
  }

  private isSnapshotAnswerCorrect(snapshot: AttemptQuestionSnapshot, rawUserAnswer: string | number | (string | number)[] | undefined): boolean {
    return this.isAnswerCorrect(
      {
        correctAnswer: snapshot.correctAnswer == null ? '' : snapshot.correctAnswer,
        options: snapshot.options ?? [],
        questionType: snapshot.questionType,
      } as Question,
      rawUserAnswer,
    );
  }

  private calculateDeadline(startedAt: Date, quiz: Quiz): Date | null {
    if (!quiz.timeLimitMinutes || quiz.timeLimitMinutes <= 0) return null;
    return new Date(startedAt.getTime() + quiz.timeLimitMinutes * 60 * 1000);
  }

  private remainingSeconds(deadlineAt: Date | null): number | null {
    if (!deadlineAt) return null;
    return Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000));
  }

  private ensureAttemptActive(attempt: QuizAttempt): void {
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new HttpException('This attempt is no longer active.', HttpStatus.BAD_REQUEST);
    }
    if (attempt.deadlineAt && new Date(attempt.deadlineAt).getTime() < Date.now()) {
      throw new HttpException('Time limit exceeded for this quiz attempt.', HttpStatus.BAD_REQUEST);
    }
  }

  private shapeAttemptItem(item: AttemptItem): any {
    return {
      id: item.id,
      attemptId: item.attemptId,
      questionId: item.questionId,
      objectiveId: item.snapshot.objectiveId ?? null,
      bankItemId: item.snapshot.bankItemId ?? null,
      orderIndex: item.orderIndex,
      type: item.snapshot.questionType,
      stem: item.snapshot.questionText,
      options: item.snapshot.options ?? undefined,
      points: item.snapshot.points,
      difficulty: item.snapshot.difficulty ?? null,
      tags: item.snapshot.tags ?? null,
      response: item.response,
      responseRevision: item.responseRevision,
      gradingStatus: item.gradingStatus,
      isCorrect: item.isCorrect,
      pointsEarned: item.pointsEarned,
      explanation:
        item.gradingStatus === AttemptItemGradingStatus.AUTO_GRADED ||
        item.gradingStatus === AttemptItemGradingStatus.MANUALLY_GRADED
          ? item.snapshot.explanation
          : null,
    };
  }

  private async buildAttemptView(attempt: QuizAttempt): Promise<AssessmentAttemptView> {
    const items =
      attempt.items ??
      (await this.attemptItemRepository.find({
        where: { attemptId: attempt.id },
        order: { orderIndex: 'ASC' },
      }));

    return {
      attempt: { ...attempt, items: undefined } as any,
      items: items
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item) => this.shapeAttemptItem(item)),
      serverTime: new Date().toISOString(),
      remainingSeconds: this.remainingSeconds(attempt.deadlineAt),
    };
  }

  private async getActiveAttempt(userId: string, quizId: string): Promise<QuizAttempt | null> {
    return this.quizAttemptRepository.findOne({
      where: { userId, quizId, status: AttemptStatus.IN_PROGRESS },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  private async enforceAttemptPolicy(userId: string, quiz: Quiz): Promise<number> {
    const attempts = await this.quizAttemptRepository.find({
      where: { userId, quizId: quiz.id },
      order: { createdAt: 'DESC' },
    });
    const completedAttempts = attempts.filter((attempt) => attempt.status !== AttemptStatus.IN_PROGRESS);

    if ((quiz.maxAttempts ?? 0) > 0 && completedAttempts.length >= quiz.maxAttempts) {
      throw new HttpException('Maximum attempts reached for this quiz.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const lastAttempt = completedAttempts[0];
    if (lastAttempt && !lastAttempt.passed && (quiz.retakeCooldownHours ?? 0) > 0) {
      const completedAt = lastAttempt.completedAt || lastAttempt.submittedAt || lastAttempt.createdAt;
      const msSince = Date.now() - new Date(completedAt).getTime();
      const requiredMs = quiz.retakeCooldownHours * 60 * 60 * 1000;
      if (msSince < requiredMs) {
        throw new HttpException(
          `Retake cooldown active. Try again in ${Math.ceil((requiredMs - msSince) / (60 * 1000))} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return attempts.reduce((max, attempt) => Math.max(max, attempt.attemptNumber ?? 0), 0) + 1;
  }

  /**
   * Record an authoritative server-side start time for a quiz attempt so the
   * time limit can be enforced on submit (client-reported time is untrusted).
   */
  async startAttempt(userId: string, quizId: string, idempotencyKey?: string): Promise<AssessmentAttemptView> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId }, relations: ['questions'] });
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    if (!quiz.isPublished) {
      throw new HttpException('Quiz is not published.', HttpStatus.FORBIDDEN);
    }
    await this.ensureLearnerCanAttempt(userId, quiz);

    if (idempotencyKey) {
      const idempotentAttempt = await this.quizAttemptRepository.findOne({
        where: { userId, quizId, idempotencyKey },
        relations: ['items'],
      });
      if (idempotentAttempt) {
        return this.buildAttemptView(idempotentAttempt);
      }
    }

    const existing = await this.getActiveAttempt(userId, quizId);
    if (existing) {
      return this.buildAttemptView(existing);
    }

    const attemptNumber = await this.enforceAttemptPolicy(userId, quiz);
    const startedAt = new Date();
    const deadlineAt = this.calculateDeadline(startedAt, quiz);
    const orderedQuestions = (quiz.questions || [])
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const attemptQuestions = quiz.randomizeQuestions ? this.shuffle(orderedQuestions) : orderedQuestions;
    const previousAttempt = await this.quizAttemptRepository.findOne({
      where: {
        userId,
        quizId,
        status: In([AttemptStatus.FINALIZED, AttemptStatus.GRADED, AttemptStatus.AUTO_SUBMITTED]),
      },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    const previousCorrectAnswers = new Map(
      (previousAttempt?.items || [])
        .filter((item) => item.isCorrect === true && item.response !== null)
        .map((item) => [item.questionId, item.response]),
    );

    let attempt: QuizAttempt;
    try {
      attempt = await this.quizAttemptRepository.save(
        this.quizAttemptRepository.create({
          userId,
          quizId,
          status: AttemptStatus.IN_PROGRESS,
          attemptNumber,
          score: null,
          maxScore: null,
          passed: null,
          answers: [],
          startedAt,
          deadlineAt,
          submittedAt: null,
          completedAt: null,
          lastSavedAt: null,
          idempotencyKey: idempotencyKey ?? null,
          timeSpentSeconds: 0,
        }),
      );
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        const recovered = idempotencyKey
          ? await this.quizAttemptRepository.findOne({ where: { userId, quizId, idempotencyKey }, relations: ['items'] })
          : await this.getActiveAttempt(userId, quizId);
        if (recovered) {
          return this.buildAttemptView(recovered);
        }
      }
      throw error;
    }

    const items = attemptQuestions.map((question, index) =>
      this.attemptItemRepository.create({
        attemptId: attempt.id,
        questionId: question.id,
        orderIndex: index,
        snapshot: {
          questionId: question.id,
          objectiveId: question.objectiveId ?? null,
          bankItemId: question.bankItemId ?? null,
          questionType: question.questionType,
          questionText: question.questionText,
          options: question.options ?? null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation ?? null,
          points: question.points || 1,
          difficulty: question.difficulty ?? null,
          tags: question.tags ?? null,
          version: question.version || 1,
        },
        response: previousCorrectAnswers.get(question.id) ?? null,
        responseRevision: 0,
        gradingStatus: previousCorrectAnswers.has(question.id)
          ? AttemptItemGradingStatus.AUTO_GRADED
          : AttemptItemGradingStatus.UNANSWERED,
        isCorrect: previousCorrectAnswers.has(question.id) ? true : null,
        pointsEarned: previousCorrectAnswers.has(question.id) ? question.points || 1 : null,
      }),
    );
    attempt.items = await this.attemptItemRepository.save(items);

    return this.buildAttemptView(attempt);
  }

  async submitQuizAttempt(submitQuizAttemptDto: SubmitQuizAttemptDto, userId: string): Promise<QuizAttempt> {
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const quiz = await this.quizRepository.findOne({ where: { id: submitQuizAttemptDto.quizId } });
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    if (!quiz.isPublished) {
      throw new HttpException('Quiz is not published.', HttpStatus.FORBIDDEN);
    }
    await this.ensureLearnerCanAttempt(userId, quiz);

    const active = await this.getActiveAttempt(userId, submitQuizAttemptDto.quizId);
    const attempt = active ?? (await this.startAttempt(userId, submitQuizAttemptDto.quizId)).attempt as QuizAttempt;
    for (const [questionId, answer] of Object.entries(submitQuizAttemptDto.answers || {})) {
      await this.saveAttemptAnswer(userId, attempt.id, questionId, answer);
    }
    return this.submitAttempt(userId, attempt.id);
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return this.quizAttemptRepository.find({
      where: { userId, quizId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAttemptForGrading(attemptId: string): Promise<AssessmentAttemptView> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['items', 'quiz'],
    });
    if (!attempt) {
      throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
    }
    return this.buildAttemptView(attempt);
  }

  async listPendingGradingAttempts(quizId?: string): Promise<AssessmentAttemptView[]> {
    const attempts = await this.quizAttemptRepository.find({
      where: {
        ...(quizId ? { quizId } : {}),
        status: AttemptStatus.PENDING_GRADING,
      },
      relations: ['items', 'quiz'],
      order: { submittedAt: 'ASC', createdAt: 'ASC' },
      take: 100,
    });

    return Promise.all(attempts.map((attempt) => this.buildAttemptView(attempt)));
  }

  async getQuizSummary(quizId: string): Promise<{
    quizId: string;
    totalAttempts: number;
    inProgressAttempts: number;
    pendingGradingAttempts: number;
    finalizedAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    passRate: number;
    averageScore: number | null;
    averageTimeSpentSeconds: number | null;
  }> {
    const attempts = await this.quizAttemptRepository.find({ where: { quizId } });
    const totalAttempts = attempts.length;
    const inProgressAttempts = attempts.filter((attempt) => attempt.status === AttemptStatus.IN_PROGRESS).length;
    const pendingGradingAttempts = attempts.filter((attempt) => attempt.status === AttemptStatus.PENDING_GRADING).length;
    const finalized = attempts.filter((attempt) =>
      [AttemptStatus.FINALIZED, AttemptStatus.AUTO_SUBMITTED, AttemptStatus.GRADED].includes(attempt.status),
    );
    const scored = finalized.filter((attempt) => attempt.score !== null && attempt.score !== undefined);
    const passedAttempts = finalized.filter((attempt) => attempt.passed === true).length;
    const failedAttempts = finalized.filter((attempt) => attempt.passed === false).length;
    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / scored.length
        : null;
    const attemptsWithTime = attempts.filter((attempt) => Number(attempt.timeSpentSeconds || 0) > 0);
    const averageTimeSpentSeconds =
      attemptsWithTime.length > 0
        ? attemptsWithTime.reduce((sum, attempt) => sum + Number(attempt.timeSpentSeconds || 0), 0) / attemptsWithTime.length
        : null;

    return {
      quizId,
      totalAttempts,
      inProgressAttempts,
      pendingGradingAttempts,
      finalizedAttempts: finalized.length,
      passedAttempts,
      failedAttempts,
      passRate: finalized.length > 0 ? (passedAttempts / finalized.length) * 100 : 0,
      averageScore,
      averageTimeSpentSeconds,
    };
  }

  async listObjectives(courseId: string): Promise<LearningObjective[]> {
    return this.learningObjectiveRepository.find({
      where: { courseId },
      order: { code: 'ASC', title: 'ASC' } as any,
    });
  }

  async upsertObjective(params: {
    id?: string;
    courseId: string;
    code?: string | null;
    title: string;
    description?: string | null;
  }): Promise<LearningObjective> {
    const title = String(params.title || '').trim();
    if (!title) {
      throw new HttpException('Objective title is required.', HttpStatus.BAD_REQUEST);
    }

    if (params.id) {
      const existing = await this.learningObjectiveRepository.findOne({ where: { id: params.id } });
      if (!existing) {
        throw new HttpException('Objective not found', HttpStatus.NOT_FOUND);
      }
      if (existing.courseId !== params.courseId) {
        throw new HttpException('Objective does not belong to this course.', HttpStatus.FORBIDDEN);
      }
      await this.learningObjectiveRepository.update(
        { id: params.id } as any,
        {
          code: params.code?.trim() || null,
          title,
          description: params.description?.trim() || null,
        } as any,
      );
      return this.learningObjectiveRepository.findOne({ where: { id: params.id } }) as Promise<LearningObjective>;
    }

    return this.learningObjectiveRepository.save(
      this.learningObjectiveRepository.create({
        courseId: params.courseId,
        code: params.code?.trim() || null,
        title,
        description: params.description?.trim() || null,
      }),
    );
  }

  async listQuestionBankItems(params: {
    courseId: string;
    objectiveId?: string | null;
    search?: string | null;
    includeArchived?: boolean;
  }): Promise<QuestionBankItem[]> {
    const where: any = {
      courseId: params.courseId,
      ...(params.includeArchived ? {} : { status: 'active' }),
      ...(params.objectiveId ? { objectiveId: params.objectiveId } : {}),
    };

    if (params.search?.trim()) {
      return this.questionBankItemRepository.find({
        where: [
          { ...where, questionText: Like(`%${params.search.trim()}%`) },
          { ...where, difficulty: Like(`%${params.search.trim()}%`) },
        ],
        relations: ['objective'],
        order: { updatedAt: 'DESC' },
        take: 200,
      });
    }

    return this.questionBankItemRepository.find({
      where,
      relations: ['objective'],
      order: { updatedAt: 'DESC' },
      take: 200,
    });
  }

  async upsertQuestionBankItem(params: {
    id?: string;
    courseId: string;
    objectiveId?: string | null;
    type?: QuestionType | 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple_choice' | 'true_false' | 'short_answer';
    questionType?: QuestionType | 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple_choice' | 'true_false' | 'short_answer';
    questionText?: string;
    stem?: string;
    options?: string[] | null;
    correctAnswer: string | number;
    explanation?: string | null;
    points?: number;
    difficulty?: string | null;
    tags?: string[] | null;
    source?: 'manual' | 'ai';
  }): Promise<QuestionBankItem> {
    const questionText = String(params.questionText || params.stem || '').trim();
    if (!questionText) {
      throw new HttpException('Question text is required.', HttpStatus.BAD_REQUEST);
    }

    if (params.objectiveId) {
      const objective = await this.learningObjectiveRepository.findOne({ where: { id: params.objectiveId } });
      if (!objective || objective.courseId !== params.courseId) {
        throw new HttpException('Objective does not belong to this course.', HttpStatus.BAD_REQUEST);
      }
    }

    const questionType = this.normalizeQuestionType((params.questionType || params.type || QuestionType.MULTIPLE_CHOICE) as any);
    const options = params.options ?? null;
    const correctAnswer = this.normalizeCorrectAnswer(options, params.correctAnswer);
    const payload: DeepPartial<QuestionBankItem> = {
      courseId: params.courseId,
      objectiveId: params.objectiveId ?? null,
      questionType,
      questionText,
      options,
      correctAnswer,
      explanation: params.explanation?.trim() || null,
      points: params.points ?? 1,
      difficulty: params.difficulty?.trim() || null,
      tags: this.normalizeTags(params.tags),
      source: params.source ?? 'manual',
      status: 'active',
    };

    if (params.id) {
      const existing = await this.questionBankItemRepository.findOne({ where: { id: params.id } });
      if (!existing) {
        throw new HttpException('Question bank item not found', HttpStatus.NOT_FOUND);
      }
      if (existing.courseId !== params.courseId) {
        throw new HttpException('Question bank item does not belong to this course.', HttpStatus.FORBIDDEN);
      }
      await this.questionBankItemRepository.update({ id: params.id } as any, payload);
      return this.questionBankItemRepository.findOne({ where: { id: params.id }, relations: ['objective'] }) as Promise<QuestionBankItem>;
    }

    const saved = await this.questionBankItemRepository.save(this.questionBankItemRepository.create(payload));
    return this.questionBankItemRepository.findOne({ where: { id: saved.id }, relations: ['objective'] }) as Promise<QuestionBankItem>;
  }

  async archiveQuestionBankItem(id: string, courseId?: string): Promise<{ status: string }> {
    const existing = await this.questionBankItemRepository.findOne({ where: { id } });
    if (!existing) {
      throw new HttpException('Question bank item not found', HttpStatus.NOT_FOUND);
    }
    if (courseId && existing.courseId !== courseId) {
      throw new HttpException('Question bank item does not belong to this course.', HttpStatus.FORBIDDEN);
    }
    await this.questionBankItemRepository.update({ id } as any, { status: 'archived' } as any);
    return { status: 'ok' };
  }

  async importBankItemToQuiz(bankItemId: string, quizId: string, orderIndex?: number): Promise<Question> {
    const bankItem = await this.questionBankItemRepository.findOne({ where: { id: bankItemId } });
    if (!bankItem || bankItem.status === 'archived') {
      throw new HttpException('Question bank item not found', HttpStatus.NOT_FOUND);
    }
    const { quiz, courseId } = await this.getQuizCourseContext(quizId);
    if (bankItem.courseId !== courseId) {
      throw new HttpException('Question bank item does not belong to this quiz course.', HttpStatus.FORBIDDEN);
    }

    let nextOrder = orderIndex;
    if (nextOrder === undefined || nextOrder === null) {
      const existing = await this.questionRepository.find({ where: { quizId: quiz.id } });
      nextOrder = existing.reduce((max, question) => Math.max(max, question.orderIndex ?? -1), -1) + 1;
    }

    return this.createQuestion({
      quizId,
      type: bankItem.questionType,
      stem: bankItem.questionText,
      options: bankItem.options ?? undefined,
      correctAnswer: bankItem.correctAnswer,
      explanation: bankItem.explanation ?? undefined,
      points: bankItem.points,
      orderIndex: nextOrder,
      objectiveId: bankItem.objectiveId ?? undefined,
      bankItemId: bankItem.id,
      difficulty: bankItem.difficulty ?? undefined,
      tags: bankItem.tags ?? undefined,
    } as any);
  }

  async getQuizItemAnalysis(quizId: string): Promise<{
    quizId: string;
    items: Array<{
      questionId: string;
      objectiveId: string | null;
      objectiveTitle: string | null;
      bankItemId: string | null;
      stem: string;
      type: QuestionType;
      difficulty: string | null;
      tags: string[] | null;
      attempts: number;
      responses: number;
      correct: number;
      correctRate: number;
      averagePoints: number;
      maxPoints: number;
    }>;
    objectives: Array<{
      objectiveId: string | null;
      objectiveTitle: string;
      questionCount: number;
      attempts: number;
      responses: number;
      correct: number;
      correctRate: number;
      averagePoints: number;
    }>;
  }> {
    const questions = await this.questionRepository.find({
      where: { quizId, isArchived: false } as any,
      relations: ['objective'],
      order: { orderIndex: 'ASC' },
    });
    const attempts = await this.quizAttemptRepository.find({
      where: { quizId },
      relations: ['items'],
    });
    const completedAttempts = attempts.filter((attempt) => attempt.status !== AttemptStatus.IN_PROGRESS);
    const itemsByQuestion = new Map<string, AttemptItem[]>();
    for (const attempt of completedAttempts) {
      for (const item of attempt.items || []) {
        if (!item.questionId) continue;
        const bucket = itemsByQuestion.get(item.questionId) || [];
        bucket.push(item);
        itemsByQuestion.set(item.questionId, bucket);
      }
    }

    const rows = questions.map((question) => {
      const attemptItems = itemsByQuestion.get(question.id) || [];
      const responses = attemptItems.filter((item) => String(item.response ?? '').trim().length > 0);
      const correct = attemptItems.filter((item) => item.isCorrect === true).length;
      const earned = attemptItems.reduce((sum, item) => sum + Number(item.pointsEarned || 0), 0);
      const maxPoints = Number(question.points || 1);
      return {
        questionId: question.id,
        objectiveId: question.objectiveId ?? null,
        objectiveTitle: question.objective?.title ?? null,
        bankItemId: question.bankItemId ?? null,
        stem: question.questionText,
        type: question.questionType,
        difficulty: question.difficulty ?? null,
        tags: question.tags ?? null,
        attempts: attemptItems.length,
        responses: responses.length,
        correct,
        correctRate: attemptItems.length > 0 ? (correct / attemptItems.length) * 100 : 0,
        averagePoints: attemptItems.length > 0 ? earned / attemptItems.length : 0,
        maxPoints,
      };
    });

    const objectiveMap = new Map<string, { title: string; questionIds: Set<string>; attempts: number; responses: number; correct: number; points: number }>();
    for (const row of rows) {
      const key = row.objectiveId || 'unassigned';
      const current =
        objectiveMap.get(key) ||
        {
          title: row.objectiveTitle || 'Unassigned',
          questionIds: new Set<string>(),
          attempts: 0,
          responses: 0,
          correct: 0,
          points: 0,
        };
      current.questionIds.add(row.questionId);
      current.attempts += row.attempts;
      current.responses += row.responses;
      current.correct += row.correct;
      current.points += row.averagePoints * row.attempts;
      objectiveMap.set(key, current);
    }

    return {
      quizId,
      items: rows,
      objectives: Array.from(objectiveMap.entries()).map(([key, value]) => ({
        objectiveId: key === 'unassigned' ? null : key,
        objectiveTitle: value.title,
        questionCount: value.questionIds.size,
        attempts: value.attempts,
        responses: value.responses,
        correct: value.correct,
        correctRate: value.attempts > 0 ? (value.correct / value.attempts) * 100 : 0,
        averagePoints: value.attempts > 0 ? value.points / value.attempts : 0,
      })),
    };
  }

  async resumeAttempt(userId: string, attemptId: string): Promise<AssessmentAttemptView> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['items'],
    });
    if (!attempt || attempt.userId !== userId) {
      throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
    }
    return this.buildAttemptView(attempt);
  }

  async saveAttemptAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    answer: string | number | (string | number)[] | null,
    expectedRevision?: number,
  ): Promise<any> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const attemptRepo = manager.getRepository(QuizAttempt);
      const itemRepo = manager.getRepository(AttemptItem);
      const attempt = await attemptRepo.findOne({
        where: { id: attemptId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!attempt || attempt.userId !== userId) {
        throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
      }

      const item = await itemRepo.findOne({ where: { attemptId, questionId } });
      if (!item) {
        throw new HttpException('Attempt question not found', HttpStatus.NOT_FOUND);
      }

      const nextResponse = answer === null || answer === undefined
        ? null
        : Array.isArray(answer)
          ? JSON.stringify(this.parseSelectedAnswers(answer))
          : String(answer);
      if (item.isCorrect === true && (item.response ?? null) !== nextResponse) {
        throw new HttpException('Correct answers from an earlier attempt cannot be changed.', HttpStatus.BAD_REQUEST);
      }
      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        if ((item.response ?? null) === nextResponse) {
          return item;
        }
        this.ensureAttemptActive(attempt);
      }
      this.ensureAttemptActive(attempt);

      if (expectedRevision !== undefined && item.responseRevision !== expectedRevision) {
        throw new HttpException('Answer has changed since it was loaded.', HttpStatus.CONFLICT);
      }

      item.response = nextResponse;
      item.responseRevision += 1;
      item.gradingStatus = AttemptItemGradingStatus.UNANSWERED;
      item.isCorrect = null;
      item.pointsEarned = null;
      const savedItem = await itemRepo.save(item);
      await attemptRepo.update({ id: attemptId } as any, { lastSavedAt: new Date() } as any);
      return savedItem;
    });
    return this.shapeAttemptItem(saved);
  }

  async submitAttempt(userId: string, attemptId: string, idempotencyKey?: string): Promise<QuizAttempt> {
    const accessAttempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['quiz'],
    });
    if (!accessAttempt || accessAttempt.userId !== userId) {
      throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
    }
    await this.ensureLearnerCanAttempt(userId, accessAttempt.quiz);

    const saved = await this.dataSource.transaction(async (manager) => {
      const attemptRepo = manager.getRepository(QuizAttempt);
      const itemRepo = manager.getRepository(AttemptItem);
      const attempt = await attemptRepo.findOne({
        where: { id: attemptId },
        relations: ['items', 'quiz'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!attempt || attempt.userId !== userId) {
        throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
      }
      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        return attempt;
      }

      if (idempotencyKey && attempt.idempotencyKey && attempt.idempotencyKey !== idempotencyKey) {
        throw new HttpException('Attempt was submitted with a different idempotency key.', HttpStatus.CONFLICT);
      }

      const now = new Date();
      const deadlineExceeded = attempt.deadlineAt && new Date(attempt.deadlineAt).getTime() < now.getTime();
      let earnedPoints = 0;
      let maxPoints = 0;
      let hasPendingManual = false;
      const answersArray = [];

      for (const item of attempt.items || []) {
        const questionPoints = Number(item.snapshot.points || 1);
        const answer = item.response ?? '';
        const hasAnswer = String(answer).trim().length > 0;
        const hasCorrectKey = item.snapshot.correctAnswer !== null && String(item.snapshot.correctAnswer ?? '').trim().length > 0;
        const autoGradable = item.snapshot.questionType !== QuestionType.SHORT_ANSWER || hasCorrectKey;

        if (!hasAnswer) {
          item.gradingStatus = AttemptItemGradingStatus.AUTO_GRADED;
          item.isCorrect = false;
          item.pointsEarned = 0;
          maxPoints += autoGradable ? questionPoints : 0;
        } else if (autoGradable) {
          const isCorrect = this.isSnapshotAnswerCorrect(item.snapshot, answer);
          item.gradingStatus = AttemptItemGradingStatus.AUTO_GRADED;
          item.isCorrect = isCorrect;
          item.pointsEarned = isCorrect ? questionPoints : 0;
          maxPoints += questionPoints;
          if (isCorrect) earnedPoints += questionPoints;
        } else {
          item.gradingStatus = AttemptItemGradingStatus.PENDING_MANUAL;
          item.isCorrect = null;
          item.pointsEarned = null;
          hasPendingManual = true;
        }

        answersArray.push({
          questionId: item.questionId,
          answer,
          isCorrect: item.isCorrect ?? false,
          graded: item.gradingStatus !== AttemptItemGradingStatus.PENDING_MANUAL,
          pointsEarned: item.pointsEarned ?? 0,
        });
      }

      await itemRepo.save(attempt.items || []);

      const score = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0;
      attempt.score = score;
      attempt.maxScore = maxPoints;
      attempt.passed = hasPendingManual ? null : maxPoints > 0 ? score >= (attempt.quiz?.passingScore || 70) : false;
      attempt.answers = answersArray;
      attempt.status = hasPendingManual
        ? AttemptStatus.PENDING_GRADING
        : deadlineExceeded
          ? AttemptStatus.AUTO_SUBMITTED
          : AttemptStatus.FINALIZED;
      attempt.submittedAt = now;
      attempt.completedAt = hasPendingManual ? null : now;
      attempt.lastSavedAt = now;
      attempt.idempotencyKey = idempotencyKey ?? attempt.idempotencyKey;
      attempt.timeSpentSeconds = Math.max(0, Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000));

      return attemptRepo.save(attempt);
    });

    if (saved.status === AttemptStatus.FINALIZED && saved.passed !== null) {
      const { quiz } = await this.getQuizCourseContext(saved.quizId);
      await this.coursesService.recordAssessmentResult(userId, quiz.lessonId, {
        score: Number(saved.score || 0),
        passed: !!saved.passed,
      });
    } else if (saved.status === AttemptStatus.PENDING_GRADING) {
      await this.notifyPendingManualGrading(saved);
    }

    return saved;
  }

  async gradeAttemptItem(
    attemptId: string,
    itemId: string,
    grade: { pointsEarned: number; isCorrect?: boolean; feedback?: string },
  ): Promise<QuizAttempt> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['items', 'quiz'],
    });
    if (!attempt) {
      throw new HttpException('Attempt not found', HttpStatus.NOT_FOUND);
    }

    const item = (attempt.items || []).find((candidate) => candidate.id === itemId);
    if (!item) {
      throw new HttpException('Attempt item not found', HttpStatus.NOT_FOUND);
    }

    const maxPoints = Number(item.snapshot.points || 1);
    const awarded = Math.max(0, Math.min(maxPoints, Number(grade.pointsEarned || 0)));
    item.pointsEarned = awarded;
    item.isCorrect = grade.isCorrect ?? awarded >= maxPoints;
    item.gradingStatus = AttemptItemGradingStatus.MANUALLY_GRADED;
    if (grade.feedback) {
      item.snapshot = { ...item.snapshot, explanation: grade.feedback };
    }
    await this.attemptItemRepository.save(item);

    let earnedPoints = 0;
    let totalPoints = 0;
    let hasPending = false;
    const answersArray = [];

    for (const current of attempt.items || []) {
      const itemPoints = Number(current.snapshot.points || 1);
      const contributes =
        current.gradingStatus === AttemptItemGradingStatus.AUTO_GRADED ||
        current.gradingStatus === AttemptItemGradingStatus.MANUALLY_GRADED;

      if (current.gradingStatus === AttemptItemGradingStatus.PENDING_MANUAL) {
        hasPending = true;
      }
      if (contributes) {
        totalPoints += itemPoints;
        earnedPoints += Number(current.pointsEarned || 0);
      }

      answersArray.push({
        questionId: current.questionId,
        answer: current.response ?? '',
        isCorrect: current.isCorrect ?? false,
        graded: contributes,
        pointsEarned: Number(current.pointsEarned || 0),
      });
    }

    attempt.answers = answersArray;
    attempt.score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    attempt.maxScore = totalPoints;
    attempt.passed = hasPending ? null : Number(attempt.score || 0) >= (attempt.quiz?.passingScore || 70);
    attempt.status = hasPending ? AttemptStatus.PENDING_GRADING : AttemptStatus.FINALIZED;
    if (!hasPending) {
      attempt.completedAt = new Date();
    }
    attempt.lastSavedAt = new Date();

    const saved = await this.quizAttemptRepository.save(attempt);
    if (saved.status === AttemptStatus.FINALIZED && saved.passed !== null) {
      await this.coursesService.recordAssessmentResult(saved.userId, saved.quiz.lessonId, {
        score: Number(saved.score || 0),
        passed: !!saved.passed,
      });
      await this.notifyLearnerAssessmentFinalized(saved);
    }
    return saved;
  }

  /**
   * Grade an ad-hoc set of persisted questions server-side (used by the
   * client-assembled "module quiz"). Looks each answer up against the stored
   * key and returns only correctness + explanation — never the answer key —
   * so this endpoint cannot be probed to harvest correct answers.
   */
  async gradeQuestions(
    items: Array<{ questionId: string; answer: string | number }>,
  ): Promise<{
    total: number;
    correct: number;
    score: number;
    results: Array<{ questionId: string; isCorrect: boolean; graded: boolean; explanation: string | null }>;
  }> {
    const ids = (items || []).map((i) => i.questionId).filter(Boolean);
    if (ids.length === 0) {
      return { total: 0, correct: 0, score: 0, results: [] };
    }

    const questions = await this.questionRepository.findBy({ id: In(ids) });
    const byId = new Map(questions.map((q) => [q.id, q]));

    let total = 0;
    let correct = 0;
    const results = (items || []).map((item) => {
      const q = byId.get(item.questionId);
      if (!q) {
        return { questionId: item.questionId, isCorrect: false, graded: false, explanation: null };
      }
      total += 1;
      const isCorrect = this.isAnswerCorrect(q, item.answer as any);
      if (isCorrect) correct += 1;
      return { questionId: q.id, isCorrect, graded: true, explanation: q.explanation ?? null };
    });

    const score = total > 0 ? (correct / total) * 100 : 0;
    return { total, correct, score, results };
  }

  /**
   * Return a published knowledge-check quiz for a lesson, with the answer key
   * stripped. Used for formative in-lesson questions.
   */
  async getKnowledgeCheckForLesson(lessonId: string): Promise<any | null> {
    const quiz = await this.quizRepository.findOne({
      where: { lessonId, type: 'knowledge_check', isPublished: true },
      relations: ['questions'],
    });
    if (!quiz) return null;
    return this.normalizeQuiz(quiz, false);
  }

  /**
   * Grade a single knowledge-check answer server-side. The correct answer and
   * explanation are returned only after the learner has submitted, so the
   * answer key cannot be harvested from the initial load.
   */
  async submitKnowledgeCheckAnswer(
    userId: string,
    lessonId: string,
    dto: { questionId: string; answer: string | number },
  ): Promise<{ questionId: string; isCorrect: boolean; explanation: string | null; correctAnswer: string | null }> {
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const quiz = await this.quizRepository.findOne({
      where: { lessonId, type: 'knowledge_check', isPublished: true },
      relations: ['questions'],
    });
    if (!quiz) {
      throw new HttpException('Knowledge check not found', HttpStatus.NOT_FOUND);
    }

    const question = (quiz.questions || []).find((q) => q.id === dto.questionId);
    if (!question) {
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    const isCorrect = this.isAnswerCorrect(question, dto.answer);
    return {
      questionId: question.id,
      isCorrect,
      explanation: question.explanation ?? null,
      correctAnswer: isCorrect ? null : String(question.correctAnswer ?? ''),
    };
  }
}
