import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Course } from '../../../courses/entities/course.entity';
import { Quiz } from '../../../assessments/entities/quiz.entity';
import { Question } from '../../../assessments/entities/question.entity';
import { Lesson } from '../../../courses/entities/lesson.entity';
import { QuestionType } from '@mindelta/shared';

type ParsedQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
};

type ParsedLesson = {
  title: string;
  assessmentSection: string;
  questions: ParsedQuestion[];
  content?: string;
};

const isHeadingLine = (line: string) => {
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

const ALLOWED_SUBHEADINGS = [
  'multiple choice',
  'short answer',
  'true/false',
  'true false',
  'essay questions',
  'case analysis',
  'case study',
  'practical scenario',
  'questions',
];

const isAllowedSubheading = (heading: string) =>
  ALLOWED_SUBHEADINGS.some((h) => heading === h || heading.includes(h));

const LESSON_TITLE_MAPPING: Record<string, string[]> = {
  // Module 1: Political Mobilization and Organization
  'History and Evolution of DCCs in Zimbabwe': [
    'Grassroots Organizing Fundamentals',
    'History and Evolution',
  ],
  'DCC Structure and Composition': [
    'Ward-Based Mobilization Strategies',
    'DCC Structure',
  ],
  'Ward-Based Coordination and Cell Structures': [
    'Cell Structure Development',
    'Ward-Based Coordination',
  ],
  // Module 2: Party-Government Coordination
  'Understanding Party-Government Relations': [
    'Understanding District Administrative Structures',
    'Party-Government Relations',
  ],
  'Community Development Project Coordination': [
    'Coordinating with Rural District Councils',
    'Community Development',
  ],
};

const mapLessonTitle = (markdownTitle: string, dbTitle: string): boolean => {
  if (markdownTitle.toLowerCase() === dbTitle.toLowerCase()) return true;

  for (const [markdownKey, dbTitles] of Object.entries(LESSON_TITLE_MAPPING)) {
    if (markdownTitle.includes(markdownKey) || markdownKey.includes(markdownTitle)) {
      if (dbTitles.some((t) => dbTitle.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(dbTitle.toLowerCase()))) {
        return true;
      }
    }
  }

  const markdownWords = markdownTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const dbWords = dbTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const matchingWords = markdownWords.filter((mw) =>
    dbWords.some((dw) => mw.includes(dw) || dw.includes(mw))
  );
  return matchingWords.length >= Math.min(2, Math.min(markdownWords.length, dbWords.length));
};

const extractAssessmentSection = (lessonBlock: string) => {
  const lines = lessonBlock.split(/\r?\n/);
  const startMarkers = ['assessment', 'assessment quiz', 'assessment questions', 'self-assessment', 'knowledge check', 'quiz'];
  const stopMarkers = ['discussion questions', 'reading materials', 'learning objectives', 'lesson content', 'course assessment structure'];

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!isHeadingLine(lines[i])) continue;
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
  if (start === -1) return '';

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const h = normalizeHeading(lines[i]);
    if (isHeadingLine(lines[i]) && !startMarkers.includes(h) && !isAllowedSubheading(h)) {
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

const parseAssessmentQuestions = (section: string): ParsedQuestion[] => {
  const lines = section.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];
  let current: ParsedQuestion | null = null;
  let pendingCorrectIndex: number | null = null;
  let mode: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'case' | 'unknown' = 'unknown';

  const questionRegex = /^(?:\d+\.|q\d+[:.)]|question\s+\d+[:.)])\s+(.*)$/i;
  const optionRegex = /^([a-dA-D])[\).]\s+(.*)$/;
  const answerRegex = /^(?:answer|correct answer)[:\s]+([a-dA-D])/i;

  for (const line of lines) {
    if (isHeadingLine(line)) {
      const heading = normalizeHeading(line);
      if (heading.includes('multiple choice')) mode = 'multiple-choice';
      else if (heading.includes('true/false') || heading.includes('true false')) mode = 'true-false';
      else if (heading.includes('short answer') || heading.includes('essay') || heading === 'questions') mode = 'short-answer';
      else if (heading.includes('case')) mode = 'case';
      continue;
    }

    const qMatch = line.match(questionRegex);
    if (qMatch) {
      if (current) {
        if (pendingCorrectIndex != null && current.options[pendingCorrectIndex]) {
          current.options = current.options.map((opt, idx) => ({ ...opt, isCorrect: idx === pendingCorrectIndex }));
        }
        questions.push(current);
      }
      const rawQuestion = qMatch[1].trim();
      let questionText = rawQuestion;
      let options: { text: string; isCorrect: boolean }[] = [];
      let explanation: string | undefined;
      const tfInlineMatch = rawQuestion.match(/\((true|false)(?:\s*-\s*([^)]+))?\)/i);
      if (tfInlineMatch) {
        const isTrue = tfInlineMatch[1].toLowerCase() === 'true';
        options = [
          { text: 'True', isCorrect: isTrue },
          { text: 'False', isCorrect: !isTrue },
        ];
        if (tfInlineMatch[2]) {
          explanation = tfInlineMatch[2].trim();
        }
        questionText = rawQuestion.replace(/\((true|false)(?:\s*-\s*[^)]+)?\)/i, '').trim();
      }
      current = { question: questionText, options, explanation };
      pendingCorrectIndex = null;
      continue;
    }

    const oMatch = line.match(optionRegex);
    if (oMatch && current) {
      if (mode === 'multiple-choice' || mode === 'true-false') {
        const rawOpt = oMatch[2].trim();
        const isCorrect = /[✓✔]/.test(rawOpt) || /\(correct\)$/i.test(rawOpt);
        const text = rawOpt.replace(/[✓✔]\s*$/, '').replace(/\(correct\)$/i, '').trim();
        current.options.push({ text, isCorrect });
        continue;
      }
      if (current.options.length === 0) {
        current.question = `${current.question} ${line}`.trim();
        continue;
      }
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

const parseMarkdownLessons = (markdown: string): ParsedLesson[] => {
  const lines = markdown.split(/\r?\n/);
  const lessons: ParsedLesson[] = [];
  let currentTitle: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentTitle) return;
    const block = buffer.join('\n');
    const assessmentSection = extractAssessmentSection(block);
    const questions = assessmentSection ? parseAssessmentQuestions(assessmentSection) : [];
    lessons.push({ title: currentTitle, assessmentSection, questions, content: block });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('### Lesson')) {
      flush();
      currentTitle = line.replace(/^### Lesson\s+\d+\.\d+:\s*/, '').trim();
      buffer = [];
      continue;
    }
    if (currentTitle) buffer.push(lines[i]);
  }
  flush();
  return lessons;
};

const buildFallbackQuestions = (lessonTitle: string, assessmentSection: string): ParsedQuestion[] => {
  const lines = (assessmentSection || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let prompt = '';
  for (const line of lines) {
    if (isHeadingLine(line)) continue;
    const cleaned = line.replace(/^\d+\.\s+/, '').trim();
    if (cleaned.length > 0) {
      prompt = cleaned;
      break;
    }
  }
  if (!prompt) {
    prompt = `Summarize the key takeaways from "${lessonTitle}".`;
  }
  return [{ question: prompt, options: [] as { text: string; isCorrect: boolean }[], explanation: undefined }];
};

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isQuestionLikeText = (text: string) =>
  /^(explain|describe|discuss|list|outline|identify|what|how|why|who|when|where)\b/i.test(text) ||
  text.trim().endsWith('?');

const isEssayLikeQuestion = (text: string) =>
  /\b(explain|describe|discuss|analyze|outline|evaluate|compare|justify|summarize|assess)\b/i.test(text) ||
  /\b\d+\s*words?\b/i.test(text) ||
  text.length > 160;

const filterOptions = (
  questionText: string,
  options: { text: string; isCorrect: boolean }[],
) => {
  const questionNorm = normalizeText(questionText);
  const seen = new Set<string>();
  return options.filter((opt) => {
    const text = String(opt.text || '').trim();
    if (!text) return false;
    const optionNorm = normalizeText(text);
    if (!optionNorm) return false;
    if (optionNorm === questionNorm) return false;
    if (questionNorm.includes(optionNorm) || optionNorm.includes(questionNorm)) return false;
    if (isQuestionLikeText(text)) return false;
    if (/\bwords?\b/i.test(text)) return false;
    if (text.length > 180) return false;
    if (seen.has(optionNorm)) return false;
    seen.add(optionNorm);
    return true;
  });
};

const extractCandidatePhrases = (block: string): string[] => {
  const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const phrases: string[] = [];
  const isQuestionLike = (text: string) => isQuestionLikeText(text);
  const stopTokens = new Set([
    'duration',
    'learning objectives',
    'lesson content',
    'discussion questions',
    'assessment',
    'assessment quiz',
    'assessment questions',
    'self-assessment',
    'knowledge check',
    'practical exercise',
  ]);

  for (const line of lines) {
    if (/^#{2,}\s+/.test(line)) continue;
    const cleanLine = line.replace(/^[\-\d\.\)\s]+/, '').trim();
    if (!cleanLine) continue;

    const boldMatches = [...cleanLine.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
    for (const bold of boldMatches) {
      const lower = bold.toLowerCase();
      if (stopTokens.has(lower)) continue;
      if (bold.length >= 4 && bold.length <= 100 && !isQuestionLike(bold) && !bold.endsWith('?')) {
        phrases.push(bold);
      }
    }

    if (/^[-•]/.test(line) || /^\d+[\).\s]/.test(line)) {
      const parts = cleanLine.split(/\s+-\s+/);
      const candidate = (parts[0] || cleanLine).trim();
      if (
        candidate.length >= 4 &&
        candidate.length <= 120 &&
        !isQuestionLike(candidate) &&
        !candidate.endsWith('?')
      ) {
        phrases.push(candidate);
      }
    }
  }

  return Array.from(new Set(phrases));
};
export async function seedDccQuizzesFromMarkdown(
  dataSource: DataSource,
  opts?: { replaceExisting?: boolean },
) {
  const courseRepo = dataSource.getRepository(Course);
  const lessonRepo = dataSource.getRepository(Lesson);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(Question);

  const dccCourse = await courseRepo.findOne({
    where: { title: 'District Coordinating Committee (DCC) Training' },
    relations: ['modules', 'modules.lessons'],
  });
  if (!dccCourse) {
    console.log('[dcc:quiz:markdown] DCC Training course not found, skipping');
    return;
  }

  const markdownPath = join(__dirname, '../course-content/dcc-training-lessons.md');
  const markdown = readFileSync(markdownPath, 'utf-8');
  const parsedLessons = parseMarkdownLessons(markdown);
  const used = new Set<string>();
  let cursor = 0;

  let createdQuizzes = 0;
  let createdQuestions = 0;
  let skippedExisting = 0;
  let skippedNoAssessment = 0;
  let replacedQuizzes = 0;

  const sortedModules = (dccCourse.modules || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const allLessonTitles = sortedModules
    .flatMap((m) => (m.lessons || []).map((l) => l.title))
    .filter(Boolean);

  const pickDeterministic = (pool: string[], seed: string, count: number) => {
    if (pool.length === 0) return [];
    const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const start = hash % pool.length;
    const chosen: string[] = [];
    for (let i = 0; i < pool.length && chosen.length < count; i++) {
      const candidate = pool[(start + i) % pool.length];
      if (!chosen.includes(candidate)) chosen.push(candidate);
    }
    return chosen;
  };

  const globalCandidates = Array.from(
    new Set(
      parsedLessons.flatMap((pl) =>
        extractCandidatePhrases(
          pl.assessmentSection
            ? (pl.content || '').replace(pl.assessmentSection, '')
            : pl.content || '',
        ),
      ),
    ),
  );

  const buildSmartFallbackOptions = (
    questionText: string,
    lessonTitle: string,
    candidatePool: string[],
  ) => {
    const questionNorm = normalizeText(questionText);
    const lessonKeywords = normalizeText(lessonTitle)
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    const filtered = candidatePool.filter((c) => {
      const norm = normalizeText(c);
      if (!norm) return false;
      if (questionNorm.includes(norm) || norm.includes(questionNorm)) return false;
      if (isQuestionLikeText(c)) return false;
      return true;
    });
    if (filtered.length === 0) {
      const others = allLessonTitles.filter((t) => t !== lessonTitle);
      const distractors = pickDeterministic(others, `${lessonTitle}-${questionText}`, 3);
      const correctText = `Key points from "${lessonTitle}".`;
      const options = [
        { text: correctText, isCorrect: true },
        ...distractors.map((t) => ({
          text: `Key points from "${t}".`,
          isCorrect: false,
        })),
      ];
      while (options.length < 4) {
        options.push({ text: 'Not covered in the DCC training curriculum.', isCorrect: false });
      }
      return options;
    }

    const scored = filtered.map((c) => {
      const lower = c.toLowerCase();
      const score = lessonKeywords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
      return { text: c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const correct = scored[0]?.text ?? filtered[0];
    const distractPool = filtered.filter((c) => c !== correct);
    const distractors = pickDeterministic(distractPool, `${lessonTitle}-${questionText}`, 3);
    const options = [
      { text: correct, isCorrect: true },
      ...distractors.map((t) => ({ text: t, isCorrect: false })),
    ];
    while (options.length < 4 && filtered.length > 0) {
      const candidate = filtered[options.length % filtered.length];
      if (!options.some((o) => o.text === candidate)) {
        options.push({ text: candidate, isCorrect: false });
      }
    }
    return options;
  };

  const buildContentBasedOptions = (
    questionText: string,
    lessonTitle: string,
    contentBlock: string,
    assessmentSection: string,
    allowOverlap: boolean = false,
  ) => {
    const safeContent = assessmentSection
      ? contentBlock.replace(assessmentSection, '')
      : contentBlock;
    const localCandidates = extractCandidatePhrases(safeContent);
    const candidatePool = localCandidates.length > 0 ? localCandidates : globalCandidates;
    if (candidatePool.length === 0) {
      return buildSmartFallbackOptions(questionText, lessonTitle, allLessonTitles);
    }

    const questionNorm = normalizeText(questionText);
    const filteredCandidates = candidatePool.filter((c) => {
      const candidateNorm = normalizeText(c);
      if (!candidateNorm) return false;
      if (candidateNorm === questionNorm) return false;
      if (!allowOverlap && (questionNorm.includes(candidateNorm) || candidateNorm.includes(questionNorm))) return false;
      if (isQuestionLikeText(c)) return false;
      return true;
    });

    if (filteredCandidates.length === 0) {
      return buildSmartFallbackOptions(questionText, lessonTitle, candidatePool);
    }

    const keywordSource = localCandidates.length > 0 ? questionNorm : normalizeText(lessonTitle);
    const keywords = keywordSource
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const scored = filteredCandidates.map((c) => {
      const lower = c.toLowerCase();
      const score = keywords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
      return { text: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const correct = scored[0]?.text ?? filteredCandidates[0];
    const distractPool = filteredCandidates.filter((c) => c !== correct);
    const distractors = pickDeterministic(distractPool, `${lessonTitle}-${questionText}`, 3);

    const options = [
      { text: correct, isCorrect: true },
      ...distractors.map((t) => ({ text: t, isCorrect: false })),
    ];

    if (options.length < 4) {
      const fallbacks = buildSmartFallbackOptions(questionText, lessonTitle, candidatePool);
      for (const f of fallbacks) {
        if (options.length >= 4) break;
        if (!options.some((o) => o.text === f.text) && !questionNorm.includes(normalizeText(f.text))) {
          options.push({ text: f.text, isCorrect: false });
        }
      }
    }

    // Deterministic shuffle so correct isn't always first.
    const hash = questionText.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const rotated = options.slice(hash % options.length).concat(options.slice(0, hash % options.length));
    const correctIndex = rotated.findIndex((o) => o.isCorrect);
    if (correctIndex === -1) rotated[0].isCorrect = true;
    return rotated;
  };

  for (const module of sortedModules) {
    const sortedLessons = (module.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    for (const lesson of sortedLessons) {
      const existing = await quizRepo.find({ where: { lessonId: lesson.id } });
      if (existing.length > 0) {
        if (!opts?.replaceExisting) {
          skippedExisting += existing.length;
          continue;
        }
        for (const q of existing) {
          await questionRepo.delete({ quizId: q.id } as any);
          await quizRepo.delete({ id: q.id } as any);
          replacedQuizzes++;
        }
      }

      let match = parsedLessons.find((pl) => !used.has(pl.title) && mapLessonTitle(pl.title, lesson.title));
      if (!match) {
        while (cursor < parsedLessons.length) {
          const candidate = parsedLessons[cursor++];
          if (used.has(candidate.title)) continue;
          match = candidate;
          break;
        }
      }
      if (!match) {
        skippedNoAssessment++;
        match = { title: lesson.title, assessmentSection: '', questions: [], content: '' };
      } else {
        used.add(match.title);
      }

      const resolvedQuestions = match.questions.length > 0
        ? match.questions
        : buildFallbackQuestions(lesson.title, match.assessmentSection);

      const quiz = quizRepo.create({
        lessonId: lesson.id,
        title: `${lesson.title} — Knowledge Check`,
        description: 'Quick check to reinforce key concepts from this lesson.',
        passingScore: 70,
        timeLimitMinutes: 15,
        maxAttempts: 3,
        isPublished: true,
      });
      const savedQuiz = await quizRepo.save(quiz);
      createdQuizzes++;

      let orderIndex = 1;
      for (const q of resolvedQuestions) {
        const hasOptions = Array.isArray(q.options) && q.options.length > 0;
        const cleanedOptions = hasOptions ? filterOptions(q.question, q.options) : [];
        const isTrueFalse =
          hasOptions &&
          cleanedOptions.length === 2 &&
          cleanedOptions.every((opt) => ['true', 'false'].includes(opt.text.toLowerCase()));

        const useContentOptions =
          !hasOptions ||
          cleanedOptions.length < 3 ||
          isEssayLikeQuestion(q.question) ||
          isTrueFalse;
        const optionsForUse = useContentOptions
          ? buildContentBasedOptions(
              q.question,
              lesson.title,
              match.content || '',
              match.assessmentSection || '',
              isTrueFalse,
            )
          : cleanedOptions;

        let correctIndex = optionsForUse.findIndex((opt) => opt.isCorrect);

        let normalizedOptions = optionsForUse;
        let normalizedCorrectIndex = correctIndex;
        let questionType = QuestionType.MULTIPLE_CHOICE;

        if (isTrueFalse && !useContentOptions) {
          const trueOpt = cleanedOptions.find((opt) => opt.text.toLowerCase() === 'true');
          const falseOpt = cleanedOptions.find((opt) => opt.text.toLowerCase() === 'false');
          const trueIsCorrect = trueOpt?.isCorrect ?? false;
          const falseIsCorrect = falseOpt?.isCorrect ?? false;
          normalizedOptions = [
            { text: 'True', isCorrect: trueIsCorrect },
            { text: 'False', isCorrect: falseIsCorrect },
            { text: 'Not enough information', isCorrect: false },
            { text: 'Both true and false', isCorrect: false },
          ];
          normalizedCorrectIndex = normalizedOptions.findIndex((opt) => opt.isCorrect);
          questionType = QuestionType.MULTIPLE_CHOICE;
        }

        if (!normalizedOptions || normalizedOptions.length === 0) {
          normalizedOptions = buildContentBasedOptions(q.question, lesson.title, match.content || '', match.assessmentSection || '');
          normalizedCorrectIndex = normalizedOptions.findIndex((opt) => opt.isCorrect);
        }

        if (normalizedCorrectIndex < 0 && normalizedOptions.length > 0) {
          const questionNorm = normalizeText(q.question);
          const keywordCandidates = normalizedOptions.map((opt) => ({
            text: opt.text,
            score: questionNorm
              .split(/\s+/)
              .filter((w) => w.length >= 4)
              .reduce((acc, w) => acc + (normalizeText(opt.text).includes(w) ? 1 : 0), 0),
          }));
          keywordCandidates.sort((a, b) => b.score - a.score);
          const best = keywordCandidates[0]?.text;
          normalizedCorrectIndex = best
            ? normalizedOptions.findIndex((opt) => opt.text === best)
            : 0;
        }

        const options = normalizedOptions.map((opt) => opt.text);
        const correctAnswer = String(Math.max(0, normalizedCorrectIndex));
        const points = 1;

        const question = questionRepo.create({
          quizId: savedQuiz.id,
          questionType,
          questionText: q.question,
          options,
          correctAnswer,
          explanation: q.explanation || null,
          points,
          orderIndex: orderIndex++,
        });
        await questionRepo.save(question);
        createdQuestions++;
      }

      await lessonRepo.update(lesson.id, { hasQuiz: true } as any);
    }
  }

  console.log('[dcc:quiz:markdown] Completed', {
    createdQuizzes,
    createdQuestions,
    skippedExisting,
    skippedNoAssessment,
    replacedQuizzes,
  });
}




