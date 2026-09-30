import { DataSource } from 'typeorm';
import { QuestionType } from '@mindelta/shared';
import { Course } from '../../../courses/entities/course.entity';
import { Lesson } from '../../../courses/entities/lesson.entity';
import { Quiz } from '../../../assessments/entities/quiz.entity';
import { Question } from '../../../assessments/entities/question.entity';

const DCC_COURSE_TITLE = 'District Coordinating Committee (DCC) Training';
const LESSON_TITLE_MATCHES = ['DCC Composition', 'DCC Structure and Composition', 'DCC Structure'];

type QuizQuestionSeed = {
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const questions: QuizQuestionSeed[] = [
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'What is the main purpose of the District Coordinating Committee (DCC)?',
    options: [
      'To replace provincial leadership structures',
      'To coordinate party work between district leadership and grassroots structures',
      'To manage national government ministries directly',
      'To supervise only youth league activities',
    ],
    correctAnswer: '1',
    explanation:
      'The DCC coordinates party organization, mobilization, communication, and implementation between district leadership and lower grassroots structures.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which position is primarily responsible for DCC records, minutes, correspondence, and documentation?',
    options: ['Chairperson', 'Vice-Chairperson', 'Secretary', 'Secretary for Security'],
    correctAnswer: '2',
    explanation:
      'The Secretary manages records, minutes, correspondence, documentation, and administrative continuity for the DCC.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which role focuses most directly on mobilization, recruitment, and organizing party activities?',
    options: ['Finance Secretary', 'Organizing Secretary', 'Secretary for War Veterans', 'Secretary for Information and Publicity'],
    correctAnswer: '1',
    explanation:
      'The Organizing Secretary leads mobilization, recruitment, organizing programmes, and coordination of party activities.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which DCC office is responsible for communication strategy, media liaison, and public information?',
    options: ['Secretary for Security', 'Secretary for Finance', 'Secretary for Information and Publicity', 'Vice-Chairperson'],
    correctAnswer: '2',
    explanation:
      'The Secretary for Information and Publicity handles communication strategy, media liaison, social media, and community information dissemination.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which pair best describes the Chairperson and Vice-Chairperson relationship in a DCC?',
    options: [
      'The Chairperson handles finance while the Vice-Chairperson handles security',
      'The Chairperson provides overall leadership while the Vice-Chairperson assists and acts in their absence',
      'Both roles only attend provincial meetings',
      'The Vice-Chairperson replaces the Secretary in all administrative duties',
    ],
    correctAnswer: '1',
    explanation:
      'The Chairperson provides overall leadership and direction; the Vice-Chairperson supports the Chairperson and acts when the Chairperson is absent.',
  },
  {
    type: QuestionType.TRUE_FALSE,
    questionText: 'The Finance Secretary is responsible for budgeting, financial records, and resource mobilization.',
    options: ['True', 'False'],
    correctAnswer: '0',
    explanation:
      'True. The Finance Secretary manages budgets, accounting, financial reporting, and resource mobilization.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which DCC role is most closely linked to youth league coordination and student outreach?',
    options: ['Secretary for Youth Affairs', 'Secretary for Women\'s Affairs', 'Secretary for Security', 'Finance Secretary'],
    correctAnswer: '0',
    explanation:
      'The Secretary for Youth Affairs coordinates youth mobilization, youth league activities, youth development programmes, and student outreach.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which DCC role focuses on women\'s league coordination and gender mainstreaming?',
    options: ['Secretary for Security', 'Secretary for Women\'s Affairs', 'Organizing Secretary', 'Secretary for War Veterans'],
    correctAnswer: '1',
    explanation:
      'The Secretary for Women\'s Affairs coordinates women\'s league work, gender mainstreaming, empowerment programmes, and family welfare initiatives.',
  },
  {
    type: QuestionType.TRUE_FALSE,
    questionText: 'A properly functioning DCC depends only on the Chairperson; other portfolio secretaries are optional.',
    options: ['True', 'False'],
    correctAnswer: '1',
    explanation:
      'False. DCC effectiveness depends on coordinated work across leadership and portfolio secretaries, with each role handling specific responsibilities.',
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Which statement best describes good DCC composition practice?',
    options: [
      'All offices should duplicate the same responsibilities',
      'Only senior officials should communicate with grassroots structures',
      'Roles should be clearly assigned so leadership, administration, mobilization, finance, and sectoral work are coordinated',
      'Sectoral offices should operate independently without reporting to the DCC',
    ],
    correctAnswer: '2',
    explanation:
      'Good DCC composition gives clear responsibilities to leadership, administrative, finance, organizing, and sectoral offices so the committee works as a coordinated structure.',
  },
];

export async function seedDccCompositionQuiz(dataSource: DataSource) {
  const courseRepo = dataSource.getRepository(Course);
  const lessonRepo = dataSource.getRepository(Lesson);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(Question);

  const course = await courseRepo.findOne({ where: { title: DCC_COURSE_TITLE } });
  if (!course) {
    console.log(`[seed:dcc-composition-quiz] Course not found: ${DCC_COURSE_TITLE}`);
    return;
  }

  const lessons = await lessonRepo.find({
    where: { module: { courseId: course.id } },
    relations: ['module'],
  });
  const lesson = lessons.find((candidate) =>
    LESSON_TITLE_MATCHES.some((title) => candidate.title.toLowerCase().includes(title.toLowerCase())),
  );

  if (!lesson) {
    console.log('[seed:dcc-composition-quiz] DCC composition lesson not found');
    return;
  }

  const existing = await quizRepo.find({ where: { lessonId: lesson.id } });
  for (const quiz of existing) {
    await questionRepo.delete({ quizId: quiz.id } as any);
    await quizRepo.delete({ id: quiz.id } as any);
  }

  const quiz = await quizRepo.save(
    quizRepo.create({
      lessonId: lesson.id,
      title: 'DCC Composition Knowledge Check',
      description: 'Checks understanding of DCC offices, composition, and portfolio responsibilities.',
      passingScore: 70,
      timeLimitMinutes: 15,
      maxAttempts: 3,
      retakeCooldownHours: 0,
      randomizeQuestions: false,
      isPublished: true,
      source: 'manual',
    }),
  );

  await questionRepo.save(
    questions.map((question, index) =>
      questionRepo.create({
        quizId: quiz.id,
        questionType: question.type,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: 1,
        orderIndex: index + 1,
      }),
    ),
  );

  await lessonRepo.update({ id: lesson.id }, { hasQuiz: true, minimumQuizScore: 70 } as any);

  console.log('[seed:dcc-composition-quiz] Created quiz', {
    lesson: lesson.title,
    quizId: quiz.id,
    questions: questions.length,
  });
}
