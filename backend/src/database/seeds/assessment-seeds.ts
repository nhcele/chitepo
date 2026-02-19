import { DataSource } from 'typeorm';
import { Lesson } from '../../courses/entities/lesson.entity';
import { Quiz } from '../../assessments/entities/quiz.entity';
import { Question } from '../../assessments/entities/question.entity';
import { QuestionType } from '@mindelta/shared';

async function ensureQuizForLesson(
  dataSource: DataSource,
  lessonTitle: string,
  quizConfig: Partial<Quiz>,
  questions: Array<{
    stem: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    points?: number;
  }>
) {
  const lessonRepo = dataSource.getRepository(Lesson);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(Question);

  // Find the most recently created lesson with this title
  const lesson = await lessonRepo.findOne({
    where: { title: lessonTitle },
    order: { createdAt: 'DESC' as any },
  });

  if (!lesson) {
    console.log(`[assessments:seed] Lesson not found: ${lessonTitle} — skipping`);
    return;
  }

  const existing = await quizRepo.findOne({ where: { lessonId: lesson.id } });
  if (existing) {
    console.log(`[assessments:seed] Quiz already exists for lesson "${lessonTitle}" (${lesson.id}) — skipping`);
    return;
  }

  const quiz = quizRepo.create({
    lessonId: lesson.id,
    title: quizConfig.title || `${lesson.title} — Knowledge Check`,
    description: quizConfig.description || 'Quick check to reinforce key concepts from this lesson.',
    passingScore: quizConfig.passingScore ?? 70,
    timeLimitMinutes: 30, // 30 minutes
    maxAttempts: quizConfig.maxAttempts ?? 3,
    isPublished: true,
  });
  const savedQuiz = await quizRepo.save(quiz);
  console.log(`[assessments:seed] Created quiz for lesson "${lesson.title}": ${savedQuiz.id}`);

  let orderIndex = 1;
  for (const q of questions) {
    const question = questionRepo.create({
      quizId: savedQuiz.id,
      questionType: QuestionType.MULTIPLE_CHOICE,
      questionText: q.stem,
      options: q.options,
      correctAnswer: String(q.correctIndex),
      explanation: q.explanation || null,
      points: q.points ?? 1,
      orderIndex: orderIndex++,
    });
    await questionRepo.save(question);
  }

  console.log(`[assessments:seed] Added ${questions.length} questions to quiz ${savedQuiz.id}`);
}

export async function seedExampleQuizzes(dataSource: DataSource) {
  console.log('[assessments:seed] Seeding example quizzes...');

  await ensureQuizForLesson(
    dataSource,
    'Early Pan-African Movements',
    {
      title: 'Pan-Africanism Basics — Knowledge Check',
      passingScore: 70,
      maxAttempts: 3,
    },
    [
      {
        stem: 'Who is considered one of the founding figures of Pan-Africanism?',
        options: [
          'Nelson Mandela',
          'W.E.B. Du Bois',
          'Thomas Sankara',
          'Patrice Lumumba',
        ],
        correctIndex: 1,
        explanation: 'W.E.B. Du Bois was one of the key organizers of the Pan-African Congresses in the early 20th century.',
      },
      {
        stem: 'What was the main goal of Pan-Africanism?',
        options: [
          'Economic isolation of African countries',
          'Unity and solidarity among African peoples worldwide',
          'Separate development for each African nation',
          'Alignment with European colonial powers',
        ],
        correctIndex: 1,
        explanation: 'Pan-Africanism sought to unite all people of African descent and promote African independence and cooperation.',
      },
      {
        stem: 'The African Union (AU) replaced which organization?',
        options: [
          'League of Nations',
          'United Nations',
          'Organization of African Unity (OAU)',
          'Commonwealth of Nations',
        ],
        correctIndex: 2,
      },
    ]
  );

  await ensureQuizForLesson(
    dataSource,
    'Marx and Historical Materialism',
    {
      title: 'Revolutionary Theory — Quiz',
      passingScore: 70,
      maxAttempts: 3,
    },
    [
      {
        stem: 'What is historical materialism?',
        options: [
          'The study of ancient artifacts',
          'A method analyzing history through material conditions and class struggle',
          'A focus on collecting historical documents',
          'The preservation of cultural heritage',
        ],
        correctIndex: 1,
        explanation: 'Historical materialism examines how economic systems and material conditions shape society and drive historical change.',
      },
      {
        stem: 'According to Marx, what is the primary driver of social change?',
        options: [
          'Ideas and philosophy',
          'Religious beliefs',
          'Class struggle and economic relations',
          'Individual leadership',
        ],
        correctIndex: 2,
      },
      {
        stem: 'What does dialectical materialism refer to?',
        options: [
          'The philosophical framework for understanding change through contradictions',
          'A type of economic policy',
          'A diplomatic negotiation strategy',
          'An educational methodology',
        ],
        correctIndex: 0,
      },
    ]
  );

  console.log('[assessments:seed] Example quizzes seeding completed');
}
