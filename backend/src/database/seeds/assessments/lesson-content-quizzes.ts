import { DataSource } from 'typeorm';
import { Lesson } from '../../../courses/entities/lesson.entity';
import { Course } from '../../../courses/entities/course.entity';
import { Quiz } from '../../../assessments/entities/quiz.entity';
import { Question } from '../../../assessments/entities/question.entity';
import { QuestionType } from '@mindelta/shared';

type ParsedQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
};

const normalizeContentText = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      const lines: string[] = [];
      parsed.forEach((block: any) => {
        if (!block) return;
        if (block.type === 'heading') {
          lines.push(`## ${block.content || ''}`.trim());
        } else if (block.type === 'text' || block.type === 'code' || block.type === 'quiz') {
          if (block.content) lines.push(String(block.content));
        }
      });
      return lines.join('\n');
    }
  } catch (_e) {
    // fall through to raw
  }
  return raw;
};

const hasAssessmentContent = (raw: string | null) => {
  if (!raw) return false;
  const text = normalizeContentText(raw).toLowerCase();
  return (
    text.includes('assessment') ||
    text.includes('self-assessment') ||
    text.includes('knowledge check') ||
    text.includes('multiple choice') ||
    text.includes('quiz')
  );
};

const extractAssessmentSection = (raw: string) => {
  const text = normalizeContentText(raw);
  const lines = text.split(/\r?\n/);
  const isHeading = (line: string) => {
    const t = line.trim();
    if (!t) return false;
    if (/^#{2,}\s+/.test(t)) return true;
    if (/^\*\*.+\*\*$/.test(t)) return true;
    return false;
  };
  const normalizeHeading = (line: string) =>
    line
      .replace(/^#{2,}\s+/, '')
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/:$/, '')
      .trim()
      .toLowerCase();

  const startMarkers = ['assessment', 'self-assessment', 'knowledge check', 'quiz'];
  const stopMarkers = ['discussion questions', 'reading materials', 'learning objectives', 'lesson content', 'course assessment structure'];

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = normalizeHeading(lines[i]);
    if (startMarkers.includes(h)) {
      start = i + 1;
      break;
    }
    if (h.includes('assessment') && !h.includes('course assessment structure')) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) {
    return '';
  }

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const h = normalizeHeading(lines[i]);
    if (isHeading(lines[i]) && !startMarkers.includes(h) && !h.includes('multiple choice')) {
      end = i;
      break;
    }
    if (stopMarkers.includes(h)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
};

const parseAssessmentQuestions = (raw: string): ParsedQuestion[] => {
  const section = extractAssessmentSection(raw);
  const source = section || normalizeContentText(raw);
  const lines = source.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const questions: ParsedQuestion[] = [];
  let current: ParsedQuestion | null = null;
  let pendingCorrectIndex: number | null = null;

  const questionRegex = /^(?:\d+\.|q\d+[:.)]|question\s+\d+[:.)])\s+(.*)$/i;
  const optionRegex = /^([a-dA-D])[\).]\s+(.*)$/;
  const answerRegex = /^(?:answer|correct answer)[:\s]+([a-dA-D])/i;

  for (const line of lines) {
    const qMatch = line.match(questionRegex);
    if (qMatch) {
      if (current) {
        if (pendingCorrectIndex != null && current.options[pendingCorrectIndex]) {
          current.options = current.options.map((opt, idx) => ({ ...opt, isCorrect: idx === pendingCorrectIndex }));
        }
        questions.push(current);
      }
      current = { question: qMatch[1].trim(), options: [] };
      pendingCorrectIndex = null;
      continue;
    }

    const oMatch = line.match(optionRegex);
    if (oMatch && current) {
      const rawOpt = oMatch[2].trim();
      const isCorrect = /[✓✔]/.test(rawOpt) || /\(correct\)$/i.test(rawOpt);
      const text = rawOpt.replace(/[✓✔]\s*$/, '').replace(/\(correct\)$/i, '').trim();
      current.options.push({ text, isCorrect });
      continue;
    }

    const aMatch = line.match(answerRegex);
    if (aMatch && current) {
      const letter = aMatch[1].toUpperCase();
      pendingCorrectIndex = letter.charCodeAt(0) - 65;
      continue;
    }

    if (current && current.options.length === 0 && line.length > 0) {
      current.question = `${current.question} ${line}`.trim();
    }
  }

  if (current) {
    if (pendingCorrectIndex != null && current.options[pendingCorrectIndex]) {
      current.options = current.options.map((opt, idx) => ({ ...opt, isCorrect: idx === pendingCorrectIndex }));
    }
    questions.push(current);
  }

  return questions;
};

export async function seedQuizzesFromLessonContent(
  dataSource: DataSource,
  opts?: { courseTitleIncludes?: string[] },
) {
  const lessonRepo = dataSource.getRepository(Lesson);
  const courseRepo = dataSource.getRepository(Course);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(Question);

  let lessons: Lesson[] = [];
  if (opts?.courseTitleIncludes && opts.courseTitleIncludes.length > 0) {
    const courses = await courseRepo.find({ relations: ['modules', 'modules.lessons'] });
    const needles = opts.courseTitleIncludes.map((t) => t.toLowerCase());
    const matched = courses.filter((c) => needles.some((n) => c.title.toLowerCase().includes(n)));
    lessons = matched.flatMap((c) => (c.modules || []).flatMap((m) => m.lessons || []));
  } else {
    lessons = await lessonRepo.find();
  }
  let createdQuizzes = 0;
  let createdQuestions = 0;
  let skippedNoAssessment = 0;
  let skippedExisting = 0;

  for (const lesson of lessons) {
    if (!lesson.content || !hasAssessmentContent(lesson.content)) {
      skippedNoAssessment++;
      continue;
    }

    const existing = await quizRepo.findOne({ where: { lessonId: lesson.id } });
    if (existing) {
      skippedExisting++;
      continue;
    }

    const parsedQuestions = parseAssessmentQuestions(lesson.content);
    if (parsedQuestions.length === 0) {
      skippedNoAssessment++;
      continue;
    }

    const quiz = quizRepo.create({
      lessonId: lesson.id,
      title: `${lesson.title} — Knowledge Check`,
      description: 'Quick check to reinforce key concepts from this lesson.',
      passingScore: 70,
      timeLimitMinutes: 30,
      maxAttempts: 3,
      isPublished: true,
    });
    const savedQuiz = await quizRepo.save(quiz);
    createdQuizzes++;

    let orderIndex = 1;
    for (const q of parsedQuestions) {
      if (!q.options.length) continue;
      const correctIndex = q.options.findIndex((opt) => opt.isCorrect);
      if (correctIndex < 0) continue;
      const question = questionRepo.create({
        quizId: savedQuiz.id,
        questionType: QuestionType.MULTIPLE_CHOICE,
        questionText: q.question,
        options: q.options.map((opt) => opt.text),
        correctAnswer: String(correctIndex),
        explanation: q.explanation || null,
        points: 1,
        orderIndex: orderIndex++,
      });
      await questionRepo.save(question);
      createdQuestions++;
    }

    await lessonRepo.update(lesson.id, { hasQuiz: true } as any);
  }

  console.log('[assessments:seed] Quizzes from lesson content complete:', {
    createdQuizzes,
    createdQuestions,
    skippedExisting,
    skippedNoAssessment,
  });
}
