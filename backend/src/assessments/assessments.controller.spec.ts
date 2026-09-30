import { ForbiddenException, HttpException } from '@nestjs/common';
import { UserRole } from '@mindelta/shared';
import { AssessmentsController } from './assessments.controller';

const req = (user: { id: string; role: UserRole }) => ({ user }) as any;

describe('AssessmentsController', () => {
  let controller: AssessmentsController;
  let assessmentsService: any;
  let lessonRepo: any;
  let courseRepo: any;
  let enrollmentRepo: any;
  let questionRepo: any;
  let attemptRepo: any;

  beforeEach(() => {
    assessmentsService = {
      findQuizById: jest.fn(),
      findQuizByLesson: jest.fn(),
      getQuizAttempts: jest.fn(),
      gradeQuestions: jest.fn(),
      upsertQuizWithQuestions: jest.fn(),
      setQuizPublished: jest.fn(),
      gradeAttemptItem: jest.fn(),
      getQuizSummary: jest.fn(),
      listObjectives: jest.fn(),
      upsertObjective: jest.fn(),
      listQuestionBankItems: jest.fn(),
      upsertQuestionBankItem: jest.fn(),
      archiveQuestionBankItem: jest.fn(),
      importBankItemToQuiz: jest.fn(),
      getQuizItemAnalysis: jest.fn(),
    };
    lessonRepo = {
      findOne: jest.fn(),
    };
    courseRepo = {
      findOne: jest.fn(),
    };
    enrollmentRepo = {
      findOne: jest.fn(),
    };
    questionRepo = {
      find: jest.fn(),
    };
    attemptRepo = {
      findOne: jest.fn(),
    };

    controller = new AssessmentsController(
      assessmentsService,
      {} as any,
      { getSettings: jest.fn() } as any,
      lessonRepo,
      courseRepo,
      enrollmentRepo,
      questionRepo,
      attemptRepo,
      { get: jest.fn().mockResolvedValue(true), set: jest.fn() } as any,
    );
  });

  it('rejects non-owner instructors reading another learner attempt history', async () => {
    assessmentsService.findQuizById.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1' });
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });

    await expect(
      controller.getQuizAttempts(
        req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }),
        'learner-1',
        'quiz-1',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.getQuizAttempts).not.toHaveBeenCalled();
  });

  it('rejects non-owner instructors using the generic grading endpoint as an answer oracle', async () => {
    questionRepo.find.mockResolvedValue([
      { id: 'question-1', quiz: { lessonId: 'lesson-1' } },
    ]);
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });

    await expect(
      controller.grade(
        req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }),
        { items: [{ questionId: 'question-1', answer: 'A' }] },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.gradeQuestions).not.toHaveBeenCalled();
  });

  it('rejects non-owner instructors upserting quizzes for lessons they do not manage', async () => {
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });

    await expect(
      controller.upsertQuiz(
        req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }),
        {
          lessonId: 'lesson-1',
          title: 'Unauthorized quiz',
          questions: [],
        },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.upsertQuizWithQuestions).not.toHaveBeenCalled();
  });

  it('rejects non-owner instructors publishing quizzes they do not manage', async () => {
    assessmentsService.findQuizById.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1' });
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });

    await expect(
      controller.publishQuiz(req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }), 'quiz-1'),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.setQuizPublished).not.toHaveBeenCalled();
  });

  it('rejects non-owner instructors listing a course question bank', async () => {
    courseRepo.findOne.mockResolvedValue({ id: 'course-1', instructorId: 'owner-instructor' });

    await expect(
      controller.listQuestionBankItems(
        req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }),
        'course-1',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.listQuestionBankItems).not.toHaveBeenCalled();
  });

  it('allows course owners to create learning objectives', async () => {
    courseRepo.findOne.mockResolvedValue({ id: 'course-1', instructorId: 'owner-instructor' });
    assessmentsService.upsertObjective.mockResolvedValue({ id: 'objective-1' });

    await expect(
      controller.upsertObjective(req({ id: 'owner-instructor', role: UserRole.INSTRUCTOR }), {
        courseId: 'course-1',
        title: 'Objective one',
      }),
    ).resolves.toEqual({ id: 'objective-1' });
  });

  it('rejects non-owner instructors grading attempts they do not manage', async () => {
    attemptRepo.findOne.mockResolvedValue({
      id: 'attempt-1',
      quiz: { lessonId: 'lesson-1' },
    });
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });

    await expect(
      controller.gradeAttemptItem(
        req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }),
        'attempt-1',
        'item-1',
        { pointsEarned: 1 },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.gradeAttemptItem).not.toHaveBeenCalled();
  });

  it('rejects non-owner instructors reading quiz summaries they do not manage', async () => {
    assessmentsService.findQuizById.mockResolvedValue({ id: 'quiz-1', lessonId: 'lesson-1' });
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });

    await expect(
      controller.getQuizSummary(req({ id: 'other-instructor', role: UserRole.INSTRUCTOR }), 'quiz-1'),
    ).rejects.toThrow(ForbiddenException);

    expect(assessmentsService.getQuizSummary).not.toHaveBeenCalled();
  });

  it('loads only published lesson quizzes for learners', async () => {
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { courseId: 'course-1' },
    });
    enrollmentRepo.findOne.mockResolvedValue({ id: 'enrollment-1' });
    assessmentsService.findQuizByLesson.mockResolvedValue({ id: 'published-quiz' });

    await controller.getQuizByLesson(req({ id: 'learner-1', role: UserRole.LEARNER }), 'lesson-1');

    expect(assessmentsService.findQuizByLesson).toHaveBeenCalledWith('lesson-1', false, true);
  });

  it('allows owner instructors to load draft lesson quizzes with answers', async () => {
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { course: { instructorId: 'owner-instructor' } },
    });
    assessmentsService.findQuizByLesson.mockResolvedValue({ id: 'draft-quiz' });

    await controller.getQuizByLesson(req({ id: 'owner-instructor', role: UserRole.INSTRUCTOR }), 'lesson-1');

    expect(assessmentsService.findQuizByLesson).toHaveBeenCalledWith('lesson-1', true, false);
  });

  it('hides unpublished quiz attempt history from learners', async () => {
    assessmentsService.findQuizById.mockResolvedValue({
      id: 'draft-quiz',
      lessonId: 'lesson-1',
      isPublished: false,
    });
    lessonRepo.findOne.mockResolvedValue({
      id: 'lesson-1',
      module: { courseId: 'course-1' },
    });
    enrollmentRepo.findOne.mockResolvedValue({ id: 'enrollment-1' });

    await expect(
      controller.getMyQuizAttempts(req({ id: 'learner-1', role: UserRole.LEARNER }), 'draft-quiz'),
    ).rejects.toThrow(HttpException);

    expect(assessmentsService.getQuizAttempts).not.toHaveBeenCalled();
  });
});
