import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { instructorCreateCourse, instructorGetCourse, instructorSubmitCourse, instructorUpdateCourse, type InstructorCourse, generateCourseOutline, listModules, type ModuleDTO, createModule as apiCreateModule, linkCourseModule as apiLinkCourseModule, updateCourseModule as apiUpdateCourseModule, unlinkCourseModule as apiUnlinkCourseModule, createLesson as apiCreateLesson, updateLesson as apiUpdateLesson, deleteLesson as apiDeleteLesson, reorderLessons as apiReorderLessons } from '@/lib/api/instructor';
import { uploadVideo } from '@/lib/api/files';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';

type LessonSettings = {
  duration?: string;
  hasQuiz?: 'Yes' | 'No';
  visibility?: 'Draft' | 'Published';
  completionMode?: 'required' | 'optional' | 'manual';
  minimumWatchPercent?: string;
  minimumQuizScore?: string;
  transcript?: string;
  resources?: string;
};
type LessonNode = {
  id: string;
  title: string;
  content?: string;
  contentUrl?: string;
  backendLessonId?: string;
} & LessonSettings;
type ModuleNode = { id: string; title: string; lessons: LessonNode[]; reused?: boolean; sourceModuleId?: string; usageCount?: number; backendModuleId?: string };

export default function CourseBuilder() {
  const router = useRouter();
  const { courseId } = router.query as { courseId?: string };
  const isExplicitNewRoute = typeof router.asPath === 'string' && router.asPath.endsWith('/instructor/course/new');
  const isNew = courseId === 'new' || isExplicitNewRoute;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleNode[]>([]);
  const [selected, setSelected] = useState<{ type: 'course' | 'module' | 'lesson'; moduleId?: string; lessonId?: string }>({ type: 'course' });
  const storageKey = useMemo(() => `course-builder:${isNew ? 'new' : (courseId || 'unknown')}`,[isNew, courseId]);
  const [preview, setPreview] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<ModuleDTO[]>([]);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const lessonSettings = useMemo(() => {
    return modules.reduce<Record<string, LessonSettings>>((acc, module) => {
      module.lessons.forEach((lesson) => {
        acc[lesson.id] = lesson;
      });
      return acc;
    }, {});
  }, [modules]);

  // Fetch course data from backend when editing existing course
  useEffect(() => {
    if (!isNew && courseId && courseId !== 'new') {
      setLoading(true);
      setPreview(false); // Reset preview when loading new course
      setError(null);
      instructorGetCourse(courseId)
        .then((course: any) => {
          setTitle(course.title || '');
          setDescription(course.description || '');
          
          // Convert backend modules to frontend ModuleNode format
          if (course.modules && Array.isArray(course.modules)) {
            const convertedModules: ModuleNode[] = course.modules.map((m: any) => ({
              id: m.id,
              title: m.title || 'Untitled Module',
              backendModuleId: m.id,
              lessons: (m.lessons || []).map((l: any) => ({
                id: l.id,
                title: l.title || 'Untitled Lesson',
                content: l.content,
                contentUrl: l.videoUrl || l.contentUrl || l.video_url || '',
                backendLessonId: l.id,
                duration: l.durationMinutes?.toString() || l.estimatedDurationMin?.toString() || (l.durationSeconds ? Math.ceil(l.durationSeconds / 60).toString() : ''),
                hasQuiz: l.hasQuiz ? 'Yes' : 'No',
                visibility: l.isPublished ? 'Published' : 'Draft',
                completionMode: l.completionMode || 'required',
                minimumWatchPercent: l.minimumWatchPercent?.toString() || '',
                minimumQuizScore: l.minimumQuizScore?.toString() || '',
                transcript: l.transcript || '',
                resources: Array.isArray(l.resourceLinks)
                  ? l.resourceLinks.map((r: any) => `${r.title || ''} | ${r.url || ''}`.trim()).join('\n')
                  : '',
              })),
            }));
            setModules(convertedModules);
          }
        })
        .catch((err) => {
          setError(err?.message || 'Failed to load course');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [courseId, isNew]);

  // Load from localStorage on mount/route change (fallback for new courses)
  useEffect(() => {
    if (isNew) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as { title?: string; description?: string; modules?: ModuleNode[] };
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.modules) setModules(parsed.modules);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isNew]);

  // Persist to localStorage when data changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify({ title, description, modules }));
      }
    } catch {}
  }, [storageKey, title, description, modules]);

  const addModule = async () => {
    const localId = `m_${Date.now()}`;
    const newModule: ModuleNode = { id: localId, title: 'New module', lessons: [] };
    setModules((prev) => [...prev, newModule]);
    setSelected({ type: 'module', moduleId: newModule.id });
    // If editing an existing course, persist immediately: create reusable module, then link
    if (!isNew && courseId) {
      try {
        const created = await apiCreateModule({ title: newModule.title });
        setModules(prev => prev.map(m => m.id === localId ? { ...m, backendModuleId: created.id } : m));
        const sortOrder = modules.length; // appended at end
        await apiLinkCourseModule(courseId, { module_id: created.id, sort_order: sortOrder });
      } catch (e) {
        // keep local if it fails
      }
    }
  };
  const addLesson = async (moduleId: string) => {
    const localId = `l_${Date.now()}`;
    const newLesson: LessonNode = { id: localId, title: 'New lesson' };
    setModules((prev) => prev.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m));
    setSelected({ type: 'lesson', moduleId, lessonId: localId });
    
    // If editing existing course and module has backend ID, persist lesson
    if (!isNew && courseId) {
      const foundModule = modules.find(m => m.id === moduleId);
      if (foundModule?.backendModuleId) {
        try {
          const created = await apiCreateLesson(foundModule.backendModuleId, { 
            title: newLesson.title,
            order_within_module: foundModule.lessons.length
          });
          setModules(prev => prev.map(m => 
            m.id === moduleId ? {
              ...m, 
              lessons: m.lessons.map(l => 
                l.id === localId ? { ...l, backendLessonId: created.id } : l
              )
            } : m
          ));
        } catch (e) {
          // keep local if it fails
        }
      }
    }
  };
  const removeModule = async (moduleId: string) => {
    const target = modules.find(m => m.id === moduleId);
    setModules((prev) => prev.filter(m => m.id !== moduleId));
    setSelected({ type: 'course' });
    if (!isNew && courseId && target?.backendModuleId) {
      try { await apiUnlinkCourseModule(courseId, target.backendModuleId); } catch {}
    }
  };
  const removeLesson = async (moduleId: string, lessonId: string) => {
    const foundModule = modules.find(m => m.id === moduleId);
    const lesson = foundModule?.lessons.find(l => l.id === lessonId);
    
    setModules((prev) => prev.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m));
    setSelected({ type: 'module', moduleId });
    
    // Delete from backend if it exists
    if (!isNew && lesson?.backendLessonId) {
      try { await apiDeleteLesson(lesson.backendLessonId); } catch {}
    }
  };
  const renameModule = (moduleId: string, newTitle: string) => {
    setModules((prev) => prev.map(m => m.id === moduleId ? { ...m, title: newTitle } : m));
  };
  const updateLesson = async (moduleId: string, lessonId: string, newTitle: string) => {
    const foundModule = modules.find(m => m.id === moduleId);
    const lesson = foundModule?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    setModules((prev) => prev.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title: newTitle } : l) } : m));
    
    // Update backend if lesson exists
    if (!isNew && lesson?.backendLessonId) {
      try { await apiUpdateLesson(lesson.backendLessonId, { title: newTitle }); } catch {}
    }
  };

  const updateLessonContent = async (moduleId: string, lessonId: string, content: string) => {
    const foundModule = modules.find(m => m.id === moduleId);
    const lesson = foundModule?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    setModules((prev) => prev.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, content } : l) } : m));
    
    // Update backend if lesson exists
    if (!isNew && lesson?.backendLessonId) {
      try { await apiUpdateLesson(lesson.backendLessonId, { content }); } catch {}
    }
  };

  const updateLessonContentUrl = async (moduleId: string, lessonId: string, contentUrl: string) => {
    const foundModule = modules.find(m => m.id === moduleId);
    const lesson = foundModule?.lessons.find(l => l.id === lessonId);
    
    setModules((prev) => prev.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, contentUrl } : l) } : m));
    
    // Update backend if lesson exists
    if (!isNew && lesson?.backendLessonId) {
      try { await apiUpdateLesson(lesson.backendLessonId, { contentUrl }); } catch {}
    }
  };

  const parseResourceLinks = (resources?: string) => {
    const rows = resources?.split('\n').map(row => row.trim()).filter(Boolean) || [];
    return rows.map(row => {
      const [titlePart, ...urlParts] = row.split('|');
      const url = (urlParts.join('|') || titlePart).trim();
      return { title: (urlParts.length ? titlePart : url).trim(), url };
    });
  };

  const updateLessonSettings = async (moduleId: string, lessonId: string, settings: Partial<LessonSettings>) => {
    const foundModule = modules.find(m => m.id === moduleId);
    const lesson = foundModule?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setModules((prev) => prev.map(m => m.id === moduleId ? {
      ...m,
      lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...settings } : l),
    } : m));

    if (!isNew && lesson.backendLessonId) {
      const payload: any = {};
      if ('duration' in settings) payload.estimatedDurationMin = settings.duration;
      if ('hasQuiz' in settings) payload.hasQuiz = settings.hasQuiz === 'Yes';
      if ('visibility' in settings) payload.visibility = settings.visibility;
      if ('completionMode' in settings) payload.completionMode = settings.completionMode;
      if ('minimumWatchPercent' in settings) payload.minimumWatchPercent = settings.minimumWatchPercent;
      if ('minimumQuizScore' in settings) payload.minimumQuizScore = settings.minimumQuizScore;
      if ('transcript' in settings) payload.transcript = settings.transcript;
      if ('resources' in settings) payload.resourceLinks = parseResourceLinks(settings.resources);

      try { await apiUpdateLesson(lesson.backendLessonId, payload); } catch {}
    }
  };

  const handleVideoUpload = async (moduleId: string, lessonId: string, file: File) => {
    setVideoUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Check if lesson exists in backend
      const foundModule = modules.find(m => m.id === moduleId);
      const lesson = foundModule?.lessons.find(l => l.id === lessonId);
      
      if (!lesson?.backendLessonId) {
        throw new Error('Please save the course first before uploading videos');
      }
      
      const result = await uploadVideo(file);
      
      // Update lesson with the video URL
      await updateLessonContentUrl(moduleId, lessonId, result.fileUrl);
      
      setToast('Video uploaded successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to upload video');
      setErrorMessage(e?.message || 'Failed to upload video');
      setShowErrorModal(true);
    } finally {
      setVideoUploading(false);
      setUploadProgress(0);
    }
  };

  // Reorder helpers
  const persistSortOrders = async (list: ModuleNode[]) => {
    if (!isNew && courseId) {
      // best-effort: update each linked module sort_order
      await Promise.all(list.map((m, i) => m.backendModuleId ? apiUpdateCourseModule(courseId, m.backendModuleId, { sort_order: i }) : Promise.resolve()));
    }
  };

  const moveModule = (moduleId: string, direction: -1 | 1) => {
    setModules(prev => {
      const idx = prev.findIndex(m => m.id === moduleId);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      // persist in background
      persistSortOrders(copy).catch(() => {});
      return copy;
    });
  };
  const persistLessonOrders = async (moduleId: string, lessons: LessonNode[]) => {
    if (!isNew && courseId) {
      const foundModule = modules.find(m => m.id === moduleId);
      if (foundModule?.backendModuleId) {
        const lessonOrders = lessons
          .filter(l => l.backendLessonId)
          .map((l, i) => ({ lessonId: l.backendLessonId!, orderIndex: i }));
        if (lessonOrders.length > 0) {
          try { await apiReorderLessons(foundModule.backendModuleId, lessonOrders); } catch {}
        }
      }
    }
  };

  const moveLesson = (moduleId: string, lessonId: string, direction: -1 | 1) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      const idx = m.lessons.findIndex(l => l.id === lessonId);
      if (idx < 0) return m;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= m.lessons.length) return m;
      const copy = [...m.lessons];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      // persist in background
      persistLessonOrders(moduleId, copy).catch(() => {});
      return { ...m, lessons: copy };
    }));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setShowErrorModal(false);
    try {
      if (isNew) {
        const created: InstructorCourse = await instructorCreateCourse({ title, description });
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.replace(`/instructor/course/${created.id}`);
        }, 1500);
      } else if (courseId) {
        await instructorUpdateCourse(courseId, { title, description });
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (e: any) {
      const message = e?.message || 'Failed to save course';
      setErrorMessage(message);
      setShowErrorModal(true);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onSubmitForReview = async () => {
    if (!courseId || isNew) return;
    setSaving(true);
    setError(null);
    try {
      await instructorSubmitCourse(courseId);
      setToast('Submitted for review');
      setTimeout(() => setToast(null), 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  const generateAiOutline = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const result = await generateCourseOutline(aiPrompt);
      const newModules: ModuleNode[] = result.modules.map((m, mi) => ({
        id: `m_${Date.now()}_${mi}`,
        title: m.title,
        lessons: m.lessons.map((l, li) => ({ id: `l_${Date.now()}_${mi}_${li}`, title: l.title })),
      }));
      setModules(newModules);
      setAiPrompt('');
      setToast('AI outline generated!');
    } catch (e) {
      setError('Failed to generate AI outline');
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfUploading(true);
    try {
      // TODO: Implement PDF upload and AI processing
      const formData = new FormData();
      formData.append('pdf', file);
      
      // For now, simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI-generated course structure from PDF
      const mockResult = {
        title: `Course from ${file.name}`,
        description: 'AI-generated course from uploaded PDF content',
        modules: [
          {
            title: 'Introduction',
            lessons: [
              { title: 'Overview' },
              { title: 'Learning Objectives' }
            ]
          },
          {
            title: 'Core Concepts',
            lessons: [
              { title: 'Fundamental Principles' },
              { title: 'Key Frameworks' },
              { title: 'Best Practices' }
            ]
          },
          {
            title: 'Practical Applications',
            lessons: [
              { title: 'Case Studies' },
              { title: 'Hands-on Exercises' }
            ]
          }
        ]
      };

      setTitle(mockResult.title);
      setDescription(mockResult.description);
      const newModules: ModuleNode[] = mockResult.modules.map((m, mi) => ({
        id: `m_${Date.now()}_${mi}`,
        title: m.title,
        lessons: m.lessons.map((l, li) => ({ 
          id: `l_${Date.now()}_${mi}_${li}`, 
          title: l.title,
          content: `Content extracted from PDF for lesson: ${l.title}`
        })),
      }));
      setModules(newModules);
      setPdfFile(null);
      setToast('Course generated from PDF!');
    } catch (e) {
      setError('Failed to process PDF');
    } finally {
      setPdfUploading(false);
    }
  };

  const loadLibraryModules = async (q = '') => {
    setLibraryLoading(true);
    try {
      const res = await listModules({ search: q || undefined, page: 1, pageSize: 20 });
      setLibraryItems(res.items || []);
    } catch (e) {
      // ignore; surfaced via UI if needed
    } finally {
      setLibraryLoading(false);
    }
  };

  const addLibraryModule = (m: ModuleDTO) => {
    const node: ModuleNode = {
      id: `m_reuse_${m.id}_${Date.now()}`,
      title: m.title,
      lessons: [],
      reused: true,
      sourceModuleId: m.id,
      usageCount: m.usageCount,
      backendModuleId: m.id,
    };
    setModules(prev => [...prev, node]);
    setSelected({ type: 'module', moduleId: node.id });
    if (!isNew && courseId) {
      const sortOrder = modules.length;
      apiLinkCourseModule(courseId, { module_id: m.id, sort_order: sortOrder }).catch(() => {});
    }
  };

  // Native drag-and-drop for modules
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const onDragStart = (index: number) => setDragIdx(index);
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (index: number) => {
    if (dragIdx === null || dragIdx === index) return;
    setModules(prev => {
      const copy = [...prev];
      const [item] = copy.splice(dragIdx, 1);
      copy.splice(index, 0, item);
      persistSortOrders(copy).catch(() => {});
      return copy;
    });
    setDragIdx(null);
  };

  // Native drag-and-drop for lessons
  const [lessonDragState, setLessonDragState] = useState<{ moduleId: string; lessonIdx: number } | null>(null);
  const onLessonDragStart = (moduleId: string, lessonIdx: number) => setLessonDragState({ moduleId, lessonIdx });
  const onLessonDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onLessonDrop = (moduleId: string, lessonIdx: number) => {
    if (!lessonDragState || lessonDragState.moduleId !== moduleId || lessonDragState.lessonIdx === lessonIdx) return;
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      const copy = [...m.lessons];
      const [item] = copy.splice(lessonDragState.lessonIdx, 1);
      copy.splice(lessonIdx, 0, item);
      persistLessonOrders(moduleId, copy).catch(() => {});
      return { ...m, lessons: copy };
    }));
    setLessonDragState(null);
  };

  return (
    <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-forest-50 via-white to-terracotta-50 pointer-events-none" />
          <div className="relative px-6 pt-8 pb-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-forest-600 to-terracotta-600 bg-clip-text text-transparent">
                  Course Builder
                </h1>
                <button
                  onClick={() => router.push('/instructor/courses')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
              <p className="mt-2 text-sm text-stone">Structure modules and lessons, edit content, and submit for review.</p>
              <div className="mt-4 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-md ${aiMode ? 'bg-forest-600 text-white' : 'bg-forest-100 text-charcoal'}`}
                        onClick={() => setAiMode(true)} role="button">AI Copilot</span>
                  <span className={`text-xs px-2 py-1 rounded-md ${!aiMode ? 'bg-forest-600 text-white' : 'bg-forest-100 text-charcoal'}`}
                        onClick={() => setAiMode(false)} role="button">Manual</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your course (e.g., 2-hour crash course on Prompt Engineering for marketers)"
                    className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500"
                  />
                  <button onClick={generateAiOutline} disabled={aiGenerating || !aiPrompt.trim()} className={`px-4 py-2 rounded-md text-white ${aiGenerating || !aiPrompt.trim() ? 'bg-stone' : 'bg-forest-600 hover:bg-forest-700'}`}>{aiGenerating ? 'Generating…' : 'Instant outline'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto space-y-4">
            {toast && <div className="text-forest-700 text-sm">{toast}</div>}
            {error && <div className="text-sm text-terracotta-600">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: course meta + modules tree */}
              <aside className="lg:col-span-1 space-y-6">
                <div className="bg-white/70 backdrop-blur rounded-md border shadow-sm p-4 space-y-3">
                  <div className="text-sm font-semibold text-charcoal">Course details</div>
                  <div>
                    <label className="block text-xs text-stone mb-1">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" placeholder="e.g. Root Cause Analysis in Food Safety" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" rows={4} placeholder="Short overview" />
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur rounded-md border shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-charcoal">Outline</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAiMode(!aiMode)} className={`text-xs px-2 py-1 rounded-md ${aiMode ? 'bg-terracotta-100 text-terracotta-700' : 'border bg-white hover:bg-paper'}`}>AI</button>
                      <button onClick={() => { setLibraryOpen(true); loadLibraryModules(''); }} className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-paper">Browse library</button>
                      <button onClick={addModule} className="text-xs px-2 py-1 rounded-md bg-forest-600 text-white hover:bg-forest-700">Add module</button>
                    </div>
                  </div>
                  
                  {aiMode && (
                    <div className="mb-4 p-3 bg-terracotta-50 rounded-md space-y-3">
                      <div className="text-xs font-medium text-terracotta-900">AI Course Generation</div>
                      
                      {/* PDF Upload */}
                      <div>
                        <label className="block text-xs text-stone mb-1">Upload PDF</label>
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPdfFile(file);
                              handlePdfUpload(file);
                            }
                          }}
                          className="w-full text-xs"
                          disabled={pdfUploading}
                        />
                        {pdfUploading && <div className="text-xs text-stone mt-1">Processing PDF...</div>}
                      </div>
                      
                      <div className="text-xs text-stone text-center">or</div>
                      
                      {/* Text Prompt */}
                      <div>
                        <label className="block text-xs text-stone mb-1">Describe your course</label>
                        <textarea 
                          value={aiPrompt} 
                          onChange={e => setAiPrompt(e.target.value)} 
                          className="w-full text-xs rounded border-border/60 focus:border-terracotta-500 focus:ring-terracotta-500" 
                          rows={3} 
                          placeholder="e.g. A course about food safety management for restaurant owners"
                        />
                        <button 
                          onClick={generateAiOutline} 
                          disabled={aiGenerating || !aiPrompt.trim()} 
                          className={`mt-2 w-full text-xs px-3 py-1.5 rounded ${(aiGenerating || !aiPrompt.trim()) ? 'bg-stone' : 'bg-terracotta-600 hover:bg-terracotta-700'} text-white`}
                        >
                          {aiGenerating ? 'Generating...' : 'Generate Outline'}
                        </button>
                      </div>
                    </div>
                  )}
                  <ul className="space-y-2 text-sm">
                    {modules.length === 0 && (
                      <li className="text-xs text-stone">No modules yet. Start by adding one.</li>
                    )}
                    {modules.map((m, i) => (
                      <li key={m.id} className="border rounded-md" draggable onDragStart={() => onDragStart(i)} onDragOver={onDragOver} onDrop={() => onDrop(i)}>
                        <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${selected.type==='module' && selected.moduleId===m.id ? 'bg-forest-50' : 'bg-white'}`}
                             onClick={() => setSelected({ type: 'module', moduleId: m.id })}>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              value={m.title}
                              onChange={e => renameModule(m.id, e.target.value)}
                              className="flex-1 rounded border-border/60 focus:border-forest-500 focus:ring-forest-500 text-sm"
                            />
                            {m.reused && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-ochre-100 text-ochre-800" title={`Reused module${m.usageCount ? ` • used ${m.usageCount} times` : ''}`}>Reused</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(ev) => { ev.stopPropagation(); moveModule(m.id, -1); }} className="text-xs px-2 py-1 rounded border bg-white hover:bg-paper" title="Move up">↑</button>
                            <button onClick={(ev) => { ev.stopPropagation(); moveModule(m.id, 1); }} className="text-xs px-2 py-1 rounded border bg-white hover:bg-paper" title="Move down">↓</button>
                            <button onClick={(ev) => { ev.stopPropagation(); removeModule(m.id); }} className="text-xs px-2 py-1 rounded border bg-white hover:bg-paper">Remove</button>
                          </div>
                        </div>
                        <div className="p-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-stone">Lessons</div>
                            <button onClick={() => addLesson(m.id)} className="text-xs px-2 py-1 rounded-md bg-ink-900 text-white hover:bg-ink-950">Add lesson</button>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {m.lessons.map((l, lessonIdx) => (
                              <li key={l.id} 
                                  className={`flex items-center justify-between px-2 py-1 rounded ${selected.type==='lesson' && selected.lessonId===l.id ? 'bg-forest-50' : 'bg-white'}`}
                                  draggable 
                                  onDragStart={() => onLessonDragStart(m.id, lessonIdx)} 
                                  onDragOver={onLessonDragOver} 
                                  onDrop={() => onLessonDrop(m.id, lessonIdx)}
                                  onClick={() => setSelected({ type: 'lesson', moduleId: m.id, lessonId: l.id })}>
                                <input
                                  value={l.title}
                                  onChange={e => updateLesson(m.id, l.id, e.target.value)}
                                  className="mr-2 flex-1 rounded border-border/60 focus:border-forest-500 focus:ring-forest-500 text-sm"
                                />
                                <div className="flex items-center gap-1">
                                  <button onClick={(ev) => { ev.stopPropagation(); moveLesson(m.id, l.id, -1); }} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-paper" title="Move up">↑</button>
                                  <button onClick={(ev) => { ev.stopPropagation(); moveLesson(m.id, l.id, 1); }} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-paper" title="Move down">↓</button>
                                  <button onClick={(ev) => { ev.stopPropagation(); removeLesson(m.id, l.id); }} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-paper">Remove</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              {/* Main editor */}
              <section className="lg:col-span-3 space-y-4">
                <div className="bg-white/70 backdrop-blur rounded-md border shadow-sm p-6">
                  {selected.type === 'course' && (
                    <div className="text-sm text-stone">Select a module or lesson from the outline to edit its content. Start by adding a module.</div>
                  )}
                  {selected.type === 'module' && (
                    <div>
                      <div className="text-lg font-semibold">Module content</div>
                      <div className="mt-2 text-sm text-stone">Add lessons to this module in the sidebar. Rich module-level content editor — TODO.</div>
                    </div>
                  )}
                  {selected.type === 'lesson' && (() => {
                    const foundModule = modules.find(m => m.id === selected.moduleId);
                    const lesson = foundModule?.lessons.find(l => l.id === selected.lessonId);
                    if (!foundModule || !lesson) {
                      return <div className="text-sm text-stone">Select a lesson from the outline to edit its content.</div>;
                    }
                    return (
                      <div className="space-y-4">
                        <div className="text-lg font-semibold">Lesson editor</div>
                        
                        {/* Video Section */}
                        <div className="bg-paper rounded-md p-4 space-y-3">
                          <div className="text-sm font-medium text-charcoal">Video Content</div>
                          
                          {/* Video Upload */}
                          <div>
                            <label className="block text-xs text-stone mb-2">Upload Video</label>
                            <div className="flex items-center gap-3">
                              <input 
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && lesson) {
                                    handleVideoUpload(selected.moduleId!, selected.lessonId!, file);
                                  }
                                }}
                                disabled={videoUploading}
                                className="block w-full text-sm text-stone file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-forest-50 file:text-forest-700 hover:file:bg-forest-100 disabled:opacity-50"
                              />
                            </div>
                            {videoUploading && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-stone mb-1">
                                  <span>Uploading video...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-forest-100 rounded-full h-2">
                                  <div 
                                    className="bg-forest-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* OR Divider */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 border-t border-border/60"></div>
                            <span className="text-xs text-stone font-medium">OR</span>
                            <div className="flex-1 border-t border-border/60"></div>
                          </div>
                          
                          {/* Video URL */}
                          <div>
                            <label className="block text-xs text-stone mb-1">Video URL (HLS/MP4)</label>
                            <input 
                              className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" 
                              placeholder="https://..." 
                              value={lesson?.contentUrl || ''} 
                              onChange={e => lesson && updateLessonContentUrl(selected.moduleId!, selected.lessonId!, e.target.value)}
                              disabled={videoUploading}
                            />
                            <p className="mt-1 text-xs text-stone">Enter a direct video URL or upload a video file above</p>
                          </div>
                          
                          {/* Video Preview */}
                          {lesson?.contentUrl && (
                            <div className="mt-3">
                              <div className="text-xs text-stone mb-2">Video Preview</div>
                              <video 
                                src={lesson.contentUrl} 
                                controls 
                                className="w-full rounded-md border border-border/60 max-h-64"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </div>
                        
                        {/* Lesson Content */}
                        <div>
                          <label className="block text-xs text-stone mb-1">Lesson content (Markdown)</label>
                          <textarea 
                            rows={10} 
                            className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" 
                            placeholder="Write lesson content..."
                            value={lesson?.content || ''}
                            onChange={e => lesson && updateLessonContent(selected.moduleId!, selected.lessonId!, e.target.value)}
                          />
                        </div>
                        
                        {/* Lesson Settings */}
                        <div className="bg-paper rounded-md p-4 space-y-4">
                          <div className="text-sm font-medium text-charcoal">Lesson Settings</div>
                          
                          {/* Basic Settings Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-stone mb-1">Estimated duration (min)</label>
                              <input 
                                type="number" 
                                className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" 
                                placeholder="10"
                                value={lessonSettings[lesson.id]?.duration || ''}
                                onChange={e => updateLessonSettings(selected.moduleId!, selected.lessonId!, { duration: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-stone mb-1">Has quiz?</label>
                              <select 
                                className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500"
                                value={lessonSettings[lesson.id]?.hasQuiz || 'No'}
                                onChange={e => updateLessonSettings(selected.moduleId!, selected.lessonId!, { hasQuiz: e.target.value as 'Yes' | 'No' })}
                              >
                                <option>No</option>
                                <option>Yes</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-stone mb-1">Visibility</label>
                              <select 
                                className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500"
                                value={lessonSettings[lesson.id]?.visibility || 'Draft'}
                                onChange={e => updateLessonSettings(selected.moduleId!, selected.lessonId!, { visibility: e.target.value as 'Draft' | 'Published' })}
                              >
                                <option>Draft</option>
                                <option>Published</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Completion Settings Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-stone mb-1">Completion mode</label>
                              <select 
                                className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500"
                                value={lessonSettings[lesson.id]?.completionMode || 'required'}
                                onChange={e => updateLessonSettings(selected.moduleId!, selected.lessonId!, { completionMode: e.target.value as 'required' | 'optional' | 'manual' })}
                              >
                                <option value="required">Required</option>
                                <option value="optional">Optional</option>
                                <option value="manual">Manual</option>
                              </select>
                              <p className="mt-1 text-xs text-stone">How students complete this lesson</p>
                            </div>
                            <div>
                              <label className="block text-xs text-stone mb-1">Min. watch % (0-100)</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" 
                                placeholder="80"
                                value={lessonSettings[lesson.id]?.minimumWatchPercent || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                                    updateLessonSettings(selected.moduleId!, selected.lessonId!, { minimumWatchPercent: val });
                                  }
                                }}
                              />
                              <p className="mt-1 text-xs text-stone">Video watch requirement</p>
                            </div>
                            <div>
                              <label className="block text-xs text-stone mb-1">Min. quiz score % (0-100)</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500" 
                                placeholder="70"
                                value={lessonSettings[lesson.id]?.minimumQuizScore || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                                    updateLessonSettings(selected.moduleId!, selected.lessonId!, { minimumQuizScore: val });
                                  }
                                }}
                              />
                              <p className="mt-1 text-xs text-stone">Quiz pass requirement</p>
                            </div>
                          </div>
                          
                          {/* Transcript */}
                          <div>
                            <label className="block text-xs text-stone mb-1">Transcript (optional)</label>
                            <textarea 
                              rows={4} 
                              className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500 text-sm" 
                              placeholder="Enter video transcript for accessibility..."
                              value={lessonSettings[lesson.id]?.transcript || ''}
                              onChange={e => updateLessonSettings(selected.moduleId!, selected.lessonId!, { transcript: e.target.value })}
                            />
                            <p className="mt-1 text-xs text-stone">Improves accessibility and SEO</p>
                          </div>
                          
                          {/* Resource Links */}
                          <div>
                            <label className="block text-xs text-stone mb-1">Resource links (one per line)</label>
                            <textarea 
                              rows={4} 
                              className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500 text-sm font-mono" 
                              placeholder="Title | https://example.com&#10;Documentation | https://docs.example.com"
                              value={lessonSettings[lesson.id]?.resources || ''}
                              onChange={e => updateLessonSettings(selected.moduleId!, selected.lessonId!, { resources: e.target.value })}
                            />
                            <p className="mt-1 text-xs text-stone">Format: Title | URL (one per line)</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button onClick={() => setPreview(p => !p)} className="px-5 py-2.5 rounded-md border border-border/60 bg-white hover:bg-paper shadow-sm transition-colors">{preview ? 'Close preview' : 'Preview'}</button>
                  <button onClick={onSave} disabled={saving} className={`px-5 py-2.5 rounded-md text-white shadow-sm transition-colors ${saving ? 'bg-stone cursor-not-allowed' : 'bg-forest-600 hover:bg-forest-700'}`}>{saving ? 'Saving…' : 'Save Course'}</button>
                  <button onClick={onSubmitForReview} disabled={saving || isNew} className={`px-5 py-2.5 rounded-md text-white shadow-sm transition-colors ${(saving || isNew) ? 'bg-stone cursor-not-allowed' : 'bg-forest-600 hover:bg-forest-700'}`}>Submit for Review</button>
                </div>

                {preview && (
                  <div className="mt-4 bg-white/70 backdrop-blur rounded-md border shadow-sm p-6">
                    <div className="text-sm font-semibold mb-2">Preview</div>
                    <div className="prose max-w-none">
                      <h1 className="text-xl font-bold">{title || 'Untitled course'}</h1>
                      <p className="text-stone">{description || 'No description yet.'}</p>
                      <ol className="list-decimal ml-5 mt-3">
                        {modules.map((m, mi) => (
                          <li key={m.id} className="mb-2">
                            <div className="font-medium">Module {mi + 1}: {m.title}</div>
                            <ul className="list-disc ml-5">
                              {m.lessons.map((l, li) => (
                                <li key={l.id}>Lesson {li + 1}: {l.title}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Module Library Modal */}
        {libraryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setLibraryOpen(false)} />
            <div className="relative bg-white rounded-md shadow-sm border w-[92vw] max-w-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-charcoal">Module library</div>
                  <p className="mt-1 text-xs text-stone">Reuse approved modules or search by title, tag, or topic.</p>
                </div>
                <button onClick={() => setLibraryOpen(false)} className="text-xs px-3 py-1.5 rounded-md border bg-white hover:bg-paper">Close</button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input 
                    value={librarySearch} 
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadLibraryModules(librarySearch);
                    }}
                    placeholder="Search modules..."
                    className="w-full rounded-md border-border/60 pl-3 pr-3 py-2 text-sm focus:border-forest-500 focus:ring-forest-500" 
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadLibraryModules(librarySearch)}
                    disabled={libraryLoading}
                    className="px-3 py-2 rounded-md bg-forest-600 text-white text-sm hover:bg-forest-700 disabled:opacity-60"
                  >
                    Search
                  </button>
                  <button
                    onClick={() => {
                      setLibrarySearch('');
                      loadLibraryModules('');
                    }}
                    className="px-3 py-2 rounded-md border text-sm text-stone hover:bg-paper"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-stone">
                <span>{libraryLoading ? 'Searching...' : `${libraryItems.length} results`}</span>
                <span>Tip: leave search empty to see latest modules.</span>
              </div>

              <div className="mt-4 max-h-[360px] overflow-auto border rounded-md divide-y bg-white">
                {libraryLoading && (
                  <div className="p-4 space-y-3 animate-pulse">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-forest-100 rounded w-2/3" />
                        <div className="h-3 bg-forest-100 rounded w-5/6" />
                        <div className="h-3 bg-forest-100 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}
                {!libraryLoading && libraryItems.length === 0 && (
                  <div className="p-10 text-center text-sm text-stone">
                    <svg className="h-8 w-8 text-pewter mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No modules found. Try a different search.</p>
                    <button
                      onClick={() => loadLibraryModules('')}
                      className="mt-3 inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs text-stone hover:bg-paper"
                    >
                      Show all modules
                    </button>
                  </div>
                )}
                {!libraryLoading && libraryItems.map((m) => {
                  const alreadyAdded = modules.some((mod) => mod.backendModuleId === m.id || mod.sourceModuleId === m.id);
                  const visibility = m.visibility || 'private';
                  const visibilityStyles =
                    visibility === 'public'
                      ? 'bg-forest-50 text-forest-700'
                      : visibility === 'shared'
                      ? 'bg-forest-50 text-forest-700'
                      : 'bg-forest-100 text-stone';

                  return (
                    <div key={m.id} className="p-4 hover:bg-paper transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-charcoal truncate">{m.title}</h4>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${visibilityStyles}`}>
                              {visibility}
                            </span>
                          </div>
                          {m.summary && (
                            <p className="text-xs text-stone line-clamp-2 mb-2">{m.summary}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-stone">
                            {m.estimatedDurationMin && (
                              <span className="flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {m.estimatedDurationMin} min
                              </span>
                            )}
                            {typeof m.usageCount === 'number' && (
                              <span className="flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Used {m.usageCount}× in courses
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {alreadyAdded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-medium text-forest-700">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Already added
                            </span>
                          ) : (
                            <button 
                              onClick={() => addLibraryModule(m)} 
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-950 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add to course
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-md shadow-sm border max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center text-charcoal mb-2">Course Saved Successfully!</h3>
              <p className="text-sm text-center text-stone">Your course has been saved and all changes are now stored.</p>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowErrorModal(false)} />
            <div className="relative bg-white rounded-md shadow-sm border max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-terracotta-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center text-charcoal mb-2">Failed to Save Course</h3>
              <p className="text-sm text-center text-stone mb-4">{errorMessage}</p>
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowErrorModal(false)}
                  className="px-6 py-2 bg-terracotta-600 text-white rounded-md hover:bg-terracotta-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </RoleGuard>
  );
}
