import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LessonLayout from '@/components/layouts/LessonLayout';
import CourseKnowledgeSpine, { SpineLesson, SpineModule } from '@/components/ui/CourseKnowledgeSpine';
import { AcademicCapIcon, Bars3Icon, CheckCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkLessonAccess, getCourse, getCourseLessonProgress, getLessonProgress, LessonAccessResponse, LessonProgress, updateLessonProgress as saveLessonProgress, CourseLessonProgressMap } from '@/lib/api/courses';
import { getMyEnrollmentForCourse, updateEnrollmentProgress } from '@/lib/api/enrollments';
import { generateQuizQuestions, GeneratedQuestion } from '@/lib/api/ai';
import {
  getQuizByLesson,
  submitQuizAttempt,
  saveAttemptAnswer,
  startAssessmentAttempt,
  submitAssessmentAttempt,
} from '@/lib/api/assessments';
import { trackEvent, AnalyticsEventType } from '@/lib/api/analytics';
import { Note, listMyNotes, createNote, updateNote, deleteNote } from '@/lib/api/notes';
import {
  KnowledgeCheckQuiz,
  KnowledgeCheckAnswerResult,
  getKnowledgeCheck,
  submitKnowledgeCheckAnswer,
} from '@/lib/api/assessments';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import LessonPlayer, { LessonPlayerHandle } from '@/components/LessonPlayer';
import { AssessmentAttemptView, Lesson, LessonType, Module as CourseModule, Course, Quiz } from '@mindelta/shared';

function parseTimestampSeconds(text: string): number | null {
  const match = text.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, h, m, s] = match;
  const hours = h ? parseInt(h, 10) : 0;
  const minutes = parseInt(m, 10);
  const seconds = parseInt(s, 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  if (minutes >= 60 || seconds >= 60) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LessonPage() {
  const router = useRouter();
  const playerRef = useRef<LessonPlayerHandle>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
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
  const [persistedAttempt, setPersistedAttempt] = useState<AssessmentAttemptView | null>(null);
  const [quizType, setQuizType] = useState<'lesson' | 'module'>('lesson');
  const [answers, setAnswers] = useState<Record<number, number | null>>({}); // idx -> option index (AI quiz)
  const [persistedAnswers, setPersistedAnswers] = useState<Record<string, string | number | (string | number)[]>>({}); // questionId -> answer
  const [showExplanations, setShowExplanations] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizFallbackContent, setQuizFallbackContent] = useState<string | null>(null);
  const [quizUnavailable, setQuizUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<null | { score: number; passed: boolean | null; answers: { questionId: string; isCorrect: boolean; pointsEarned: number }[] }>(null);
  const [persistedSaveState, setPersistedSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const persistedAttemptClosedRef = useRef(false);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [outlineOpen, setOutlineOpen] = useState(true); // kept for potential future desktop collapsible
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [lessonDuration, setLessonDuration] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'overview' | 'instructors'>('curriculum');
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [lessonProgressLoading, setLessonProgressLoading] = useState(false);
  const [progressSaveState, setProgressSaveState] = useState<'idle' | 'error'>('idle');
  const lastProgressRef = useRef<{ lastPositionSeconds: number; watchedSeconds: number; percent: number } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [knowledgeCheck, setKnowledgeCheck] = useState<KnowledgeCheckQuiz | null>(null);
  const [kcLoading, setKcLoading] = useState(false);
  const [kcAnswers, setKcAnswers] = useState<Record<string, string>>({});
  const [kcResults, setKcResults] = useState<Record<string, KnowledgeCheckAnswerResult>>({});
  const [kcError, setKcError] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseLessonProgressMap>({});
  const [access, setAccess] = useState<{ hasAccess: boolean; reason?: string }>({ hasAccess: true });

  useFocusTrap(drawerRef, mobileOutlineOpen);

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

  const refreshLessonProgress = useCallback(async () => {
    if (!lessonId || !isAuthenticated) {
      setLessonProgress(null);
      setLessonProgressLoading(false);
      return;
    }
    setLessonProgressLoading(true);
    try {
      const [progress, progressMap] = await Promise.all([
        getLessonProgress(lessonId),
        courseId ? getCourseLessonProgress(courseId) : Promise.resolve(null),
      ]);
      setLessonProgress(progress);
      if (progressMap) setCourseProgress(progressMap);
    } catch {
      setLessonProgress(null);
    } finally {
      setLessonProgressLoading(false);
    }
  }, [lessonId, courseId, isAuthenticated]);

  useEffect(() => {
    refreshLessonProgress();
  }, [refreshLessonProgress]);

  // Load per-lesson progress for the whole course so the outline shows real completion
  useEffect(() => {
    if (!courseId || !isAuthenticated) {
      setCourseProgress({});
      return;
    }
    let cancelled = false;
    getCourseLessonProgress(courseId)
      .then((data) => {
        if (!cancelled) setCourseProgress(data);
      })
      .catch(() => {
        if (!cancelled) setCourseProgress({});
      });
    return () => { cancelled = true; };
  }, [courseId, isAuthenticated]);

  // Verify server-side access for the current lesson
  useEffect(() => {
    if (!courseId || !lessonId || !isAuthenticated) {
      setAccess({ hasAccess: true });
      return;
    }
    let cancelled = false;
    checkLessonAccess(courseId, lessonId)
      .then((res) => {
        if (!cancelled) setAccess(res);
      })
      .catch((e: any) => {
        if (!cancelled) setAccess({ hasAccess: false, reason: e?.response?.data?.message || 'Unable to verify access' });
      });
    return () => { cancelled = true; };
  }, [courseId, lessonId, isAuthenticated]);

  // Lock body scroll and close mobile outline on Escape
  useEffect(() => {
    if (!mobileOutlineOpen) return;
    document.body.classList.add('overflow-hidden');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOutlineOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', handleKey);
    };
  }, [mobileOutlineOpen]);

  // Track active learning time using page visibility and a periodic heartbeat
  useEffect(() => {
    if (!lesson?.id || !isAuthenticated) return;
    if (typeof document === 'undefined') return;

    let accumulatedSeconds = 0;
    let lastSentSeconds = 0;
    let sessionStart = document.hidden ? null : Date.now();

    const flush = () => {
      if (accumulatedSeconds > lastSentSeconds) {
        saveLessonProgress(lesson.id, { activeSeconds: accumulatedSeconds }).catch(() => {});
        lastSentSeconds = accumulatedSeconds;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (sessionStart) {
          accumulatedSeconds += Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
          sessionStart = null;
        }
      } else {
        sessionStart = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => {
      if (!document.hidden && sessionStart) {
        accumulatedSeconds += Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
        sessionStart = Date.now();
      }
      flush();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
      if (!document.hidden && sessionStart) {
        accumulatedSeconds += Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
      }
      flush();
    };
  }, [lesson?.id, isAuthenticated]);

  // Load learner notes for the current lesson
  useEffect(() => {
    if (!lesson?.id || !isAuthenticated) return;
    let cancelled = false;
    setNotesLoading(true);
    listMyNotes({ lessonId: lesson.id })
      .then((data) => {
        if (!cancelled) setNotes(data || []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });
    return () => { cancelled = true; };
  }, [lesson?.id, isAuthenticated]);

  // Load in-lesson formative knowledge check
  useEffect(() => {
    if (!lesson?.id || !isAuthenticated) return;
    let cancelled = false;
    setKcLoading(true);
    getKnowledgeCheck(lesson.id)
      .then((data) => {
        if (!cancelled) setKnowledgeCheck(data);
      })
      .catch(() => {
        if (!cancelled) setKnowledgeCheck(null);
      })
      .finally(() => {
        if (!cancelled) setKcLoading(false);
      });
    return () => { cancelled = true; };
  }, [lesson?.id, isAuthenticated]);

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
    if (moduleIndex < 0 || lessonIndex < 0) return { prev: null as null | { id: string }, next: null as null | { id: string }, isLastInModule: false, nextLocked: false };
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

    const isFree = (course as any)?.completionRules?.progression === 'free';
    const nextLocked = (() => {
      if (!next) return false;
      const flatLessons = lessonsByModule.flatMap((m) => m.lessons);
      const nextLesson = flatLessons.find((l) => l.id === next.id);
      if (!nextLesson) return false;
      if (nextLesson.isPreview) return false;
      if (!isAuthenticated || !enrollmentId) return true;
      if (isFree) return false;
      const idx = flatLessons.findIndex((l) => l.id === next.id);
      if (idx <= 0) return false;
      const prevLesson = flatLessons[idx - 1];
      if (prevLesson.isPreview) return false;
      return !courseProgress[prevLesson.id]?.isCompleted;
    })();

    return { prev, next, isLastInModule, nextLocked };
  }, [structure, courseProgress, isAuthenticated, enrollmentId, course]);

  const computedProgress = useMemo(() => {
    if (!course || !lesson) return null;
    const lessons = (course.modules || []).flatMap((module) => module.lessons || []);
    if (lessons.length === 0) return null;
    const completedLessons = lessons.filter((item) => courseProgress[item.id]?.isCompleted).length;
    return Math.round((completedLessons / lessons.length) * 100);
  }, [course, lesson, courseProgress]);

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

  const spineModules = useMemo<SpineModule[]>(() => {
    const flatLessons = structure.lessonsByModule.flatMap((entry) => entry.lessons);
    const isFree = (course as any)?.completionRules?.progression === 'free';

    return structure.lessonsByModule.map((entry) => ({
      id: entry.module.id,
      orderIndex: entry.module.orderIndex,
      title: entry.module.title,
      description: (entry.module as any).description || undefined,
      lessons: entry.lessons.map((l) => {
        const progress = courseProgress[l.id];
        let status: SpineLesson['status'];
        if (l.id === lessonId) {
          status = 'current';
        } else if (progress?.isCompleted) {
          status = 'completed';
        } else if ((progress?.watchPercent ?? 0) > 0 || (progress?.lastPositionSeconds ?? 0) > 0) {
          status = 'in_progress';
        } else {
          status = 'pending';
        }

        const isLocked = (() => {
          if (l.isPreview) return false;
          if (!isAuthenticated || !enrollmentId) return true;
          if (isFree) return false;
          const idx = flatLessons.findIndex((x) => x.id === l.id);
          if (idx <= 0) return false;
          const prev = flatLessons[idx - 1];
          if (prev.isPreview) return false;
          return !courseProgress[prev.id]?.isCompleted;
        })();

        return {
          id: l.id,
          title: l.title,
          type: l.type,
          durationMinutes: Math.floor(((l as any).durationSeconds || (l as any).videoDuration || 0) / 60) || undefined,
          isPreview: l.isPreview,
          status,
          isLocked,
          href: isLocked ? undefined : `/courses/${courseId}/lessons/${l.id}`,
        };
      }),
    }));
  }, [structure, lessonId, courseId, courseProgress, isAuthenticated, enrollmentId, course]);

  // On lesson load, push progress if enrolled
  useEffect(() => {
    const pushProgress = async () => {
      if (!enrollmentId) return;
      try {
        await updateEnrollmentProgress(enrollmentId, new Date());
      } catch (e) {
        // non-blocking
      }
    };
    pushProgress();
  }, [enrollmentId]);

  useEffect(() => {
    if (!quizOpen || quizSource !== 'persisted' || !persistedAttempt?.attempt.deadlineAt) return;
    const interval = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(interval);
  }, [quizOpen, quizSource, persistedAttempt?.attempt.deadlineAt]);

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

  const sanitizeHtml = (raw: string) => {
    if (typeof window === 'undefined') return raw;
    const template = document.createElement('template');
    template.innerHTML = raw;
    const blockedTags = new Set(['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style']);
    template.content.querySelectorAll('*').forEach((node) => {
      const element = node as HTMLElement;
      if (blockedTags.has(element.tagName.toLowerCase())) {
        element.remove();
        return;
      }
      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith('on') || value.startsWith('javascript:') || value.startsWith('data:text/html')) {
          element.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
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
      if (!isHeading(lines[i])) continue;
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
    if (!section.trim()) return [];
    const source = section;
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
    if ((lesson as any)?.type === 'quiz' && lesson?.content) return lesson.content as string;
    if ((lesson as any)?.content && hasAssessmentContent((lesson as any).content)) return (lesson as any).content as string;
    return null;
  };

  const findModuleFallbackQuizContent = () => {
    const entry = structure.lessonsByModule[structure.moduleIndex];
    const quizLesson = entry?.lessons?.find((l: any) => l?.type === 'quiz' && l?.content);
    if (quizLesson?.content) return quizLesson.content as string;
    const assessmentLesson = entry?.lessons?.find((l: any) => l?.content && hasAssessmentContent(l.content));
    if (assessmentLesson?.content) return assessmentLesson.content as string;
    return null;
  };

  const generateLessonQuiz = async (options?: { silentIfUnavailable?: boolean }) => {
    const silentIfUnavailable = options?.silentIfUnavailable === true;
    setQuizType('lesson');
    setQuizQuestions([]);
    setPersistedQuiz(null);
    setPersistedAttempt(null);
    persistedAttemptClosedRef.current = false;
    setSubmitResult(null);
    setSubmitError(null);
    setAnswers({});
    setPersistedAnswers({});
    setShowExplanations(false);
    setQuizResults({});
    setQuizError(null);
    setQuizFallbackContent(null);
    setQuizUnavailable(false);
    try {
      // Try to load persisted quiz first
      if (lesson && lesson.id) {
        const pq = await getQuizByLesson(lesson.id);
        if (pq) {
          const attempt = await startAssessmentAttempt((pq as any).id);
          const savedAnswers = Object.fromEntries(
            (attempt.items || [])
              .filter((item) => item.response !== null && item.response !== undefined)
              .map((item) => {
                const response = item.response;
                if (typeof response === 'string' && response.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(response);
                    if (Array.isArray(parsed)) return [item.questionId, parsed.map(String)];
                  } catch {}
                }
                return [item.questionId, response as string | number];
              }),
          );
          setQuizSource('persisted');
          setPersistedQuiz(pq as any);
          setPersistedAttempt(attempt);
          persistedAttemptClosedRef.current = false;
          setPersistedAnswers(savedAnswers);
          setQuizOpen(true);
          // Track quiz started (persisted)
          trackEvent({
            eventType: AnalyticsEventType.QUIZ_STARTED,
            lessonId: lesson.id,
            quizId: (pq as any).id,
            courseId: courseId as string,
            metadata: { source: 'persisted', attemptId: attempt.attempt.id },
          });
          return;
        }
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message || 'You cannot start this quiz right now.';
      if (status === 403) {
        if (silentIfUnavailable) {
          setQuizOpen(false);
        } else {
          setQuizUnavailable(true);
          setQuizError(message);
          setQuizOpen(true);
        }
        return;
      }
      // fall back to static lesson content
    }
    const fallback = findFallbackQuizContent();
    if (fallback) {
      setQuizSource('ai');
      setQuizFallbackContent(fallback);
      setQuizOpen(true);
      return;
    }
    if (silentIfUnavailable) {
      setQuizOpen(false);
      return;
    }
    setQuizSource('ai');
    setQuizUnavailable(true);
    setQuizError('No lesson quiz is available for this lesson.');
    setQuizOpen(true);
  };

  const generateModuleQuiz = async () => {
    setQuizType('module');
    setQuizQuestions([]);
    setPersistedQuiz(null);
    setPersistedAttempt(null);
    persistedAttemptClosedRef.current = false;
    setPersistedAnswers({});
    setSubmitResult(null);
    setSubmitError(null);
    setAnswers({});
    setShowExplanations(false);
    setQuizResults({});
    setQuizError(null);
    setQuizFallbackContent(null);
    setQuizUnavailable(false);
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
        const fallback = findModuleFallbackQuizContent();
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
      const fallback = findModuleFallbackQuizContent();
      if (fallback) {
        setQuizFallbackContent(fallback);
        setQuizError(msg || 'AI quiz is unavailable. Showing lesson quiz content instead.');
      } else {
        setQuizError(msg);
      }
    }
  };

  const persistedItems = persistedAttempt?.items?.length
    ? persistedAttempt.items.map((item) => ({
        id: item.questionId,
        stem: item.stem,
        options: item.options || [],
        explanation: item.explanation,
        type: item.type,
        isCorrect: item.isCorrect,
      }))
    : persistedQuiz?.questions || [];

  const savePersistedAnswer = async (questionId: string, answer: string | number | (string | number)[] | null) => {
    setPersistedAnswers((prev) => ({ ...prev, [questionId]: answer ?? '' }));
    if (!persistedAttempt || persistedAttemptClosedRef.current || submitting || submitResult) return;
    try {
      setPersistedSaveState('saving');
      const saved = await saveAttemptAnswer(persistedAttempt.attempt.id, questionId, answer);
      setPersistedAttempt((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => (item.questionId === questionId ? { ...item, ...saved } : item)),
            }
          : prev,
      );
      setPersistedSaveState('saved');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save answer';
      if (persistedAttemptClosedRef.current || submitting || submitResult || msg === 'This attempt is no longer active.') {
        return;
      }
      setPersistedSaveState('error');
      setSubmitError(msg);
    }
  };

  const remainingSeconds = persistedAttempt?.attempt.deadlineAt
    ? Math.max(0, Math.floor((new Date(persistedAttempt.attempt.deadlineAt).getTime() / 1000) - nowSeconds))
    : persistedAttempt?.remainingSeconds ?? null;

  const formatRemaining = (seconds: number | null) => {
    if (seconds === null) return null;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const formatShortDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleLessonEnded = async () => {
    if (lesson?.id && isAuthenticated) {
      try {
        const progress = await saveLessonProgress(lesson.id, {
          watchPercent: 100,
          lastPositionSeconds: 0,
          watchedSeconds: Math.floor(lessonDuration || 0),
        });
        setLessonProgress(progress);
      } catch {
        // Progress is helpful but should not block the learner.
      }
    }
  };

  const handleVideoProgress = useCallback(
    async (state: { lastPositionSeconds: number; watchedSeconds: number; percent: number }) => {
      if (!lesson?.id || !isAuthenticated) return;
      lastProgressRef.current = state;
      try {
        const progress = await saveLessonProgress(lesson.id, {
          lastPositionSeconds: state.lastPositionSeconds,
          watchedSeconds: state.watchedSeconds,
          watchPercent: state.percent,
        });
        setLessonProgress(progress);
        setProgressSaveState('idle');
      } catch {
        setProgressSaveState('error');
      }
    },
    [lesson?.id, isAuthenticated, lessonDuration],
  );

  const retrySaveProgress = useCallback(async () => {
    if (!lesson?.id || !lastProgressRef.current) return;
    try {
      const progress = await saveLessonProgress(lesson.id, {
        lastPositionSeconds: lastProgressRef.current.lastPositionSeconds,
        watchedSeconds: lastProgressRef.current.watchedSeconds,
        watchPercent: lastProgressRef.current.percent,
      });
      setLessonProgress(progress);
      setCourseProgress((current) => ({
        ...current,
        [lesson.id]: {
          isCompleted: progress.isCompleted,
          watchPercent: progress.watchPercent,
          lastPositionSeconds: progress.lastPositionSeconds,
          watchedSeconds: progress.watchedSeconds,
        },
      }));
      setProgressSaveState('idle');
    } catch {
      setProgressSaveState('error');
    }
  }, [lesson?.id, isAuthenticated]);

  const lessonRequiresQuiz = Boolean((lesson as any)?.hasQuiz || (lesson as any)?.minimumQuizScore);
  const requiredQuizScore = Number((lesson as any)?.minimumQuizScore ?? 70);
  const bestQuizScore = lessonProgress?.bestQuizScore ?? null;
  const quizAttempts = lessonProgress?.quizAttempts ?? 0;
  const quizPassed = bestQuizScore !== null && bestQuizScore >= requiredQuizScore;
  const watchedPercent = lessonProgress?.watchPercent ?? 0;
  const progressKnown = !lessonProgressLoading;
  const lessonStatusLabel = !progressKnown
    ? 'Checking status'
    : lessonProgress?.isCompleted
      ? 'Completed'
      : watchedPercent > 0
        ? `Watch saved ${watchedPercent}%`
        : 'Not started';
  const lessonStatusDetail = !progressKnown
    ? 'Loading this lesson record'
    : lessonProgress?.completedAt
      ? `Completed ${formatShortDate(lessonProgress.completedAt)}`
      : lessonRequiresQuiz
        ? quizPassed
          ? 'Quiz passed; lesson completion can be recorded'
          : 'Quiz pass still required'
        : watchedPercent > 0
          ? 'Progress is saved'
          : 'Start the lesson to save progress';
  const quizStatusLabel = !progressKnown
    ? 'Checking quiz'
    : quizAttempts > 0
      ? quizPassed
        ? `Passed ${bestQuizScore}%`
        : `Best ${bestQuizScore ?? 0}%`
      : lessonRequiresQuiz
        ? 'Required'
        : 'Optional';
  const quizStatusDetail = !progressKnown
    ? 'Loading attempts'
    : quizAttempts > 0
      ? `${quizAttempts} attempt${quizAttempts === 1 ? '' : 's'}${lessonProgress?.lastQuizAttemptAt ? ` - Last tried ${formatShortDate(lessonProgress.lastQuizAttemptAt)}` : ''}${!quizPassed && lessonRequiresQuiz ? ' - Retry needed' : ''}`
      : 'No attempt recorded for this lesson';

  const refreshNotes = useCallback(async () => {
    if (!lesson?.id || !isAuthenticated) return;
    try {
      const data = await listMyNotes({ lessonId: lesson.id });
      setNotes(data || []);
    } catch {
      setNotes([]);
    }
  }, [lesson?.id, isAuthenticated]);

  const openNewNote = useCallback(() => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTimestamp(Math.floor(playerRef.current?.getCurrentTime() || 0));
    setNoteError(null);
    setNoteFormOpen(true);
  }, []);

  const openEditNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title || '');
    setNoteContent(note.content);
    setNoteTimestamp(note.videoTimestampSeconds ?? null);
    setNoteError(null);
    setNoteFormOpen(true);
  }, []);

  const cancelNote = useCallback(() => {
    setNoteFormOpen(false);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTimestamp(null);
    setNoteError(null);
  }, []);

  const submitNote = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!lesson?.id || !courseId || !noteContent.trim()) return;
      setNoteError(null);
      try {
        if (editingNoteId) {
          await updateNote(editingNoteId, {
            title: noteTitle || undefined,
            content: noteContent.trim(),
            videoTimestampSeconds: noteTimestamp ?? undefined,
          });
          trackEvent({
            eventType: AnalyticsEventType.NOTE_UPDATED,
            courseId: courseId as string,
            lessonId: lesson.id,
            metadata: { noteId: editingNoteId },
          }).catch(() => {});
        } else {
          const created = await createNote({
            courseId: courseId as string,
            lessonId: lesson.id,
            title: noteTitle || undefined,
            content: noteContent.trim(),
            videoTimestampSeconds: noteTimestamp ?? undefined,
          });
          trackEvent({
            eventType: AnalyticsEventType.NOTE_CREATED,
            courseId: courseId as string,
            lessonId: lesson.id,
            metadata: { noteId: created?.id, videoTimestampSeconds: noteTimestamp ?? undefined },
          }).catch(() => {});
        }
        await refreshNotes();
        cancelNote();
      } catch {
        setNoteError('Failed to save note. Please try again.');
      }
    },
    [courseId, editingNoteId, lesson?.id, noteContent, noteTimestamp, noteTitle, refreshNotes, cancelNote],
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (!globalThis.confirm?.('Delete this note?')) return;
      try {
        await deleteNote(noteId);
        trackEvent({
          eventType: AnalyticsEventType.NOTE_DELETED,
          courseId: courseId as string,
          lessonId: lesson?.id,
          metadata: { noteId },
        }).catch(() => {});
        await refreshNotes();
      } catch {
        setNoteError('Failed to delete note.');
      }
    },
    [refreshNotes, courseId, lesson?.id],
  );

  const submitKnowledgeCheck = useCallback(
    async (questionId: string) => {
      if (!lesson?.id) return;
      setKcError(null);
      const answer = kcAnswers[questionId];
      if (answer === undefined || answer === null || answer === '') {
        setKcError('Select an answer first.');
        return;
      }
      try {
        const result = await submitKnowledgeCheckAnswer(lesson.id, { questionId, answer });
        setKcResults((prev) => ({ ...prev, [questionId]: result }));
        trackEvent({
          eventType: AnalyticsEventType.KNOWLEDGE_CHECK_ANSWERED,
          courseId: courseId as string,
          lessonId: lesson.id,
          metadata: { questionId, isCorrect: result.isCorrect, knowledgeCheckId: knowledgeCheck?.id },
        }).catch(() => {});
      } catch {
        setKcError('Failed to submit answer. Please try again.');
      }
    },
    [lesson?.id, kcAnswers, courseId, knowledgeCheck?.id],
  );

  return (
    <>
      <Head>
        <title>{lesson ? `${lesson.title} — Chitepo` : 'Lesson — Chitepo'}</title>
      </Head>
      <LessonLayout
        backHref={`/courses/${courseId}`}
        backLabel={course?.title || 'Course'}
        progress={typeof computedProgress === 'number' ? computedProgress : undefined}
        onMenuClick={() => setMobileOutlineOpen(true)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Mobile outline toggle */}
              <div className="lg:hidden mb-6">
                <button
                  type="button"
                  onClick={() => setMobileOutlineOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-cream border border-cream/20 rounded-md hover:bg-cream/10 transition-colors"
                >
                  <Bars3Icon className="w-5 h-5" />
                  Course outline
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ochre-400" />
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100/10 rounded-r-md">
                  <p className="text-sm text-terracotta-400">{error}</p>
                </div>
              )}
              {!loading && !lesson && (
                <div className="text-center py-20">
                  <p className="text-lg text-cream/80 mb-6">Lesson not found.</p>
                  <Link
                    href={`/courses/${courseId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                  >
                    Back to course
                  </Link>
                </div>
              )}
              {notEnrolled && (
                <div className="mb-6 p-4 border-l-4 border-ochre-500 bg-ochre-500/10 rounded-r-md">
                  <p className="text-sm text-cream/90">
                    You are not enrolled in this course. Enroll to track your progress and earn a certificate.
                  </p>
                </div>
              )}

              {progressSaveState === 'error' && (
                <div className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100/10 rounded-r-md flex items-center justify-between gap-4">
                  <p className="text-sm text-terracotta-400">
                    Could not save your learning progress. Your place is still safe in this browser tab.
                  </p>
                  <button
                    type="button"
                    onClick={retrySaveProgress}
                    className="px-3 py-1.5 text-xs font-semibold text-cream border border-cream/20 rounded-md hover:bg-cream/10 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {lesson && activeTab === 'curriculum' && (
                <div className="space-y-8">
                  {/* Breadcrumb + title */}
                  <div>
                    <nav aria-label="Breadcrumb" className="mb-3">
                      <ol className="flex items-center gap-2 text-sm text-cream/60">
                        <li>
                          <Link href={`/courses/${courseId}`} className="hover:text-cream transition-colors">
                            {course?.title || 'Course'}
                          </Link>
                        </li>
                        <li>/</li>
                        <li className="text-cream/80">
                          {structure.lessonsByModule[structure.moduleIndex]?.module.title || 'Module'}
                        </li>
                        <li>/</li>
                        <li className="text-ochre-400">{lesson.title}</li>
                      </ol>
                    </nav>
                    <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-cream mb-2">
                      {lesson.title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-cream/60">
                      {lesson.type === LessonType.VIDEO && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ochre-400" />
                          {lessonDuration != null ? `${Math.floor(lessonDuration / 60)}m ${lessonDuration % 60}s` : 'Video'}
                        </span>
                      )}
                      {estimatedRemainingMinutes != null && estimatedRemainingMinutes > 0 && (
                        <span>
                          {Math.floor(estimatedRemainingMinutes / 60) > 0 ? `${Math.floor(estimatedRemainingMinutes / 60)}h ` : ''}
                          {estimatedRemainingMinutes % 60}m remaining in course
                        </span>
                      )}
                    </div>
                    <div className="mt-5 border-y border-cream/10 py-3" aria-live="polite">
                      <div className="flex flex-col gap-3 text-sm text-cream/70 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <CheckCircleIcon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${lessonProgress?.isCompleted ? 'text-forest-400' : 'text-cream/35'}`} />
                          <div className="min-w-0">
                            <div className="font-semibold text-cream">{lessonStatusLabel}</div>
                            <div className="mt-0.5 text-xs text-cream/55">{lessonStatusDetail}</div>
                          </div>
                        </div>
                        <div className="hidden h-8 w-px bg-cream/10 sm:block" />
                        <div className="flex min-w-0 items-start gap-3 sm:text-right">
                          <AcademicCapIcon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${quizPassed ? 'text-forest-400' : quizAttempts > 0 ? 'text-ochre-400' : 'text-cream/35'}`} />
                          <div className="min-w-0">
                            <div className="font-semibold text-cream">{quizStatusLabel}</div>
                            <div className="mt-0.5 text-xs text-cream/55">{quizStatusDetail}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!access.hasAccess && (
                    <div className="mt-4 p-4 rounded-md bg-red-900/30 border border-red-700/50 text-cream/90">
                      <p className="font-semibold">Access locked</p>
                      <p className="text-sm">{access.reason || 'Complete the previous lesson to continue.'}</p>
                    </div>
                  )}

              {lesson.type === LessonType.VIDEO && (
                <div className="rounded-md overflow-hidden bg-ink-900 border border-cream/10">
                  {(lesson.contentUrl || (lesson as any).videoUrl) ? (
                    <LessonPlayer
                      ref={playerRef}
                      src={lesson.contentUrl || (lesson as any).videoUrl}
                      poster={(lesson as any).thumbnailUrl}
                      captionsUrl={(lesson as any).captionsUrl}
                      initialPositionSeconds={lessonProgress?.lastPositionSeconds ?? 0}
                      onEnded={handleLessonEnded}
                      onDuration={setLessonDuration}
                      onProgress={handleVideoProgress}
                      lessonId={lesson.id}
                      courseId={courseId as string}
                    />
                  ) : (
                    <div className="aspect-video flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-cream/10 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-cream/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-cream mb-2">Video content not available</p>
                      <p className="text-sm text-cream/50">The video URL for this lesson has not been configured yet.</p>
                    </div>
                  )}
                </div>
              )}

              {lesson.content && (
                <div className="bg-ink-900/50 border border-cream/10 rounded-md p-6 sm:p-8">
                  {(() => {
                    try {
                      const parsed = JSON.parse(lesson.content);
                      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
                        return (
                          <div className="prose prose-invert max-w-none space-y-4">
                            {parsed.map((block: any, idx: number) => {
                              switch (block.type) {
                                case 'heading':
                                  return <h2 key={idx} className="text-xl font-bold text-cream mb-3">{block.content}</h2>;
                                case 'text':
                                  return <p key={idx} className="text-cream/80 mb-3 leading-relaxed">{block.content}</p>;
                                case 'code':
                                  return (
                                    <div key={idx} className="mb-4">
                                      <pre className="bg-black text-cream/90 p-4 rounded-md overflow-x-auto">
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
                                        className="max-w-full h-auto rounded-md"
                                      />
                                      {block.metadata?.caption && (
                                        <p className="text-sm text-cream/50 mt-2 italic">{block.metadata.caption}</p>
                                      )}
                                    </div>
                                  );
                                default:
                                  return <div key={idx} className="text-cream/80 mb-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }} />;
                              }
                            })}
                          </div>
                        );
                      }
                    } catch (e) {
                      // Not JSON, treat as HTML/text
                    }
                    if (lesson.type === LessonType.TEXT) {
                      return <div className="prose prose-invert max-w-none whitespace-pre-wrap text-cream/80">{lesson.content}</div>;
                    }
                    return <div className="prose prose-invert max-w-none text-cream/80" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content || '') }} />;
                  })()}
                </div>
              )}

              {lesson.type === LessonType.TEXT && !lesson.content && (
                <div className="bg-ink-900/50 border border-cream/10 rounded-md p-6 sm:p-8 prose prose-invert max-w-none whitespace-pre-wrap text-cream/80">
                  {lesson.content || ''}
                </div>
              )}

              {lesson.type === LessonType.HTML && (
                <div className="bg-ink-900/50 border border-cream/10 rounded-md p-6 sm:p-8 prose prose-invert max-w-none text-cream/80" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content || '') }} />
              )}

              {lesson.type === LessonType.EMBED && lesson.contentUrl && (
                <div className="aspect-video w-full rounded-md overflow-hidden border border-cream/10 bg-ink-900">
                  <iframe
                    src={lesson.contentUrl}
                    className="w-full h-full"
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                >
                  Download material
                </a>
              )}

              {/* Transcript and resources */}
              {(((lesson as any).resourceLinks?.length ?? 0) > 0 || (lesson as any).transcript) && (
                <div className="bg-ink-900/50 border border-cream/10 rounded-md p-6 space-y-4">
                  {(lesson as any).transcript && (
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-semibold text-cream hover:text-ochre-400 transition-colors list-none flex items-center gap-2">
                        <span aria-hidden>▶</span>
                        Transcript
                      </summary>
                      <div className="mt-3 max-h-72 overflow-y-auto text-sm text-cream/80 pr-2">
                        {(lesson as any).transcript.split('\n').map((line: string, idx: number) => {
                          const ts = parseTimestampSeconds(line);
                          const lineText = line.replace(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—]?\s*/, '');
                          return (
                            <div key={idx} className="py-0.5">
                              {ts !== null ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => playerRef.current?.seekTo(ts)}
                                    className="text-ochre-400 hover:text-ochre-300 underline decoration-dotted mr-2"
                                    aria-label={`Seek to ${formatTimestamp(ts)}`}
                                  >
                                    {formatTimestamp(ts)}
                                  </button>
                                  <span>{lineText}</span>
                                </>
                              ) : (
                                <span>{line}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                  {((lesson as any).resourceLinks?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-cream mb-2">Resources</h4>
                      <ul className="space-y-2">
                        {(lesson as any).resourceLinks.map((resource: { title?: string; url: string }, idx: number) => (
                          <li key={idx}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-ochre-400 hover:text-ochre-300 transition-colors"
                              onClick={() => {
                                if (lesson?.id) {
                                  trackEvent({
                                    eventType: AnalyticsEventType.RESOURCE_DOWNLOADED,
                                    courseId: courseId as string,
                                    lessonId: lesson.id,
                                    metadata: { resourceTitle: resource.title, resourceUrl: resource.url },
                                  }).catch(() => {});
                                }
                              }}
                            >
                              {resource.title || `Resource ${idx + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Learner notes */}
              {isAuthenticated && (
                <div className="bg-ink-900/50 border border-cream/10 rounded-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-cream">My notes</h4>
                    <button
                      type="button"
                      onClick={openNewNote}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Add note
                    </button>
                  </div>

                  {noteFormOpen && (
                    <form onSubmit={submitNote} className="mb-4 space-y-3">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Title (optional)"
                        className="w-full px-3 py-2 text-sm bg-ink-950 border border-cream/20 rounded-md text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-ochre-500"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-cream/60">
                          Timestamp: {formatTimestamp(noteTimestamp || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNoteTimestamp(Math.floor(playerRef.current?.getCurrentTime() || 0))}
                          className="text-xs text-ochre-400 hover:text-ochre-300 underline decoration-dotted"
                        >
                          Update to current position
                        </button>
                      </div>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        required
                        rows={3}
                        placeholder="Write your note..."
                        className="w-full px-3 py-2 text-sm bg-ink-950 border border-cream/20 rounded-md text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-ochre-500 resize-y"
                      />
                      {noteError && (
                        <p className="text-xs text-terracotta-400">{noteError}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-ink-950 bg-forest-500 rounded-md hover:bg-forest-400 transition-colors"
                        >
                          {editingNoteId ? 'Update note' : 'Save note'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelNote}
                          className="px-4 py-2 text-xs font-semibold text-cream border border-cream/20 rounded-md hover:bg-cream/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {notesLoading ? (
                    <div className="text-xs text-cream/50">Loading notes…</div>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-cream/50">No notes for this lesson yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {notes.map((note) => (
                        <li key={note.id} className="border-b border-cream/10 last:border-0 pb-3 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {note.videoTimestampSeconds !== undefined && note.videoTimestampSeconds !== null && (
                                <button
                                  type="button"
                                  onClick={() => playerRef.current?.seekTo(note.videoTimestampSeconds!)}
                                  className="text-xs text-ochre-400 hover:text-ochre-300 underline decoration-dotted mb-1"
                                >
                                  {formatTimestamp(note.videoTimestampSeconds)}
                                </button>
                              )}
                              {note.title && (
                                <p className="text-sm font-semibold text-cream mb-0.5">{note.title}</p>
                              )}
                              <p className="text-sm text-cream/80 whitespace-pre-wrap">{note.content}</p>
                              <p className="text-[10px] text-cream/40 mt-1">
                                {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditNote(note)}
                                className="p-1.5 text-cream/60 hover:text-cream hover:bg-cream/10 rounded transition-colors"
                                aria-label="Edit note"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 text-cream/60 hover:text-terracotta-400 hover:bg-terracotta-400/10 rounded transition-colors"
                                aria-label="Delete note"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* In-lesson formative knowledge check */}
              {isAuthenticated && knowledgeCheck && (
                <div className="bg-ink-900/50 border border-cream/10 rounded-md p-6">
                  <h4 className="text-sm font-semibold text-cream mb-4">Knowledge check</h4>
                  {kcLoading ? (
                    <div className="text-xs text-cream/50">Loading knowledge check…</div>
                  ) : (
                    <div className="space-y-5">
                      {knowledgeCheck.questions.map((question) => {
                        const result = kcResults[question.id];
                        const isTrueFalse = question.type === 'true_false';
                        const isShortAnswer = question.type === 'short_answer';
                        const options = isTrueFalse && (!question.options || question.options.length < 2)
                          ? ['True', 'False']
                          : question.options || [];
                        return (
                          <div key={question.id} className="space-y-2">
                            <p className="text-sm text-cream font-medium">{question.stem}</p>
                            {isShortAnswer ? (
                              <input
                                type="text"
                                value={kcAnswers[question.id] || ''}
                                onChange={(e) =>
                                  setKcAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                                }
                                placeholder="Type your answer…"
                                aria-label={question.stem}
                                className="w-full max-w-md px-3 py-2 text-sm bg-ink-950 border border-cream/10 rounded-md text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-ochre-500"
                              />
                            ) : (
                              options.map((option, idx) => {
                                const selected = kcAnswers[question.id] === String(idx);
                                return (
                                  <label
                                    key={idx}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border cursor-pointer transition-colors ${
                                      selected
                                        ? 'bg-ochre-400/10 border-ochre-400 text-cream'
                                        : 'bg-ink-950 border-cream/10 text-cream/80 hover:border-cream/30'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`kc-${question.id}`}
                                      value={idx}
                                      checked={selected}
                                      onChange={() =>
                                        setKcAnswers((prev) => ({ ...prev, [question.id]: String(idx) }))
                                      }
                                      className="accent-ochre-400"
                                    />
                                    {option}
                                  </label>
                                );
                              })
                            )}
                            {!result ? (
                              <button
                                type="button"
                                onClick={() => submitKnowledgeCheck(question.id)}
                                className="px-4 py-2 text-xs font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                              >
                                Check answer
                              </button>
                            ) : (
                              <div
                                className={`p-3 rounded-md text-sm ${
                                  result.isCorrect
                                    ? 'bg-forest-500/10 text-forest-400 border border-forest-500/20'
                                    : 'bg-terracotta-400/10 text-terracotta-400 border border-terracotta-400/20'
                                }`}
                              >
                                <p className="font-medium">{result.isCorrect ? 'Correct' : 'Incorrect'}</p>
                                {result.explanation && (
                                  <p className="text-xs text-cream/80 mt-1">{result.explanation}</p>
                                )}
                                {!result.isCorrect && result.correctAnswer && (
                                  <p className="text-xs text-cream/80 mt-1">
                                    Correct answer: {result.correctAnswer}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {kcError && <p className="text-xs text-terracotta-400">{kcError}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation + reflection */}
              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-cream/10">
                <div className="flex items-center gap-3">
                  {prevNext.prev && (
                    <Link
                      href={`/courses/${courseId}/lessons/${prevNext.prev.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-cream border border-cream/20 rounded-md hover:bg-cream/10 transition-colors"
                    >
                      ← Previous
                    </Link>
                  )}
                  {prevNext.next && (
                    prevNext.nextLocked ? (
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-cream/50 border border-cream/10 rounded-md cursor-not-allowed" title={access.reason || 'Complete the previous lesson to continue'}>
                        Next →
                      </span>
                    ) : (
                      <Link
                        href={`/courses/${courseId}/lessons/${prevNext.next.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                      >
                        Next →
                      </Link>
                    )
                  )}
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  {(lessonProgress?.quizAttempts || 0) > 0 && (
                    <div className="text-right text-xs text-cream/60">
                      <div className="font-semibold text-cream">Best quiz score {lessonProgress?.bestQuizScore ?? 0}%</div>
                      <div>{lessonProgress?.quizAttempts} attempt{lessonProgress?.quizAttempts === 1 ? '' : 's'} recorded</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => generateLessonQuiz()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-cream bg-forest-700 rounded-md hover:bg-forest-600 transition-colors"
                  >
                    Take lesson quiz
                  </button>
                  {prevNext.isLastInModule && (
                    <button
                      type="button"
                      onClick={generateModuleQuiz}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                    >
                      Module quiz
                    </button>
                  )}
                </div>
              </div>

              {(lesson as any).completionMode === 'manual' && !lessonProgress?.isCompleted && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!lesson?.id) return;
                      try {
                        const progress = await saveLessonProgress(lesson.id, { manualComplete: true });
                        setLessonProgress(progress);
                      } catch {
                        // Manual completion is best-effort; the server still validates the rule.
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-ink-950 bg-forest-500 rounded-md hover:bg-forest-400 transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Mark lesson complete
                  </button>
                </div>
              )}

              {/* Reflection / next step */}
              <div className="bg-forest-900/30 border border-forest-700/50 rounded-md p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ochre-400 mb-2">
                  Reflect
                </h3>
                <p className="text-cream/80 leading-relaxed mb-4">
                  Before moving on, consider how this lesson connects to the module theme and your own context.
                </p>
                {prevNext.next ? (
                  prevNext.nextLocked ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-cream/40 cursor-not-allowed" title={access.reason || 'Complete the previous lesson to continue'}>
                      Continue to the next lesson →
                    </span>
                  ) : (
                    <Link
                      href={`/courses/${courseId}/lessons/${prevNext.next.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-ochre-400 hover:text-ochre-300 transition-colors"
                    >
                      Continue to the next lesson →
                    </Link>
                  )
                ) : (
                  <Link
                    href={`/courses/${courseId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-ochre-400 hover:text-ochre-300 transition-colors"
                  >
                    Return to course home →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 text-cream/80">
              <h2 className="font-serif text-2xl font-semibold text-cream">About this course</h2>
              <p className="leading-relaxed">{(course as any)?.description || 'No description available.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Estimated duration', value: `${Math.round(((course as any)?.estimatedDuration || 0) / 60)} hours` },
                  { label: 'Difficulty', value: String((course as any)?.difficulty || 'n/a').toLowerCase() },
                  { label: 'Progress', value: typeof computedProgress === 'number' ? `${computedProgress}%` : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-ink-900/50 border border-cream/10 rounded-md p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-cream/50 mb-1">{stat.label}</div>
                    <div className="text-lg font-semibold text-cream capitalize">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructors tab */}
          {activeTab === 'instructors' && (
            <div className="space-y-4 text-cream/80">
              <h2 className="font-serif text-2xl font-semibold text-cream">Instructor</h2>
              <p>{(course as any)?.instructor?.name || 'Chitepo Instructor'}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-cream/10 pb-1">
            {(['curriculum', 'overview', 'instructors'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize rounded-md transition-colors ${
                  activeTab === tab
                    ? 'text-ink-950 bg-ochre-400'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quiz Panel */}
          {quizOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 flex items-end md:items-center md:justify-center">
              <div className="w-full md:max-w-2xl bg-paper text-charcoal rounded-t-2xl md:rounded-md p-5 md:p-8 shadow-sm max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-semibold">{quizType === 'lesson' ? 'Lesson Quiz' : 'Module Quiz'}</h2>
                  <button
                    onClick={() => setQuizOpen(false)}
                    className="p-2 text-stone hover:text-charcoal rounded-md hover:bg-cream transition-colors"
                    aria-label="Close quiz"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {quizSource === 'persisted' && persistedQuiz ? (

                    <div className="space-y-5">

                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone">
                        <span>This is a graded quiz. Select all answers that apply. Correct answers from earlier attempts are locked.</span>
                        <span className="inline-flex items-center gap-3">
                          {formatRemaining(remainingSeconds) ? (
                            <span className={remainingSeconds !== null && remainingSeconds <= 60 ? 'text-terracotta-600 font-semibold' : 'text-charcoal'}>
                              Time left: {formatRemaining(remainingSeconds)}
                            </span>
                          ) : null}
                          <span className={persistedSaveState === 'error' ? 'text-terracotta-600' : 'text-pewter'}>
                            {persistedSaveState === 'saving'
                              ? 'Saving...'
                              : persistedSaveState === 'saved'
                                ? 'Saved'
                                : persistedSaveState === 'error'
                                  ? 'Save failed'
                                  : ''}
                          </span>
                        </span>
                      </div>

                      {(() => {

                        const autoGradable = persistedItems.some((q: any) => Array.isArray(q.options) && q.options.length > 0);

                        if (!autoGradable) {

                          return (

                            <div className="text-sm text-ochre-600 bg-ochre-100 border border-ochre-400/40 rounded p-2">

                              This assessment contains written questions and is not auto-graded.

                            </div>

                          );

                        }

                        return null;

                      })()}

                      {submitResult && (

                        <div className={`p-3 rounded border ${
                          submitResult.passed === null
                            ? 'border-ochre-400/40 bg-ochre-100 text-ochre-600'
                            : submitResult.passed
                              ? 'border-forest-400/40 bg-forest-100 text-forest-700'
                              : 'border-terracotta-400/40 bg-terracotta-100 text-terracotta-600'
                        }`}>

                          <div className="font-semibold">
                            {submitResult.passed === null ? 'Pending grading' : submitResult.passed ? 'Passed' : 'Not Passed'}
                          </div>

                          <div>Score: {Math.round(submitResult.score)}%</div>

                        </div>

                      )}

                      {persistedItems.map((q: any, idx: number) => (

                        <div key={q.id} className="border border-stone/20 rounded-md p-4">

                          <div className="font-medium mb-2">{idx + 1}. {q.stem}</div>

                          {Array.isArray(q.options) && q.options.length > 0 ? (

                            <div className="space-y-2">

                              {(q.options || []).map((opt: string, oi: number) => {

                                const selected = Array.isArray(persistedAnswers[q.id])
                                  ? (persistedAnswers[q.id] as (string | number)[]).map(String).includes(String(oi))
                                  : String(persistedAnswers[q.id] ?? '') === String(oi);
                                const locked = q.isCorrect === true;

                                return (

                                  <label key={oi} className={`flex items-center gap-2 p-2 rounded border ${selected ? 'border-forest-600 bg-forest-100' : 'border-stone/20'} ${locked ? 'cursor-not-allowed opacity-75' : ''}`}>

                                    <input

                                      type="checkbox"

                                      name={`pq-${q.id}`}

                                      className="h-4 w-4"

                                      checked={selected}

                                      disabled={submitting || !!submitResult || locked}

                                      onChange={() => {
                                        const current = Array.isArray(persistedAnswers[q.id])
                                          ? (persistedAnswers[q.id] as (string | number)[]).map(String)
                                          : persistedAnswers[q.id] === undefined || persistedAnswers[q.id] === ''
                                            ? []
                                            : [String(persistedAnswers[q.id])];
                                        const next = selected
                                          ? current.filter((value) => value !== String(oi))
                                          : [...current, String(oi)];
                                        savePersistedAnswer(q.id, next);
                                      }}

                                    />

                                    <span>{opt}</span>

                                  </label>

                                );

                              })}

                            </div>

                          ) : (

                            <div className="space-y-2">

                              <textarea

                                className="w-full min-h-[120px] rounded-md border border-stone/30 p-2 text-sm"

                                placeholder="Write your answer here..."

                                value={(persistedAnswers[q.id] ?? '') as string}

                                disabled={submitting || !!submitResult || q.isCorrect === true}

                                onChange={(e) => setPersistedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                onBlur={(e) => savePersistedAnswer(q.id, e.target.value)}

                              />

                              <div className="text-xs text-pewter">Written responses are not auto-graded.</div>

                            </div>

                          )}

                          {submitResult && (

                            <div className={`mt-2 text-sm ${submitResult.answers.find(a => a.questionId === q.id)?.isCorrect ? 'text-forest-700' : 'text-terracotta-600'}`}>

                              {submitResult.answers.find(a => a.questionId === q.id)?.isCorrect ? 'Correct' : 'Incorrect'}

                              {q.explanation ? <div className="mt-1 text-stone">{q.explanation}</div> : null}

                            </div>

                          )}

                        </div>

                      ))}

                      {submitError && <div className="text-sm text-terracotta-600 bg-terracotta-100 border border-terracotta-400/40 rounded p-2">{submitError}</div>}

                      <div className="flex flex-wrap items-center gap-3">

                        {!submitResult && persistedItems.length > 0 ? (

                          <button

                            type="button"

                            disabled={submitting}

                            onClick={async () => {

                              if (!persistedQuiz) return;

                              setSubmitting(true);

                              setSubmitError(null);
                              let closedAttemptForSubmit = false;

                              try {
                                const unanswered = persistedItems.filter((q: any) => {
                                  const answer = persistedAnswers[q.id];
                                  return answer === undefined || answer === null || String(answer).trim() === '';
                                }).length;
                                if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`)) {
                                  setSubmitting(false);
                                  return;
                                }

                                let res;
                                if (persistedAttempt) {
                                  await Promise.all(
                                    Object.entries(persistedAnswers).map(([questionId, answer]) =>
                                      saveAttemptAnswer(persistedAttempt.attempt.id, questionId, answer),
                                    ),
                                  );
                                  persistedAttemptClosedRef.current = true;
                                  closedAttemptForSubmit = true;
                                  res = await submitAssessmentAttempt(persistedAttempt.attempt.id);
                                } else {
                                  res = await submitQuizAttempt(persistedQuiz.id, persistedAnswers);
                                }

                                setSubmitResult({ score: Number(res.score || 0), passed: res.passed ?? null, answers: (res as any).answers || [] });
                                await refreshLessonProgress();

                                // Track quiz completed (persisted)

                                if (lesson?.id) {

                                  trackEvent({

                                    eventType: AnalyticsEventType.QUIZ_COMPLETED,

                                    lessonId: lesson.id,

                                    courseId: courseId as string,

                                    quizId: persistedQuiz.id,

                                    metadata: { source: 'persisted', attemptId: persistedAttempt?.attempt.id, score: Number(res.score || 0), passed: res.passed },

                                  });

                                }

                              } catch (e: any) {

                                if (closedAttemptForSubmit && !submitResult) {
                                  persistedAttemptClosedRef.current = false;
                                }

                                const msg = e?.response?.data?.message || 'Failed to submit quiz';

                                setSubmitError(msg);

                              } finally {

                                setSubmitting(false);

                              }

                            }}

                            className="inline-flex items-center px-4 py-2 rounded-md bg-forest-600 text-white hover:bg-forest-500 disabled:opacity-50"

                          >

                            {submitting ? 'Submitting...' : 'Submit Quiz'}

                          </button>

                        ) : (

                          <button

                            type="button"

                            onClick={() => setQuizOpen(false)}

                            className="inline-flex items-center px-4 py-2 rounded-md bg-charcoal text-cream hover:bg-ink-900"

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

                        <div className="text-charcoal">

                          {quizFallbackContent ? (

                            <div className="space-y-4">

                              {quizError && <div className="text-sm text-ochre-600 bg-ochre-100 border border-ochre-400/40 rounded p-2">{quizError}</div>}

                              <div className="text-sm text-stone">This lesson includes a static quiz. Answer in your notes or with your instructor.</div>

                              <div className="prose max-w-none whitespace-pre-wrap">

                                {(() => {

                                  const parsedQuestions = parseFallbackQuestions(quizFallbackContent);

                                  if (parsedQuestions.length > 0) {

                                    return (

                                      <div className="space-y-5">

                                        {parsedQuestions.map((q, qi) => (

                                          <div key={`${qi}-${q.question.slice(0, 10)}`} className="border border-stone/20 rounded-md p-4">

                                            <div className="font-medium mb-2">{qi + 1}. {q.question}</div>

                                            {q.options.length > 0 ? (

                                              <div className="space-y-2">

                                                {q.options.map((opt, oi) => (

                                                  <div key={`${qi}-${oi}`} className={`flex items-start gap-2 rounded border px-3 py-2 ${opt.isCorrect ? 'border-forest-400/40 bg-forest-100' : 'border-stone/20'}`}>

                                                    <span className="text-sm text-pewter">{String.fromCharCode(65 + oi)}.</span>

                                                    <span className="text-sm text-charcoal">{opt.text}</span>

                                                  </div>

                                                ))}

                                              </div>

                                            ) : (

                                              <div className="text-sm text-stone">Answer in your notes.</div>

                                            )}

                                          </div>

                                        ))}

                                      </div>

                                    );

                                  }

                                  const { section } = extractAssessmentSection(quizFallbackContent);

                                  if (!section.trim()) {

                                    return <div className="text-sm text-stone">No quiz content is available for this lesson.</div>;

                                  }

                                  const fallbackText = section;

                                  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(fallbackText || '');

                                  return looksLikeHtml ? (

                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(fallbackText || '') }} />

                                  ) : (

                                    <div className="whitespace-pre-wrap">{fallbackText}</div>

                                  );

                                })()}

                              </div>

                              <div className="flex flex-wrap items-center gap-2">

                                <button

                                  type="button"

                                  onClick={() => setQuizOpen(false)}

                                  className="inline-flex items-center px-4 py-2 rounded-md bg-charcoal text-cream hover:bg-ink-900"

                                >

                                  Close

                                </button>

                              </div>

                            </div>

                          ) : quizError ? (

                            <>

                              <p className="text-terracotta-600">{quizError}</p>

                              <div className="mt-4 flex flex-wrap items-center gap-2">

                                <button

                                  type="button"

                                  onClick={() => setQuizOpen(false)}

                                  className="inline-flex items-center px-4 py-2 rounded-md bg-charcoal text-cream hover:bg-ink-900"

                                >

                                  Close

                                </button>

                                {isAuthenticated && !quizUnavailable && (

                                  <button

                                    type="button"

                                    onClick={() => {
                                      if (quizType === 'lesson') {
                                        generateLessonQuiz();
                                      } else {
                                        generateModuleQuiz();
                                      }
                                    }}

                                    className="inline-flex items-center px-4 py-2 rounded-md bg-forest-600 text-white hover:bg-forest-500"

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

                            <p className="mt-2 text-sm text-terracotta-600">You must be logged in to generate quizzes.</p>

                          )}

                        </div>

                      ) : (

                        <div className="space-y-5">
                          {quizError && (
                            <div className="text-sm text-ochre-600 bg-ochre-100 border border-ochre-400/40 rounded p-2">
                              {quizError}
                            </div>
                          )}

                          {quizQuestions.map((q, idx) => (

                            <div key={idx} className="border border-stone/20 rounded-md p-4">

                              <div className="font-medium mb-2">{idx + 1}. {q.question}</div>

                              <div className="space-y-2">

                                {q.options.map((opt, oi) => (

                                  <label key={oi} className={`flex items-center gap-2 p-2 rounded border ${answers[idx] === oi ? 'border-forest-600 bg-forest-100' : 'border-stone/20'}`}>

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

                                <div className={`mt-2 text-sm ${quizResults[idx]?.isCorrect ? 'text-forest-700' : 'text-terracotta-600'}`}>

                                  {quizResults[idx]?.isCorrect ? 'Correct' : 'Incorrect'}

                                  {quizResults[idx]?.explanation ? <div className="mt-1 text-stone">{quizResults[idx]?.explanation}</div> : null}

                                </div>

                              )}

                            </div>

                          ))}

                          {!showExplanations ? (

                            <button

                              type="button"

                              onClick={async () => {
                                const resultsMap: Record<number, { isCorrect: boolean; explanation?: string }> = {};
                                quizQuestions.forEach((q, idx) => {
                                  const selected = q.options[(answers[idx] ?? -1) as number];
                                  const hasInlineKey = q.correctAnswer !== undefined && q.correctAnswer !== null;
                                  resultsMap[idx] = {
                                    isCorrect: hasInlineKey ? selected != null && selected === q.correctAnswer : false,
                                    explanation: hasInlineKey ? q.explanation : 'Submitted for practice. This question is not graded in this mode.',
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

                              className="inline-flex items-center px-4 py-2 rounded-md bg-forest-600 text-white hover:bg-forest-500"

                            >

                              Submit Answers

                            </button>

                          ) : (

                            <button

                              type="button"

                              onClick={() => setQuizOpen(false)}

                              className="inline-flex items-center px-4 py-2 rounded-md bg-charcoal text-cream hover:bg-ink-900"

                            >

                              Close

                            </button>

                          )}

                        </div>

                      )}

                    </>

                  ) : (

                    <div className="text-charcoal">

                      <p>Loading quiz...</p>

                    </div>

                  )}

                </div>

              </div>

            </div>

          )}

          </div>



            {/* Desktop Knowledge Spine (right) */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <CourseKnowledgeSpine
                  modules={spineModules}
                  isEnrolled={isAuthenticated}
                  title="Knowledge Spine"
                />
              </div>
            </aside>

            {/* Mobile right-hand drawer */}
            {mobileOutlineOpen && (
              <div
                ref={drawerRef}
                className="lg:hidden fixed inset-0 z-50"
                role="dialog"
                aria-modal="true"
                aria-label="Course outline"
              >
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setMobileOutlineOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-0 h-full w-11/12 max-w-sm bg-ink-950 border-l border-cream/10 shadow-sm flex flex-col">
                  <div className="px-5 py-4 border-b border-cream/10 flex items-center justify-between">
                    <div className="font-serif font-semibold text-cream">Course Outline</div>
                    <button
                      onClick={() => setMobileOutlineOpen(false)}
                      className="p-2 text-cream/60 hover:text-cream rounded-md hover:bg-cream/10 transition-colors"
                      aria-label="Close outline"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 overflow-auto">
                    <CourseKnowledgeSpine
                      modules={spineModules}
                      isEnrolled={isAuthenticated}
                      title="Knowledge Spine"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </LessonLayout>
    </>
  );
}
