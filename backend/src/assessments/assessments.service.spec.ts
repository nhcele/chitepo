import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttemptItemGradingStatus, AttemptStatus, QuestionType } from '@mindelta/shared';
import { DataSource, Repository } from 'typeorm';
import { CoursesService } from '../courses/courses.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { AttemptItem } from './entities/attempt-item.entity';
import { LearningObjective } from './entities/learning-objective.entity';
import { Question } from './entities/question.entity';
import { QuestionBankItem } from './entities/question-bank-item.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { Quiz } from './entities/quiz.entity';
import { AssessmentsService } from './assessments.service';

const repo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve(value)),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let quizRepo: jest.Mocked<Repository<Quiz>>;
  let questionRepo: jest.Mocked<Repository<Question>>;
  let attemptRepo: jest.Mocked<Repository<QuizAttempt>>;
  let itemRepo: jest.Mocked<Repository<AttemptItem>>;
  let bankRepo: jest.Mocked<Repository<QuestionBankItem>>;
  let enrollmentRepo: jest.Mocked<Repository<Enrollment>>;
  let lessonRepo: jest.Mocked<Repository<Lesson>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let coursesService: jest.Mocked<CoursesService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn((callback) =>
        callback({
          getRepository: (entity: any) => {
            if (entity === QuizAttempt) return attemptRepo;
            if (entity === AttemptItem) return itemRepo;
            return repo();
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: getRepositoryToken(Quiz), useValue: repo() },
        { provide: getRepositoryToken(Question), useValue: repo() },
        { provide: getRepositoryToken(QuizAttempt), useValue: repo() },
        { provide: getRepositoryToken(AttemptItem), useValue: repo() },
        { provide: getRepositoryToken(LearningObjective), useValue: repo() },
        { provide: getRepositoryToken(QuestionBankItem), useValue: repo() },
        { provide: getRepositoryToken(Enrollment), useValue: repo() },
        { provide: getRepositoryToken(Lesson), useValue: repo() },
        { provide: getRepositoryToken(User), useValue: repo() },
        { provide: CoursesService, useValue: { checkLessonAccess: jest.fn(), recordAssessmentResult: jest.fn() } },
        { provide: NotificationsService, useValue: { sendEmail: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get(AssessmentsService);
    quizRepo = module.get(getRepositoryToken(Quiz));
    questionRepo = module.get(getRepositoryToken(Question));
    attemptRepo = module.get(getRepositoryToken(QuizAttempt));
    itemRepo = module.get(getRepositoryToken(AttemptItem));
    bankRepo = module.get(getRepositoryToken(QuestionBankItem));
    enrollmentRepo = module.get(getRepositoryToken(Enrollment));
    lessonRepo = module.get(getRepositoryToken(Lesson));
    userRepo = module.get(getRepositoryToken(User));
    coursesService = module.get(CoursesService);
    notificationsService = module.get(NotificationsService);
  });

  it('rejects starting a quiz when the learner is not enrolled', async () => {
    quizRepo.findOne.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1', isPublished: true, questions: [] } as any);
    lessonRepo.findOne.mockResolvedValue({ id: 'lesson-1', module: { courseId: 'course-1' } } as any);
    enrollmentRepo.findOne.mockResolvedValue(null);

    await expect(service.startAttempt('user-1', 'quiz-1')).rejects.toThrow(HttpException);
  });

  it('archives old questions instead of deleting them when upserting a quiz', async () => {
    quizRepo.findOne.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1' } as any);
    questionRepo.create.mockImplementation((value) => value as any);
    questionRepo.save.mockImplementation((value) => Promise.resolve({ id: 'question-new', ...value } as any));

    await service.upsertQuizWithQuestions({
      quizId: 'quiz-1',
      lessonId: 'lesson-1',
      title: 'Quiz',
      questions: [
        {
          type: QuestionType.MULTIPLE_CHOICE,
          stem: 'Question?',
          options: ['A', 'B'],
          correctAnswer: 0,
        },
      ],
    });

    expect(questionRepo.update).toHaveBeenCalledWith({ quizId: 'quiz-1' }, { isArchived: true });
    expect(questionRepo.delete).not.toHaveBeenCalled();
  });

  it('preserves publication state when editing an existing quiz without an explicit status', async () => {
    quizRepo.findOne.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1', isPublished: true } as any);
    questionRepo.create.mockImplementation((value) => value as any);
    questionRepo.save.mockImplementation((value) => Promise.resolve({ id: 'question-new', ...value } as any));

    await service.upsertQuizWithQuestions({
      quizId: 'quiz-1',
      lessonId: 'lesson-1',
      title: 'Published quiz',
      questions: [
        {
          type: QuestionType.MULTIPLE_CHOICE,
          stem: 'Question?',
          options: ['A', 'B'],
          correctAnswer: 0,
        },
      ],
    });

    expect(quizRepo.update).toHaveBeenCalledWith(
      { id: 'quiz-1' },
      expect.objectContaining({ isPublished: true }),
    );
  });

  it('rejects publishing a quiz with no active questions', async () => {
    quizRepo.findOne.mockResolvedValue({
      id: 'quiz-1',
      lessonId: 'lesson-1',
      isPublished: false,
      questions: [{ id: 'question-1', isArchived: true }],
    } as any);

    await expect(service.setQuizPublished('quiz-1', true)).rejects.toThrow(HttpException);
    expect(quizRepo.update).not.toHaveBeenCalled();
  });

  it('filters unpublished quizzes from learner-facing lesson lookups', async () => {
    quizRepo.find.mockResolvedValue([
      { id: 'draft-quiz', lessonId: 'lesson-1', title: 'Draft quiz', isPublished: false, questions: [] },
      { id: 'published-quiz', lessonId: 'lesson-1', title: 'Published quiz', isPublished: true, questions: [] },
    ] as any);

    const quiz = await service.findQuizByLesson('lesson-1', false, true);
    const quizzes = await service.findQuizzesByLesson('lesson-1', false, true);

    expect(quiz?.id).toBe('published-quiz');
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].id).toBe('published-quiz');
  });

  it('records authoritative lesson progress when an attempt finalizes', async () => {
    const quiz = { id: 'quiz-1', lessonId: 'lesson-1', isPublished: true, passingScore: 70 };
    const attempt = {
      id: 'attempt-1',
      userId: 'user-1',
      quizId: 'quiz-1',
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      deadlineAt: null,
      quiz,
      items: [
        {
          id: 'item-1',
          attemptId: 'attempt-1',
          questionId: 'question-1',
          response: '0',
          snapshot: {
            questionId: 'question-1',
            questionType: QuestionType.MULTIPLE_CHOICE,
            questionText: 'Question?',
            options: ['A', 'B'],
            correctAnswer: '0',
            explanation: null,
            points: 1,
            version: 1,
          },
          gradingStatus: AttemptItemGradingStatus.UNANSWERED,
          isCorrect: null,
          pointsEarned: null,
        },
      ],
    };

    attemptRepo.findOne
      .mockResolvedValueOnce(attempt as any)
      .mockResolvedValueOnce(attempt as any);
    itemRepo.save.mockResolvedValue(attempt.items as any);
    attemptRepo.save.mockImplementation((value) => Promise.resolve(value as any));
    lessonRepo.findOne.mockResolvedValue({ id: 'lesson-1', module: { courseId: 'course-1' } } as any);
    enrollmentRepo.findOne.mockResolvedValue({ id: 'enrollment-1', userId: 'user-1', courseId: 'course-1' } as any);
    coursesService.checkLessonAccess.mockResolvedValue({ hasAccess: true } as any);
    quizRepo.findOne.mockResolvedValue(quiz as any);

    const result = await service.submitAttempt('user-1', 'attempt-1');

    expect(result.status).toBe(AttemptStatus.FINALIZED);
    expect(result.passed).toBe(true);
    expect(coursesService.recordAssessmentResult).toHaveBeenCalledWith('user-1', 'lesson-1', {
      score: 100,
      passed: true,
    });
  });

  it('notifies the learner when manual grading finalizes an attempt', async () => {
    const attempt = {
      id: 'attempt-1',
      userId: 'user-1',
      quizId: 'quiz-1',
      status: AttemptStatus.PENDING_GRADING,
      score: null,
      maxScore: null,
      passed: null,
      answers: [],
      quiz: { id: 'quiz-1', lessonId: 'lesson-1', passingScore: 70 },
      items: [
        {
          id: 'item-1',
          attemptId: 'attempt-1',
          questionId: 'question-1',
          response: 'Written answer',
          snapshot: {
            questionId: 'question-1',
            questionType: QuestionType.SHORT_ANSWER,
            questionText: 'Explain',
            options: null,
            correctAnswer: null,
            explanation: null,
            points: 5,
            version: 1,
          },
          gradingStatus: AttemptItemGradingStatus.PENDING_MANUAL,
          isCorrect: null,
          pointsEarned: null,
        },
      ],
    };
    attemptRepo.findOne.mockResolvedValue(attempt as any);
    itemRepo.save.mockResolvedValue({ ...attempt.items[0], pointsEarned: 5 } as any);
    attemptRepo.save.mockImplementation((value) => Promise.resolve(value as any));
    userRepo.findOne.mockResolvedValue({ id: 'user-1', email: 'learner@example.com' } as any);
    quizRepo.findOne.mockResolvedValue({ id: 'quiz-1', title: 'Quiz', lessonId: 'lesson-1' } as any);
    lessonRepo.findOne.mockResolvedValue({ id: 'lesson-1', module: { courseId: 'course-1' } } as any);

    await service.gradeAttemptItem('attempt-1', 'item-1', { pointsEarned: 5 });

    expect(coursesService.recordAssessmentResult).toHaveBeenCalledWith('user-1', 'lesson-1', {
      score: 100,
      passed: true,
    });
    expect(notificationsService.sendEmail).toHaveBeenCalledWith(
      'learner@example.com',
      'Assessment result available: Quiz',
      expect.stringContaining('Your assessment has been graded'),
    );
  });

  it('rejects stale autosave revisions', async () => {
    attemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      status: AttemptStatus.IN_PROGRESS,
      deadlineAt: null,
    } as any);
    itemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      responseRevision: 2,
    } as any);

    await expect(
      service.saveAttemptAnswer('user-1', 'attempt-1', 'question-1', 'New answer', 1),
    ).rejects.toThrow(HttpException);

    expect(itemRepo.save).not.toHaveBeenCalled();
    expect(attemptRepo.update).not.toHaveBeenCalled();
  });

  it('lists pending grading attempts with attempt items', async () => {
    const attempt = {
      id: 'attempt-1',
      userId: 'user-1',
      quizId: 'quiz-1',
      status: AttemptStatus.PENDING_GRADING,
      deadlineAt: null,
      items: [
        {
          id: 'item-1',
          attemptId: 'attempt-1',
          questionId: 'question-1',
          orderIndex: 0,
          response: 'Written answer',
          responseRevision: 1,
          snapshot: {
            questionId: 'question-1',
            questionType: QuestionType.SHORT_ANSWER,
            questionText: 'Explain',
            options: null,
            correctAnswer: null,
            explanation: null,
            points: 5,
            version: 1,
          },
          gradingStatus: AttemptItemGradingStatus.PENDING_MANUAL,
          isCorrect: null,
          pointsEarned: null,
        },
      ],
    };
    attemptRepo.find.mockResolvedValue([attempt] as any);

    const result = await service.listPendingGradingAttempts('quiz-1');

    expect(attemptRepo.find).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1', status: AttemptStatus.PENDING_GRADING },
      relations: ['items', 'quiz'],
      order: { submittedAt: 'ASC', createdAt: 'ASC' },
      take: 100,
    });
    expect(result[0].items[0]).toMatchObject({
      id: 'item-1',
      gradingStatus: AttemptItemGradingStatus.PENDING_MANUAL,
      response: 'Written answer',
    });
  });

  it('summarizes quiz attempts for reporting', async () => {
    attemptRepo.find.mockResolvedValue([
      { status: AttemptStatus.IN_PROGRESS, score: null, passed: null, timeSpentSeconds: 0 },
      { status: AttemptStatus.PENDING_GRADING, score: 50, passed: null, timeSpentSeconds: 120 },
      { status: AttemptStatus.FINALIZED, score: 80, passed: true, timeSpentSeconds: 300 },
      { status: AttemptStatus.AUTO_SUBMITTED, score: 40, passed: false, timeSpentSeconds: 180 },
    ] as any);

    const summary = await service.getQuizSummary('quiz-1');

    expect(summary).toMatchObject({
      quizId: 'quiz-1',
      totalAttempts: 4,
      inProgressAttempts: 1,
      pendingGradingAttempts: 1,
      finalizedAttempts: 2,
      passedAttempts: 1,
      failedAttempts: 1,
      passRate: 50,
      averageScore: 60,
      averageTimeSpentSeconds: 200,
    });
  });

  it('imports a bank item into a quiz with objective metadata', async () => {
    bankRepo.findOne.mockResolvedValue({
      id: 'bank-1',
      courseId: 'course-1',
      objectiveId: 'objective-1',
      questionType: QuestionType.MULTIPLE_CHOICE,
      questionText: 'Reusable question?',
      options: ['A', 'B'],
      correctAnswer: '1',
      explanation: 'Because B',
      points: 2,
      difficulty: 'medium',
      tags: ['tag'],
      status: 'active',
    } as any);
    quizRepo.findOne.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1' } as any);
    lessonRepo.findOne.mockResolvedValue({ id: 'lesson-1', module: { courseId: 'course-1' } } as any);
    questionRepo.find.mockResolvedValue([{ orderIndex: 0 }] as any);
    questionRepo.create.mockImplementation((value) => value as any);
    questionRepo.save.mockImplementation((value) => Promise.resolve({ id: 'question-1', ...value } as any));

    const result = await service.importBankItemToQuiz('bank-1', 'quiz-1');

    expect(result).toMatchObject({
      quizId: 'quiz-1',
      objectiveId: 'objective-1',
      bankItemId: 'bank-1',
      questionText: 'Reusable question?',
      orderIndex: 1,
      difficulty: 'medium',
      tags: ['tag'],
    });
  });

  it('returns item analysis grouped by learning objective', async () => {
    questionRepo.find.mockResolvedValue([
      {
        id: 'question-1',
        quizId: 'quiz-1',
        objectiveId: 'objective-1',
        bankItemId: 'bank-1',
        questionText: 'Question one',
        questionType: QuestionType.MULTIPLE_CHOICE,
        points: 2,
        difficulty: 'easy',
        tags: ['tag'],
        objective: { title: 'Objective one' },
      },
    ] as any);
    attemptRepo.find.mockResolvedValue([
      {
        status: AttemptStatus.FINALIZED,
        items: [
          { questionId: 'question-1', response: '1', isCorrect: true, pointsEarned: 2 },
          { questionId: 'question-1', response: '0', isCorrect: false, pointsEarned: 0 },
        ],
      },
    ] as any);

    const analysis = await service.getQuizItemAnalysis('quiz-1');

    expect(analysis.items[0]).toMatchObject({
      questionId: 'question-1',
      objectiveTitle: 'Objective one',
      attempts: 2,
      responses: 2,
      correct: 1,
      correctRate: 50,
      averagePoints: 1,
    });
    expect(analysis.objectives[0]).toMatchObject({
      objectiveId: 'objective-1',
      objectiveTitle: 'Objective one',
      questionCount: 1,
      correctRate: 50,
    });
  });

  it('grades multiple-choice selections as an exact set regardless of order', () => {
    const question = {
      options: ['A', 'B', 'C'],
      correctAnswer: '["0","2"]',
      questionType: QuestionType.MULTIPLE_CHOICE,
    } as Question;

    expect((service as any).isAnswerCorrect(question, ['2', '0'])).toBe(true);
    expect((service as any).isAnswerCorrect(question, ['0'])).toBe(false);
    expect((service as any).isAnswerCorrect(question, ['0', '1', '2'])).toBe(false);
  });

  it('prevents carried-forward correct answers from being changed', async () => {
    attemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      status: AttemptStatus.IN_PROGRESS,
      deadlineAt: null,
    } as any);
    itemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      response: '0',
      responseRevision: 0,
      isCorrect: true,
    } as any);

    await expect(service.saveAttemptAnswer('user-1', 'attempt-1', 'question-1', '1')).rejects.toThrow(
      'Correct answers from an earlier attempt cannot be changed.',
    );
    expect(itemRepo.save).not.toHaveBeenCalled();
  });

  it('serializes multiple-choice selections when autosaving', async () => {
    attemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      status: AttemptStatus.IN_PROGRESS,
      deadlineAt: null,
    } as any);
    itemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      response: null,
      responseRevision: 0,
      snapshot: { questionId: 'question-1' },
    } as any);
    itemRepo.save.mockImplementation((value) => Promise.resolve(value as any));

    await service.saveAttemptAnswer('user-1', 'attempt-1', 'question-1', ['2', '0']);

    expect(itemRepo.save).toHaveBeenCalledWith(expect.objectContaining({ response: '["0","2"]' }));
  });

  describe('knowledge checks', () => {
    it('returns a published knowledge-check quiz with answers stripped', async () => {
      const quiz = {
        id: 'quiz-kc',
        lessonId: 'lesson-1',
        type: 'knowledge_check',
        isPublished: true,
        randomizeQuestions: false,
        questions: [
          {
            id: 'question-1',
            questionText: 'Which is correct?',
            questionType: QuestionType.MULTIPLE_CHOICE,
            options: ['A', 'B'],
            correctAnswer: '0',
            explanation: 'A is correct.',
            orderIndex: 0,
            isArchived: false,
          },
        ],
      };
      quizRepo.findOne.mockResolvedValue(quiz as any);

      const result = await service.getKnowledgeCheckForLesson('lesson-1');

      expect(result).toMatchObject({ id: 'quiz-kc', type: 'knowledge_check' });
      expect(result.questions[0]).not.toHaveProperty('correctAnswer');
      expect(result.questions[0]).not.toHaveProperty('explanation');
    });

    it('returns null when no knowledge-check quiz exists', async () => {
      quizRepo.findOne.mockResolvedValue(null);

      const result = await service.getKnowledgeCheckForLesson('lesson-1');

      expect(result).toBeNull();
    });

    it('grades a knowledge-check answer server-side', async () => {
      const quiz = {
        id: 'quiz-kc',
        lessonId: 'lesson-1',
        type: 'knowledge_check',
        isPublished: true,
        questions: [
          {
            id: 'question-1',
            questionText: 'Which is correct?',
            questionType: QuestionType.MULTIPLE_CHOICE,
            options: ['A', 'B'],
            correctAnswer: '0',
            explanation: 'A is correct.',
          },
        ],
      };
      quizRepo.findOne.mockResolvedValue(quiz as any);

      const correct = await service.submitKnowledgeCheckAnswer('user-1', 'lesson-1', {
        questionId: 'question-1',
        answer: '0',
      });
      expect(correct.isCorrect).toBe(true);
      expect(correct.correctAnswer).toBeNull();

      const wrong = await service.submitKnowledgeCheckAnswer('user-1', 'lesson-1', {
        questionId: 'question-1',
        answer: '1',
      });
      expect(wrong.isCorrect).toBe(false);
      expect(wrong.correctAnswer).toBe('0');
    });
  });
});
