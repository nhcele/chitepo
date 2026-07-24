import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { getCourse } from '@/lib/api/courses';
import { getMyEnrollmentForCourse, updateEnrollmentProgress } from '@/lib/api/enrollments';
import { generateQuizQuestions, GeneratedQuestion } from '@/lib/api/ai';
import { getQuizByLesson, submitQuizAttempt, getMyQuizAttempts, gradeQuestions } from '@/lib/api/assessments';
import { trackEvent, AnalyticsEventType } from '@/lib/api/analytics';
import { useAuth } from '@/contexts/AuthContext';
import LessonPlayer from '@/components/LessonPlayer';
import { Lesson, LessonType, Module as CourseModule, Course, Quiz } from '@mindelta/shared';

export default function LessonPage() {
  const router = useRouter();
  const { courseId, lessonId } = router.query as { courseId?: string; lessonId?: string };
  const [course, setCourse] = useState<(Course & { modules?: (CourseModule & { lessons?: Lesson[] })[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [notEnrolled, setNotEnrolled] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizSource, setQuizSource] = useState<'persisted' | 'ai'>('ai');
  const [quizQuestions, setQuizQuestions] = useState<GeneratedQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<Record<number, { isCorrect: boolean; explanation?: string }>>({});
  const [persistedQuiz, setPersistedQuiz] = useState<(Quiz & { questions?: any[] }) | null>(null);
  const [quizType, setQuizType] = useState<'lesson' | 'module'>('lesson');
  const [answers, setAnswers] = useState<Record<number, number | null>>({}); // idx -> option index (AI quiz)
  const [persistedAnswers, setPersistedAnswers] = useState<Record<string, string | number>>({}); // questionId -> answer
  const [showExplanations, setShowExplanations] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizFallbackContent, setQuizFallbackContent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<null | { score: number; passed: boolean; answers: { questionId: string; isCorrect: boolean; pointsEarned: number }[] }>(null);
  const [outlineOpen, setOutlineOpen] = useState(true); // kept for potential future desktop collapsible
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [lessonDuration, setLessonDuration] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'overview' | 'instructors'>('curriculum');

  const buildModuleQuizFromPersisted = async (): Promise<GeneratedQuestion[]> => {
    const entry = structure.lessonsByModule[structure.moduleIndex];
    if (!entry) return [];
    const lessonIds = entry.lessons.map((l) => l.id).filter(Boolean);
    if (lessonIds.length === 0) return [];

    const quizzes = await Promise.all(
      lessonIds.map(async (id) => {
        try {
          return await getQuizByLesson(id);
        } catch {
          return null;
        }
      }),
    );

    const pool: GeneratedQuestion[] = [];
    const seen = new Set<string>();
    for (const quiz of quizzes) {
      if (!quiz?.questions?.length) continue;
      for (const q of quiz.questions) {
        const id = (q as any).id as string | undefined;
        const stem = (q as any).stem || (q as any).questionText || '';
        const options = Array.isArray((q as any).options) ? (q as any).options : [];
        // Persisted questions no longer expose the answer key to learners; keep the
        // question id so grading can be done securely on the server.
        if (!id || !stem || options.length < 2) continue;
        const key = `${stem}-${options.join('|')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pool.push({
          id,
          question: stem,
          options,
          explanation: (q as any).explanation || undefined,
        });
      }
    }

    if (pool.length === 0) return [];
    const count = Math.min(6, pool.length);
    const seed = `${entry.module.id || entry.module.title}-${lessonId || ''}`;
    const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const chosen: GeneratedQuestion[] = [];
    for (let i = 0; i < pool.length && chosen.length < count; i++) {
      const candidate = pool[(hash + i) % pool.length];
      if (!chosen.includes(candidate)) chosen.push(candidate);
    }
    return chosen;
  };

  useEffect(() => {
    const run = async () => {
      if (!courseId) return;
      try {
        const data = await getCourse(courseId);
        setCourse(data as any);
        if (isAuthenticated) {
          const enr = await getMyEnrollmentForCourse(courseId);
          if (enr && (enr as any).id) {
            setEnrollmentId((enr as any).id);
          } else {
            setNotEnrolled(true);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [courseId, isAuthenticated]);

  const lesson: Lesson | undefined = useMemo(() => {
    if (!course || !lessonId) return undefined;
    for (const m of course.modules || []) {
      const found = (m.lessons || []).find((l) => l.id === lessonId);
      if (found) return found;
    }
    return undefined;
  }, [course, lessonId]);

  // Order modules and lessons for navigation
  const structure = useMemo(() => {
    const modulesSorted = (course?.modules || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    const lessonsByModule = modulesSorted.map((m) => ({
      module: m,
      lessons: (m.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex),
    }));
    // current indices
    let moduleIndex = -1;
    let lessonIndex = -1;
    lessonsByModule.forEach((entry, mi) => {
      const li = entry.lessons.findIndex((l) => l.id === lessonId);
      if (li !== -1) {
        moduleIndex = mi;
        lessonIndex = li;
      }
    });
    return { lessonsByModule, moduleIndex, lessonIndex };
  }, [course, lessonId]);

  const prevNext = useMemo(() => {
    const { lessonsByModule, moduleIndex, lessonIndex } = structure;
    if (moduleIndex < 0 || lessonIndex < 0) return { prev: null as null | { id: string }, next: null as null | { id: string }, isLastInModule: false };
    const currentModule = lessonsByModule[moduleIndex];
    const isFirstInModule = lessonIndex === 0;
    const isLastInModule = lessonIndex === currentModule.lessons.length - 1;
    let prev: null | { id: string } = null;
    let next: null | { id: string } = null;
    if (!isFirstInModule) {
      prev = { id: currentModule.lessons[lessonIndex - 1].id };
    } else if (moduleIndex > 0) {
      const prevMod = lessonsByModule[moduleIndex - 1];
      if (prevMod.lessons.length) prev = { id: prevMod.lessons[prevMod.lessons.length - 1].id };
    }
    if (!isLastInModule) {
      next = { id: currentModule.lessons[lessonIndex + 1].id };
    } else if (moduleIndex < lessonsByModule.length - 1) {
      const nextMod = lessonsByModule[moduleIndex + 1];
      if (nextMod.lessons.length) next = { id: nextMod.lessons[0].id };
    }
    return { prev, next, isLastInModule };
  }, [structure]);

  // Compute linear progress based on lesson index among all lessons in the course
  const computedProgress = useMemo(() => {
    if (!course || !lesson) return null;
    const flatLessons: Lesson[] = [];
    const modulesSorted = (course.modules || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    modulesSorted.forEach((m) => {
      (m.lessons || [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((l) => flatLessons.push(l));
    });
    const idx = flatLessons.findIndex((l) => l.id === lesson.id);
    if (idx === -1 || flatLessons.length === 0) return null;
    const percent = Math.round(((idx + 1) / flatLessons.length) * 100);
    return Math.max(0, Math.min(100, percent));
  }, [course, lesson]);

  // Estimate remaining minutes in course from current lesson to end
  const estimatedRemainingMinutes = useMemo(() => {
    if (!course || !lesson) return null;
    const modulesSorted = (course.modules || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    const flat = modulesSorted.flatMap(m => (m.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex));
    const idx = flat.findIndex(l => l.id === lesson.id);
    if (idx === -1) return null;
    const remainingSec = flat.slice(idx).reduce((acc, l) => {
      // Check both durationSeconds (computed) and videoDuration (stored in DB)
      const duration = (l as any).durationSeconds || (l as any).videoDuration || 0;
      return acc + duration;
    }, 0);
    return Math.round(remainingSec / 60);
  }, [course, lesson]);

  // On lesson load, push progress if enrolled
  useEffect(() => {
    const pushProgress = async () => {
      if (!enrollmentId || computedProgress == null) return;
      try {
        await updateEnrollmentProgress(enrollmentId, computedProgress as number, new Date());
      } catch (e) {
        // non-blocking
      }
    };
    pushProgress();
  }, [enrollmentId, computedProgress]);

  const buildLessonContext = () => {
    const m = structure.lessonsByModule[structure.moduleIndex]?.module;
    const ctx = [course?.title, m?.title, lesson?.title, (lesson as any)?.description || (lesson as any)?.textContent || '']
      .filter(Boolean)
      .join(' - ');
    return ctx;
  };

  const buildModuleContext = () => {
    const entry = structure.lessonsByModule[structure.moduleIndex];
    if (!entry) return buildLessonContext();
    const titles = entry.lessons.map((l) => `${l.title}: ${(l as any)?.summary || (l as any)?.description || ''}`).join('\n');
    return `${course?.title} - ${entry.module.title}\n${titles}`;
  };

  const normalizeFallbackText = (raw: string) => {
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
      // fall through
    }
    return raw;
  };

  const hasAssessmentContent = (raw: string | null) => {
    if (!raw) return false;
    const text = normalizeFallbackText(raw);
    const headingPattern =
      /(^|\n)\s*(?:#{2,}\s*|\*\*)(assessment|self-assessment|knowledge check|quiz)\b/i;
    return headingPattern.test(text);
  };

  const extractAssessmentSection = (raw: string) => {
    const text = normalizeFallbackText(raw);
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
    const allowedSubheadings = [
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
      allowedSubheadings.some((h) => heading === h || heading.includes(h));

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
      return { text, section: '' };
    }

    let end = lines.length;
    for (let i = start; i < lines.length; i++) {
      const h = normalizeHeading(lines[i]);
      if (isHeading(lines[i]) && !startMarkers.includes(h) && !isAllowedSubheading(h)) {
        end = i;
        break;
      }
      if (stopMarkers.includes(h)) {
        end = i;
        break;
      }
    }
    const section = lines.slice(start, end).join('\n').trim();
    return { text, section };
  };

    const parseFallbackQuestions = (raw: string) => {
    const { section } = extractAssessmentSection(raw);
    const source = section || normalizeFallbackText(raw);
    const lines = source.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const questions: { question: string; options: { text: string; isCorrect: boolean }[] }[] = [];

    let current: { question: string; options: { text: string; isCorrect: boolean }[] } | null = null;
    let mode: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'case' | 'unknown' = 'unknown';
    const questionRegex = /^(?:\d+\.|q\d+[:.)])\s+(.*)$/i;
    const optionRegex = /^([a-dA-D])[\).]\s+(.*)$/;
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

    lines.forEach((line) => {
      if (isHeading(line)) {
        const heading = normalizeHeading(line);
        if (heading.includes('multiple choice')) mode = 'multiple-choice';
        else if (heading.includes('true/false') || heading.includes('true false')) mode = 'true-false';
        else if (heading.includes('short answer') || heading.includes('essay') || heading === 'questions') mode = 'short-answer';
        else if (heading.includes('case')) mode = 'case';
        return;
      }

      const qMatch = line.match(questionRegex);
      if (qMatch) {
        if (current) questions.push(current);
        const rawQuestion = qMatch[1].trim();
        let questionText = rawQuestion;
        let options: { text: string; isCorrect: boolean }[] = [];
        const tfInlineMatch = rawQuestion.match(/\((true|false)(?:\s*-\s*([^)]+))?\)/i);
        if (tfInlineMatch) {
          const isTrue = tfInlineMatch[1].toLowerCase() === 'true';
          options = [
            { text: 'True', isCorrect: isTrue },
            { text: 'False', isCorrect: !isTrue },
          ];
          questionText = rawQuestion.replace(/\((true|false)(?:\s*-\s*[^)]+)?\)/i, '').trim();
        }
        current = { question: questionText, options };
        return;
      }

      const oMatch = line.match(optionRegex);
      if (oMatch && current) {
        if (mode === 'multiple-choice' || mode === 'true-false') {
          const text = oMatch[2].replace(/[✓✔]\s*$/, '').trim();
          const isCorrect = /[✓✔]/.test(oMatch[2]);
          current.options.push({ text, isCorrect });
          return;
        }
        if (current.options.length === 0) {
          current.question = `${current.question} ${line}`.trim();
          return;
        }
      }
      // If no explicit question marker, treat numbered line as question
      if (!current && /^\d+\s+/.test(line)) {
        current = { question: line.replace(/^\d+\s+/, '').trim(), options: [] };
        return;
      }
      // If we're inside a question and line doesn't match option, append to question text
      if (current && current.options.length === 0 && line.length > 0) {
        current.question = `${current.question} ${line}`.trim();
      }
    });
    if (current) questions.push(current);
    return questions;
  };

  const findFallbackQuizContent = () => {
    const entry = structure.lessonsByModule[structure.moduleIndex];
    const quizLesson = entry?.lessons?.find((l: any) => l?.type === 'quiz' && l?.content);
    if (quizLesson?.content) return quizLesson.content as string;
    const assessmentLesson = entry?.lessons?.find((l: any) => l?.content && hasAssessmentContent(l.content));
    if (assessmentLesson?.content) return assessmentLesson.content as string;
    if ((lesson as any)?.type === 'quiz' && lesson?.content) return lesson.content as string;
    if ((lesson as any)?.content && hasAssessmentContent((lesson as any).content)) return (lesson as any).content as string;
    return null;
  };

  const generateLessonQuiz = async () => {
    setQuizType('lesson');
    setQuizQuestions([]);
    setPersistedQuiz(null);
    setSubmitResult(null);
    setSubmitError(null);
    setAnswers({});
    setPersistedAnswers({});
    setShowExplanations(false);
    setQuizResults({});
    setQuizError(null);
    setQuizFallbackContent(null);
    setQuizOpen(true);
    try {
      // Try to load persisted quiz first
      if (lesson && lesson.id) {
        const pq = await getQuizByLesson(lesson.id);
        if (pq) {
          setQuizSource('persisted');
          setPersistedQuiz(pq as any);
          // Track quiz started (persisted)
          trackEvent({
            eventType: AnalyticsEventType.QUIZ_STARTED,
            lessonId: lesson.id,
            quizId: (pq as any).id,
            courseId: courseId as string,
            metadata: { source: 'persisted' },
          });
          return;
        }
      }
    } catch (_e) {
      // fall back to AI
    }
    try {
      setQuizSource('ai');
      const content = buildLessonContext();
      const qs = await generateQuizQuestions(content, 3);
      if (!qs || qs.length === 0) {
        const fallback = findFallbackQuizContent();
        if (fallback) {
          setQuizFallbackContent(fallback);
          setQuizError('AI quiz is unavailable. Showing lesson quiz content instead.');
        } else {
          setQuizError('No quiz questions were generated. Please try again.');
        }
        return;
      }
      setQuizQuestions(qs);
      if (lesson?.id) {
        trackEvent({
          eventType: AnalyticsEventType.QUIZ_STARTED,
          lessonId: lesson.id,
          courseId: courseId as string,
          metadata: { source: 'ai', count: qs.length },
        });
      }
    } catch (e: any) {
      setQuizQuestions([]);
      setShowExplanations(false);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Unable to generate a quiz right now. Please try again.';
      const fallback = findFallbackQuizContent();
      if (fallback) {
        setQuizFallbackContent(fallback);
        setQuizError(msg || 'AI quiz is unavailable. Showing lesson quiz content instead.');
      } else {
        setQuizError(msg);
      }
    }
  };

  const generateModuleQuiz = async () => {
    setQuizType('module');
    setQuizQuestions([]);
    setPersistedQuiz(null);
    setAnswers({});
    setShowExplanations(false);
    setQuizResults({});
    setQuizError(null);
    setQuizFallbackContent(null);
    setQuizSource('ai');
    setQuizOpen(true);
    try {
      const content = buildModuleContext();
      const qs = await generateQuizQuestions(content, 6);
      if (!qs || qs.length === 0) {
        const fallbackQuestions = await buildModuleQuizFromPersisted();
        if (fallbackQuestions.length > 0) {
          setQuizQuestions(fallbackQuestions);
          setQuizError('AI quiz is unavailable. Showing module questions from lesson assessments.');
          return;
        }
        const fallback = findFallbackQuizContent();
        if (fallback) {
          setQuizFallbackContent(fallback);
          setQuizError('AI quiz is unavailable. Showing lesson quiz content instead.');
        } else {
          setQuizError('No quiz questions were generated. Please try again.');
        }
        return;
      }
      setQuizQuestions(qs);
      if (lesson?.id) {
        trackEvent({
          eventType: AnalyticsEventType.QUIZ_STARTED,
          lessonId: lesson.id,
          courseId: courseId as string,
          metadata: { source: 'ai', kind: 'module', count: qs.length },
        });
      }
    } catch (e: any) {
      setQuizQuestions([]);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Unable to generate a quiz right now. Please try again.';
      const fallbackQuestions = await buildModuleQuizFromPersisted();
      if (fallbackQuestions.length > 0) {
        setQuizQuestions(fallbackQuestions);
        setQuizError('AI quiz is unavailable. Showing module questions from lesson assessments.');
        return;
      }
      const fallback = findFallbackQuizContent();
      if (fallback) {
        setQuizFallbackContent(fallback);
        setQuizError(msg || 'AI quiz is unavailable. Showing lesson quiz content instead.');
      } else {
        setQuizError(msg);
      }
    }
  };

  return (
    <>
      <Head>
        <title>{lesson ? `${lesson.title} - Chitepo` : 'Lesson'}</title>
      </Head>
      <Layout>
        {/* Hero header */}
        <div className="bg-gradient-to-r from-indigo-900 to-primary-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm opacity-80 mb-1">{course?.title || 'Course'}</div>
                <h1 className="text-2xl sm:text-3xl font-semibold">{lesson?.title || 'Lesson'}</h1>
                <div className="mt-3 flex items-center gap-3 text-indigo-100">
                  {typeof computedProgress === 'number' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-40 h-2 bg-white/20 rounded">
                        <div className="h-2 bg-emerald-400 rounded" style={{ width: `${computedProgress}%` }} />
                      </div>
                      <span className="text-sm">{computedProgress}%</span>
                    </div>
                  )}
                  {estimatedRemainingMinutes != null && estimatedRemainingMinutes > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded">
                      ⏱ Estimated {Math.floor(estimatedRemainingMinutes / 60) > 0 ? `${Math.floor(estimatedRemainingMinutes / 60)}h ` : ''}{estimatedRemainingMinutes % 60}m remaining
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden sm:block">
                <Link href={`/courses/${courseId}`} className="inline-flex items-center px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Course Home</Link>
              </div>
            </div>
            {/* Tabs */}
            <div className="mt-6">
              <nav className="flex gap-6 text-sm">
                <button onClick={() => setActiveTab('curriculum')} className={`pb-2 border-b-2 ${activeTab==='curriculum' ? 'border-white' : 'border-transparent opacity-80 hover:opacity-100'}`}>Curriculum</button>
                <button onClick={() => setActiveTab('overview')} className={`pb-2 border-b-2 ${activeTab==='overview' ? 'border-white' : 'border-transparent opacity-80 hover:opacity-100'}`}>Overview</button>
                <button onClick={() => setActiveTab('instructors')} className={`pb-2 border-b-2 ${activeTab==='instructors' ? 'border-white' : 'border-transparent opacity-80 hover:opacity-100'}`}>Instructors</button>
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Mobile outline toggle */}
            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setMobileOutlineOpen(true)}
                className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 text-gray-700 bg-white shadow-sm"
              >
                Open Course Outline
              </button>
            </div>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !lesson && <p className="text-gray-600">Lesson not found.</p>}
          {notEnrolled && (
            <p className="mb-4 text-amber-700 bg-amber-100 border border-amber-200 rounded px-3 py-2">
              You are not enrolled in this course. Enroll to track your progress and earn a certificate.
            </p>
          )}
          {/* Curriculum tab shows the actual lesson content */}
          {lesson && activeTab==='curriculum' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <span>{lesson.title}</span>
                {lesson.type === LessonType.VIDEO && (
                  <span className="text-sm text-gray-600 inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                    {lessonDuration != null ? `${Math.floor(lessonDuration / 60)}m ${lessonDuration % 60}s` : 'Video'}
                  </span>
                )}
              </h1>
              {lesson.type === LessonType.VIDEO && (
                <>
                  {(lesson.contentUrl || (lesson as any).videoUrl) ? (
                    <LessonPlayer
                      src={lesson.contentUrl || (lesson as any).videoUrl}
                      poster={(lesson as any).thumbnailUrl}
                      onEnded={generateLessonQuiz}
                      onDuration={setLessonDuration}
                      lessonId={lesson.id}
                      courseId={courseId as string}
                    />
                  ) : (
                    <div className="w-full p-8 border-4 border-gray-300 rounded-xl shadow-lg bg-gradient-to-br from-gray-100 to-gray-200 text-center">
                      <div className="bg-gray-800 text-white rounded-lg p-6">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-semibold mb-2">Video content not available</p>
                        <p className="text-sm text-gray-300">The video URL for this lesson has not been configured yet.</p>
                      </div>
                    </div>
                  )}
                  {/* Display text content below video if available, or standalone if no video */}
                  {lesson.content && (
                    <div className={lesson.contentUrl ? "mt-6" : ""}>
                      {(() => {
                        // Try to parse as JSON (contentBlocks)
                        try {
                          const parsed = JSON.parse(lesson.content);
                          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
                            // It's contentBlocks array
                            return (
                              <div className="prose max-w-none space-y-4">
                                {parsed.map((block: any, idx: number) => {
                                  switch (block.type) {
                                    case 'heading':
                                      return <h2 key={idx} className="text-2xl font-bold text-gray-900 mb-4">{block.content}</h2>;
                                    case 'text':
                                      return <p key={idx} className="text-gray-700 mb-4 leading-relaxed">{block.content}</p>;
                                    case 'code':
                                      return (
                                        <div key={idx} className="mb-4">
                                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                            <code className="text-sm">{block.content}</code>
                                          </pre>
                                        </div>
                                      );
                                    case 'image':
                                      return (
                                        <div key={idx} className="mb-4">
                                          <img 
                                            src={block.metadata?.url || ''} 
                                            alt={block.metadata?.alt || 'Content image'}
                                            className="max-w-full h-auto rounded-lg"
                                          />
                                          {block.metadata?.caption && (
                                            <p className="text-sm text-gray-500 mt-2 italic">{block.metadata.caption}</p>
                                          )}
                                        </div>
                                      );
                                    default:
                                      return <div key={idx} className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: block.content || '' }} />;
                                  }
                                })}
                              </div>
                            );
                          }
                        } catch (e) {
                          // Not JSON, treat as HTML/text
                        }
                        // Fallback: render as HTML
                        return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />;
                      })()}
                    </div>
                  )}
                </>
              )}
              {lesson.type === LessonType.TEXT && (
                <div className="prose max-w-none whitespace-pre-wrap">{lesson.content || ''}</div>
              )}
              {lesson.type === LessonType.HTML && (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
              )}
              {lesson.type === LessonType.EMBED && lesson.contentUrl && (
                <div className="aspect-video w-full">
                  <iframe
                    src={lesson.contentUrl}
                    className="w-full h-full rounded-lg border"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
              )}
              {lesson.type === LessonType.DOWNLOAD && lesson.contentUrl && (
                <a
                  href={lesson.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Download material
                </a>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  {prevNext.prev && (
                    <Link href={`/courses/${courseId}/lessons/${prevNext.prev.id}`} className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">
                      ← Previous
                    </Link>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={generateLessonQuiz}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Take Lesson Quiz
                  </button>
                  {prevNext.next && (
                    <Link href={`/courses/${courseId}/lessons/${prevNext.next.id}`} className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">
                      Next →
                    </Link>
                  )}
                </div>
              </div>

              {/* Module end quiz prompt */}
              {prevNext.isLastInModule && (
                <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  You are at the end of this module. Test your knowledge with a module quiz.
                  <div>
                    <button
                      type="button"
                      onClick={generateModuleQuiz}
                      className="mt-2 inline-flex items-center px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700"
                    >
                      Start Module Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Overview tab */}
          {activeTab==='overview' && (
            <div className="space-y-4 text-gray-800">
              <h2 className="text-xl font-semibold">About this course</h2>
              <p className="text-gray-700">{(course as any)?.description || 'No description available.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-sm text-gray-500">Estimated Duration</div>
                  <div className="text-lg font-medium">{Math.round(((course as any)?.estimatedDuration || 0) / 60)} hours</div>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-sm text-gray-500">Difficulty</div>
                  <div className="text-lg font-medium capitalize">{(course as any)?.difficulty || 'n/a'}</div>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-sm text-gray-500">Progress</div>
                  <div className="text-lg font-medium">{typeof computedProgress==='number' ? `${computedProgress}%` : '—'}</div>
                </div>
              </div>
            </div>
          )}
          {/* Instructors tab */}
          {activeTab==='instructors' && (
            <div className="space-y-3 text-gray-800">
              <h2 className="text-xl font-semibold">Instructors</h2>
              <p className="text-gray-700">{(course as any)?.instructor?.name || 'Chitepo Instructor'}</p>
            </div>
          )}
          {/* Quiz Drawer/Panel */}

          {quizOpen && (

            <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center md:justify-center">

              <div className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl p-4 md:p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">

                <div className="flex items-center justify-between mb-3">

                  <h2 className="text-xl font-semibold">{quizType === 'lesson' ? 'Lesson Quiz' : 'Module Quiz'}</h2>

                  <button onClick={() => setQuizOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>

                </div>

                <div className="flex-1 overflow-y-auto pr-1">

                  {/* Persisted quiz */}

                  {quizSource === 'persisted' && persistedQuiz ? (

                    <div className="space-y-5">

                      <div className="text-sm text-gray-600">This is a graded quiz. Attempts and cooldowns apply.</div>

                      {(() => {

                        const autoGradable = (persistedQuiz.questions || []).some((q: any) => Array.isArray(q.options) && q.options.length > 0);

                        if (!autoGradable) {

                          return (

                            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">

                              This assessment contains written questions and is not auto-graded.

                            </div>

                          );

                        }

                        return null;

                      })()}

                      {submitResult && (

                        <div className={`p-3 rounded border ${submitResult.passed ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>

                          <div className="font-semibold">{submitResult.passed ? 'Passed' : 'Not Passed'}</div>

                          <div>Score: {Math.round(submitResult.score)}%</div>

                        </div>

                      )}

                      {persistedQuiz.questions?.map((q: any, idx: number) => (

                        <div key={q.id} className="border border-gray-200 rounded-lg p-4">

                          <div className="font-medium mb-2">{idx + 1}. {q.stem}</div>

                          {Array.isArray(q.options) && q.options.length > 0 ? (

                            <div className="space-y-2">

                              {(q.options || []).map((opt: string, oi: number) => (

                                <label key={oi} className={`flex items-center gap-2 p-2 rounded border ${(persistedAnswers[q.id] ?? '') === String(oi) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>

                                  <input

                                    type="radio"

                                    name={`pq-${q.id}`}

                                    className="h-4 w-4"

                                    checked={(persistedAnswers[q.id] ?? '') === String(oi)}

                                    onChange={() => setPersistedAnswers((prev) => ({ ...prev, [q.id]: String(oi) }))}

                                  />

                                  <span>{opt}</span>

                                </label>

                              ))}

                            </div>

                          ) : (

                            <div className="space-y-2">

                              <textarea

                                className="w-full min-h-[120px] rounded-md border border-gray-300 p-2 text-sm"

                                placeholder="Write your answer here..."

                                value={(persistedAnswers[q.id] ?? '') as string}

                                onChange={(e) => setPersistedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}

                              />

                              <div className="text-xs text-gray-500">Written responses are not auto-graded.</div>

                            </div>

                          )}

                          {submitResult && (

                            <div className={`mt-2 text-sm ${submitResult.answers.find(a => a.questionId === q.id)?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>

                              {submitResult.answers.find(a => a.questionId === q.id)?.isCorrect ? 'Correct' : 'Incorrect'}

                              {q.explanation ? <div className="mt-1 text-gray-600">{q.explanation}</div> : null}

                            </div>

                          )}

                        </div>

                      ))}

                      {submitError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{submitError}</div>}

                      <div className="flex flex-wrap items-center gap-3">

                        {!submitResult && (persistedQuiz.questions || []).some((q: any) => Array.isArray(q.options) && q.options.length > 0) ? (

                          <button

                            type="button"

                            disabled={submitting}

                            onClick={async () => {

                              if (!persistedQuiz) return;

                              setSubmitting(true);

                              setSubmitError(null);

                              try {

                                const res = await submitQuizAttempt(persistedQuiz.id, persistedAnswers);

                                setSubmitResult({ score: Number(res.score || 0), passed: !!res.passed, answers: (res as any).answers || [] });

                                // Track quiz completed (persisted)

                                if (lesson?.id) {

                                  trackEvent({

                                    eventType: AnalyticsEventType.QUIZ_COMPLETED,

                                    lessonId: lesson.id,

                                    courseId: courseId as string,

                                    quizId: persistedQuiz.id,

                                    metadata: { source: 'persisted', score: Number(res.score || 0), passed: !!res.passed },

                                  });

                                }

                              } catch (e: any) {

                                const msg = e?.response?.data?.message || 'Failed to submit quiz';

                                setSubmitError(msg);

                              } finally {

                                setSubmitting(false);

                              }

                            }}

                            className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"

                          >

                            {submitting ? 'Submitting...' : 'Submit Quiz'}

                          </button>

                        ) : (

                          <button

                            type="button"

                            onClick={() => setQuizOpen(false)}

                            className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"

                          >

                            Close

                          </button>

                        )}

                      </div>

                    </div>

                  ) : quizSource === 'ai' ? (

                    // AI fallback quiz

                    <>

                      {quizQuestions.length === 0 ? (

                        <div className="text-gray-700">

                          {quizFallbackContent ? (

                            <div className="space-y-4">

                              {quizError && <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{quizError}</div>}

                              <div className="text-sm text-gray-600">This lesson includes a static quiz. Answer in your notes or with your instructor.</div>

                              <div className="prose max-w-none whitespace-pre-wrap">

                                {(() => {

                                  const parsedQuestions = parseFallbackQuestions(quizFallbackContent);

                                  if (parsedQuestions.length > 0) {

                                    return (

                                      <div className="space-y-5">

                                        {parsedQuestions.map((q, qi) => (

                                          <div key={`${qi}-${q.question.slice(0, 10)}`} className="border border-gray-200 rounded-lg p-4">

                                            <div className="font-medium mb-2">{qi + 1}. {q.question}</div>

                                            {q.options.length > 0 ? (

                                              <div className="space-y-2">

                                                {q.options.map((opt, oi) => (

                                                  <div key={`${qi}-${oi}`} className={`flex items-start gap-2 rounded border px-3 py-2 ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>

                                                    <span className="text-sm text-gray-500">{String.fromCharCode(65 + oi)}.</span>

                                                    <span className="text-sm text-gray-800">{opt.text}</span>

                                                  </div>

                                                ))}

                                              </div>

                                            ) : (

                                              <div className="text-sm text-gray-600">Answer in your notes.</div>

                                            )}

                                          </div>

                                        ))}

                                      </div>

                                    );

                                  }

                                  const { section } = extractAssessmentSection(quizFallbackContent);

                                  if (!section.trim()) {

                                    return <div className="text-sm text-gray-600">No quiz content is available for this lesson.</div>;

                                  }

                                  const fallbackText = section;

                                  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(fallbackText || '');

                                  return looksLikeHtml ? (

                                    <div dangerouslySetInnerHTML={{ __html: fallbackText || '' }} />

                                  ) : (

                                    <div className="whitespace-pre-wrap">{fallbackText}</div>

                                  );

                                })()}

                              </div>

                              <div className="flex flex-wrap items-center gap-2">

                                <button

                                  type="button"

                                  onClick={() => setQuizOpen(false)}

                                  className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"

                                >

                                  Close

                                </button>

                              </div>

                            </div>

                          ) : quizError ? (

                            <>

                              <p className="text-red-600">{quizError}</p>

                              <div className="mt-4 flex flex-wrap items-center gap-2">

                                <button

                                  type="button"

                                  onClick={() => setQuizOpen(false)}

                                  className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"

                                >

                                  Close

                                </button>

                                {isAuthenticated && (

                                  <button

                                    type="button"

                                    onClick={quizType === 'lesson' ? generateLessonQuiz : generateModuleQuiz}

                                    className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"

                                  >

                                    Try Again

                                  </button>

                                )}

                              </div>

                            </>

                          ) : (

                            <p>Generating questions...</p>

                          )}

                          {!isAuthenticated && (

                            <p className="mt-2 text-sm text-red-600">You must be logged in to generate quizzes.</p>

                          )}

                        </div>

                      ) : (

                        <div className="space-y-5">
                          {quizError && (
                            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                              {quizError}
                            </div>
                          )}

                          {quizQuestions.map((q, idx) => (

                            <div key={idx} className="border border-gray-200 rounded-lg p-4">

                              <div className="font-medium mb-2">{idx + 1}. {q.question}</div>

                              <div className="space-y-2">

                                {q.options.map((opt, oi) => (

                                  <label key={oi} className={`flex items-center gap-2 p-2 rounded border ${answers[idx] === oi ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>

                                    <input

                                      type="radio"

                                      name={`q-${idx}`}

                                      className="h-4 w-4"

                                      checked={answers[idx] === oi}

                                      onChange={() => setAnswers((prev) => ({ ...prev, [idx]: oi }))}

                                    />

                                    <span>{opt}</span>

                                  </label>

                                ))}

                              </div>

                              {showExplanations && (

                                <div className={`mt-2 text-sm ${quizResults[idx]?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>

                                  {quizResults[idx]?.isCorrect ? 'Correct' : 'Incorrect'}

                                  {quizResults[idx]?.explanation ? <div className="mt-1 text-gray-600">{quizResults[idx]?.explanation}</div> : null}

                                </div>

                              )}

                            </div>

                          ))}

                          {!showExplanations ? (

                            <button

                              type="button"

                              onClick={async () => {
                                const resultsMap: Record<number, { isCorrect: boolean; explanation?: string }> = {};
                                // Grade persisted questions on the server (answer key never sent to the client);
                                // ephemeral AI-practice questions (no id) are graded locally against their inline key.
                                const serverItems = quizQuestions
                                  .map((q, idx) => ({ idx, id: q.id, answerIdx: (answers[idx] ?? -1) as number }))
                                  .filter((x) => x.id && x.answerIdx >= 0);
                                try {
                                  if (serverItems.length > 0) {
                                    const graded = await gradeQuestions(
                                      serverItems.map((x) => ({ questionId: x.id as string, answer: x.answerIdx })),
                                    );
                                    const byId = new Map((graded.results || []).map((r) => [r.questionId, r]));
                                    serverItems.forEach((x) => {
                                      const r = byId.get(x.id as string);
                                      resultsMap[x.idx] = { isCorrect: !!r?.isCorrect, explanation: (r?.explanation as string) || undefined };
                                    });
                                  }
                                } catch (_e) {
                                  // fall through to local grading for anything not resolved by the server
                                }
                                quizQuestions.forEach((q, idx) => {
                                  if (resultsMap[idx] !== undefined) return;
                                  const selected = q.options[(answers[idx] ?? -1) as number];
                                  resultsMap[idx] = {
                                    isCorrect: selected != null && q.correctAnswer != null && selected === q.correctAnswer,
                                    explanation: q.explanation,
                                  };
                                });
                                setQuizResults(resultsMap);
                                setShowExplanations(true);
                                if (lesson?.id) {
                                  const total = quizQuestions.length;
                                  const correct = Object.values(resultsMap).filter((r) => r.isCorrect).length;
                                  const scorePct = total > 0 ? (correct / total) * 100 : 0;
                                  trackEvent({
                                    eventType: AnalyticsEventType.QUIZ_COMPLETED,
                                    lessonId: lesson.id,
                                    courseId: courseId as string,
                                    metadata: { source: 'ai', total, correct, score: scorePct },
                                  });
                                }
                              }}

                              className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"

                            >

                              Submit Answers

                            </button>

                          ) : (

                            <button

                              type="button"

                              onClick={() => setQuizOpen(false)}

                              className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"

                            >

                              Close

                            </button>

                          )}

                        </div>

                      )}

                    </>

                  ) : (

                    <div className="text-gray-700">

                      <p>Loading quiz...</p>

                    </div>

                  )}

                </div>

              </div>

            </div>

          )}

          </div>



          {/* Desktop sticky outline (right) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Course Curriculum</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {(course?.modules || []).reduce((sum, m) => sum + (m.lessons?.length || 0), 0)} lessons
                  </p>
                </div>
                <div className="max-h-[70vh] overflow-auto">
                  {(course?.modules || [])
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((m, moduleIndex) => (
                      <div key={m.id} className="border-b border-gray-100">
                        <div className="px-4 py-3 bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900">
                            Module {moduleIndex + 1}: {m.title}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {m.lessons?.length || 0} lessons
                          </p>
                        </div>
                        <ul className="divide-y divide-gray-100">
                          {(m.lessons || [])
                            .slice()
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((l, lessonIndex) => {
                              const active = l.id === lessonId;
                              const duration = (l as any).durationSeconds || (l as any).videoDuration;
                              return (
                                <li key={l.id}>
                                  <Link
                                    href={`/courses/${courseId}/lessons/${l.id}`}
                                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                                      active ? 'bg-primary-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className="flex-shrink-0">
                                        {l.type === 'video' && (
                                          <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        )}
                                        {l.type === 'text' && (
                                          <div className="w-4 h-4 bg-primary-600 rounded"></div>
                                        )}
                                        {l.type === 'html' && (
                                          <div className="w-4 h-4 bg-purple-600 rounded"></div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${
                                          active ? 'text-primary-700 font-medium' : 'text-gray-900'
                                        }`}>
                                          {lessonIndex + 1}. {l.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-xs text-gray-500 capitalize">{l.type}</span>
                                          {duration && (
                                            <>
                                              <span className="text-xs text-gray-400">•</span>
                                              <span className="text-xs text-gray-500">{Math.round(duration / 60)}m</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {l.isPreview && (
                                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 ml-2">
                                        Preview
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile right-hand drawer */}
          {mobileOutlineOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileOutlineOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-0 h-full w-11/12 max-w-sm bg-white shadow-2xl flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="font-semibold">Course Outline</div>
                  <button onClick={() => setMobileOutlineOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="p-2 overflow-auto">
                  {(course?.modules || [])
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((m) => (
                      <div key={m.id} className="px-2 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900 mb-2">{m.title}</div>
                        <ul className="space-y-1">
                          {(m.lessons || [])
                            .slice()
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((l) => {
                              const active = l.id === lessonId;
                              return (
                                <li key={l.id}>
                                  <Link
                                    href={`/courses/${courseId}/lessons/${l.id}`}
                                    className={`block text-sm px-2 py-1 rounded ${
                                      active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setMobileOutlineOpen(false)}
                                  >
                                    {l.title}
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}



