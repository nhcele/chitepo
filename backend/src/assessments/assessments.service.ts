import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
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
  ) {}

  private normalizeQuiz(quiz: Quiz | null): any {
    if (!quiz) return quiz as any;
    const q: any = quiz as any;
    if (q.questions) {
      q.questions = q.questions
        .sort((a: Question, b: Question) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((question: any) => ({
          ...question,
          stem: question.questionText,
          type: question.questionType,
        }));
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

  async findQuizById(id: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
    return this.normalizeQuiz(quiz) as any;
  }

  async findQuizByLesson(lessonId: string): Promise<Quiz | null> {
    const quizzes = await this.quizRepository.find({ where: { lessonId }, relations: ['questions'] });
    if (!quizzes || quizzes.length === 0) return null;

    const preferred =
      quizzes.find((q) => !/\bmodule\s*quiz\b/i.test(String((q as any).title || ''))) ?? quizzes[0];
    return this.normalizeQuiz(preferred as any) as any;
  }

  async findQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
    const quizzes = await this.quizRepository.find({ where: { lessonId }, relations: ['questions'] });
    return quizzes.map((quiz) => this.normalizeQuiz(quiz) as any);
  }

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const options = createQuestionDto.options ?? null;
    const normalizedCorrect = this.normalizeCorrectAnswer(options, (createQuestionDto as any).correctAnswer);

    const questionPayload: DeepPartial<Question> = {
      quizId: createQuestionDto.quizId,
      questionType: (createQuestionDto as any).type,
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

    return this.findQuizById(quiz.id);
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
      maxAttempts: params.maxAttempts ?? 3,
      retakeCooldownHours: params.retakeCooldownHours ?? 24,
      isPublished: params.isPublished ?? true,
    };
  }

  private normalizeCorrectAnswer(options: string[] | null, rawCorrect: string | number): string {
    if (Array.isArray(options) && options.length > 0) {
      const rawStr = typeof rawCorrect === 'number' ? String(rawCorrect) : String(rawCorrect ?? '');
      if (/^\d+$/.test(rawStr)) {
        const idx = Number(rawStr);
        return idx >= 0 && idx < options.length ? String(idx) : '0';
      }
      const idx = options.findIndex((o) => String(o).trim().toLowerCase() === rawStr.trim().toLowerCase());
      return idx >= 0 ? String(idx) : '0';
    }
    return typeof rawCorrect === 'number' ? String(rawCorrect) : String(rawCorrect ?? '');
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

  async submitQuizAttempt(submitQuizAttemptDto: SubmitQuizAttemptDto, userId: string): Promise<QuizAttempt> {
    const quiz = await this.findQuizById(submitQuizAttemptDto.quizId);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Enforce max attempts and retake cooldown
    const maxAttempts = (quiz as any).maxAttempts ?? 3;
    const cooldownHours = (quiz as any).retakeCooldownHours ?? 24;

    const attempts = await this.quizAttemptRepository.find({
      where: { userId, quizId: submitQuizAttemptDto.quizId },
      order: { createdAt: 'DESC' },
      take: maxAttempts + 1,
    });

    if (attempts.length >= maxAttempts) {
      // If they have max attempts and the last is passed, block. If not passed, also block unless policy allows resets (not in MVP)
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
    const questions = await this.questionRepository.find({
      where: { quizId: submitQuizAttemptDto.quizId },
    });

    // Calculate score and create answers array
    let earnedPoints = 0;
    let maxPoints = 0;
    const answersArray = [];

    questions.forEach(question => {
      const userAnswer = submitQuizAttemptDto.answers[question.id];
      const questionPoints = question.points || 1;
      const isShortAnswer = question.questionType === QuestionType.SHORT_ANSWER;
      const hasCorrectKey = String(question.correctAnswer || '').trim().length > 0;
      const autoGradable = !isShortAnswer || hasCorrectKey;
      const isCorrect = autoGradable ? userAnswer === question.correctAnswer : false;
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
        pointsEarned: isCorrect ? questionPoints : 0,
      });
    });

    const score = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 100;
    const maxScore = maxPoints;

    const attempt = this.quizAttemptRepository.create({
      userId,
      quizId: submitQuizAttemptDto.quizId,
      score,
      maxScore,
      passed: score >= (quiz.passingScore || 70),
      answers: answersArray,
      startedAt: new Date(),
      completedAt: new Date(),
      timeSpentSeconds: 0, // This would be calculated from actual start time
    });

    return this.quizAttemptRepository.save(attempt);
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return this.quizAttemptRepository.find({
      where: { userId, quizId },
      order: { createdAt: 'DESC' },
    });
  }
}
