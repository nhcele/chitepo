import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { CreateQuizDto, CreateQuestionDto, SubmitQuizAttemptDto, QuestionType } from '@mindelta/shared';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
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

  async findQuizByLesson(lessonId: string, includeAnswers = false): Promise<Quiz | null> {
    const quizzes = await this.quizRepository.find({ where: { lessonId }, relations: ['questions'] });
    if (!quizzes || quizzes.length === 0) return null;

    const preferred =
      quizzes.find((q) => !/\bmodule\s*quiz\b/i.test(String((q as any).title || ''))) ?? quizzes[0];
    return this.normalizeQuiz(preferred as any, includeAnswers) as any;
  }

  async findQuizzesByLesson(lessonId: string, includeAnswers = false): Promise<Quiz[]> {
    const quizzes = await this.quizRepository.find({ where: { lessonId }, relations: ['questions'] });
    return quizzes.map((quiz) => this.normalizeQuiz(quiz, includeAnswers) as any);
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
      questionType: type,
      questionText: (createQuestionDto as any).stem,
      options,
      correctAnswer: normalizedCorrect,
      explanation: createQuestionDto.explanation ?? null,
      points: createQuestionDto.points ?? 1,
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
  }): Promise<Quiz> {
    const { quizId, questions } = params;
    const quizPayload = this.buildQuizPayload(params);

    let quiz: Quiz | null = null;
    if (quizId) {
      quiz = await this.quizRepository.findOne({ where: { id: quizId } });
      if (!quiz) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      await this.quizRepository.update({ id: quizId } as any, quizPayload);
      quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    } else {
      quiz = await this.quizRepository.save(this.quizRepository.create(quizPayload) as any);
    }

    if (!quiz) {
      throw new HttpException('Failed to save quiz', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await this.questionRepository.delete({ quizId: quiz.id } as any);

    const normalizedQuestions = (questions || []).map((q, index) => ({
      quizId: quiz!.id,
      type: this.normalizeQuestionType(q.type),
      stem: q.stem,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points ?? 1,
      orderIndex: q.orderIndex ?? index,
    }));

    for (const q of normalizedQuestions) {
      await this.createQuestion(q as any);
    }

    // Return the full record (with answers) so the instructor editor can round-trip it.
    return this.findQuizById(quiz.id, true);
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
      isPublished: params.isPublished ?? true,
    };
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
  private normalizeCorrectAnswer(options: string[] | null, rawCorrect: string | number): string {
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

  private isAnswerCorrect(question: Question, rawUserAnswer: string | number | undefined): boolean {
    const userAnswer = String(rawUserAnswer ?? '').trim();
    const correctAnswer = String(question.correctAnswer ?? '').trim();

    if (!userAnswer || !correctAnswer) return false;

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

  /**
   * Record an authoritative server-side start time for a quiz attempt so the
   * time limit can be enforced on submit (client-reported time is untrusted).
   */
  async startAttempt(userId: string, quizId: string): Promise<{ startedAt: number; timeLimitMinutes: number | null }> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    if (!quiz.isPublished) {
      throw new HttpException('Quiz is not published.', HttpStatus.FORBIDDEN);
    }
    const startedAt = Date.now();
    const limitMs = quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 * 1000 : 6 * 60 * 60 * 1000;
    // TTL covers the allowed window plus a buffer. Never fail the request if cache is down.
    try {
      await this.cache.set(this.startKey(userId, quizId), startedAt, limitMs + 5 * 60 * 1000);
    } catch {
      /* cache unavailable: timing simply won't be enforced */
    }
    return { startedAt, timeLimitMinutes: quiz.timeLimitMinutes ?? null };
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

    // Enforce max attempts and retake cooldown. 0 (or less) => unlimited / no cooldown.
    const maxAttempts = quiz.maxAttempts ?? 0;
    const cooldownHours = quiz.retakeCooldownHours ?? 0;

    const attempts = await this.quizAttemptRepository.find({
      where: { userId, quizId: submitQuizAttemptDto.quizId },
      order: { createdAt: 'DESC' },
      take: maxAttempts > 0 ? maxAttempts + 1 : 1,
    });

    if (maxAttempts > 0 && attempts.length >= maxAttempts) {
      throw new HttpException('Maximum attempts reached for this quiz.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const lastAttempt = attempts[0];
    if (lastAttempt && !lastAttempt.passed && cooldownHours > 0) {
      const now = new Date();
      const completedAt = lastAttempt.completedAt || lastAttempt.createdAt;
      const msSince = now.getTime() - new Date(completedAt).getTime();
      const requiredMs = cooldownHours * 60 * 60 * 1000;
      if (msSince < requiredMs) {
        const remainingMs = requiredMs - msSince;
        throw new HttpException(
          `Retake cooldown active. Try again in ${Math.ceil(remainingMs / (60 * 1000))} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Authoritative timing / time-limit enforcement (only when the client used the start endpoint).
    const startKey = this.startKey(userId, submitQuizAttemptDto.quizId);
    let startedAtRaw: number | undefined | null;
    try {
      startedAtRaw = await this.cache.get<number>(startKey);
    } catch {
      startedAtRaw = undefined; // cache unavailable -> skip time-limit enforcement
    }
    let timeSpentSeconds = 0;
    let startedAt = new Date();
    if (startedAtRaw) {
      const elapsedMs = Date.now() - Number(startedAtRaw);
      timeSpentSeconds = Math.max(0, Math.round(elapsedMs / 1000));
      startedAt = new Date(Number(startedAtRaw));
      if (quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0) {
        const graceMs = 15 * 1000;
        if (elapsedMs > quiz.timeLimitMinutes * 60 * 1000 + graceMs) {
          try { await this.cache.del(startKey); } catch { /* ignore */ }
          throw new HttpException('Time limit exceeded for this quiz attempt.', HttpStatus.BAD_REQUEST);
        }
      }
    }

    const questions = await this.questionRepository.find({
      where: { quizId: submitQuizAttemptDto.quizId },
    });

    let earnedPoints = 0;
    let maxPoints = 0;
    const answersArray = [];

    questions.forEach((question) => {
      const userAnswer = submitQuizAttemptDto.answers[question.id];
      const questionPoints = question.points || 1;
      const isShortAnswer = question.questionType === QuestionType.SHORT_ANSWER;
      const hasCorrectKey = String(question.correctAnswer || '').trim().length > 0;
      const autoGradable = !isShortAnswer || hasCorrectKey;
      const isCorrect = autoGradable ? this.isAnswerCorrect(question, userAnswer) : false;
      if (autoGradable) {
        maxPoints += questionPoints;
        if (isCorrect) {
          earnedPoints += questionPoints;
        }
      }

      answersArray.push({
        questionId: question.id,
        answer: userAnswer,
        isCorrect,
        graded: autoGradable, // false => awaiting manual/AI grading, not "wrong"
        pointsEarned: isCorrect ? questionPoints : 0,
      });
    });

    // No auto-gradable questions => do NOT auto-pass at 100%.
    const score = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0;
    const maxScore = maxPoints;
    const passed = maxPoints > 0 ? score >= (quiz.passingScore || 70) : false;

    const attempt = this.quizAttemptRepository.create({
      userId,
      quizId: submitQuizAttemptDto.quizId,
      score,
      maxScore,
      passed,
      answers: answersArray,
      startedAt,
      completedAt: new Date(),
      timeSpentSeconds,
    });

    const saved = await this.quizAttemptRepository.save(attempt);
    if (startedAtRaw) {
      try { await this.cache.del(startKey); } catch { /* ignore */ }
    }
    return saved;
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return this.quizAttemptRepository.find({
      where: { userId, quizId },
      order: { createdAt: 'DESC' },
    });
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
}
