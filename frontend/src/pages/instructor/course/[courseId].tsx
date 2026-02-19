import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { instructorCreateCourse, instructorGetCourse, instructorSubmitCourse, instructorUpdateCourse, type InstructorCourse, generateCourseOutline, listModules, type ModuleDTO, createModule as apiCreateModule, linkCourseModule as apiLinkCourseModule, updateCourseModule as apiUpdateCourseModule, unlinkCourseModule as apiUnlinkCourseModule, createLesson as apiCreateLesson, updateLesson as apiUpdateLesson, deleteLesson as apiDeleteLesson, reorderLessons as apiReorderLessons } from '@/lib/api/instructor';
import { uploadVideo } from '@/lib/api/files';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';

type LessonNode = { id: string; title: string; content?: string; contentUrl?: string; backendLessonId?: string };
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
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-pink-50 pointer-events-none" />
          <div className="relative px-6 pt-8 pb-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  Course Builder
                </h1>
                <button
                  onClick={() => router.push('/instructor/courses')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">Structure modules and lessons, edit content, and submit for review.</p>
              <div className="mt-4 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg ${aiMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setAiMode(true)} role="button">AI Copilot</span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${!aiMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setAiMode(false)} role="button">Manual</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your course (e.g., 2-hour crash course on Prompt Engineering for marketers)"
                    className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button onClick={generateAiOutline} disabled={aiGenerating || !aiPrompt.trim()} className={`px-4 py-2 rounded-lg text-white ${aiGenerating || !aiPrompt.trim() ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{aiGenerating ? 'Generating…' : 'Instant outline'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto space-y-4">
            {toast && <div className="text-green-700 text-sm">{toast}</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: course meta + modules tree */}
              <aside className="lg:col-span-1 space-y-6">
                <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Course details</div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g. Root Cause Analysis in Food Safety" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" rows={4} placeholder="Short overview" />
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900">Outline</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAiMode(!aiMode)} className={`text-xs px-2 py-1 rounded-lg ${aiMode ? 'bg-purple-100 text-purple-700' : 'border bg-white hover:bg-gray-50'}`}>AI</button>
                      <button onClick={() => { setLibraryOpen(true); loadLibraryModules(''); }} className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-50">Browse library</button>
                      <button onClick={addModule} className="text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Add module</button>
                    </div>
                  </div>
                  
                  {aiMode && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg space-y-3">
                      <div className="text-xs font-medium text-purple-900">AI Course Generation</div>
                      
                      {/* PDF Upload */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Upload PDF</label>
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
                        {pdfUploading && <div className="text-xs text-gray-500 mt-1">Processing PDF...</div>}
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">or</div>
                      
                      {/* Text Prompt */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Describe your course</label>
                        <textarea 
                          value={aiPrompt} 
                          onChange={e => setAiPrompt(e.target.value)} 
                          className="w-full text-xs rounded border-gray-300 focus:border-purple-500 focus:ring-purple-500" 
                          rows={3} 
                          placeholder="e.g. A course about food safety management for restaurant owners"
                        />
                        <button 
                          onClick={generateAiOutline} 
                          disabled={aiGenerating || !aiPrompt.trim()} 
                          className={`mt-2 w-full text-xs px-3 py-1.5 rounded ${(aiGenerating || !aiPrompt.trim()) ? 'bg-gray-300' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                        >
                          {aiGenerating ? 'Generating...' : 'Generate Outline'}
                        </button>
                      </div>
                    </div>
                  )}
                  <ul className="space-y-2 text-sm">
                    {modules.length === 0 && (
                      <li className="text-xs text-gray-500">No modules yet. Start by adding one.</li>
                    )}
                    {modules.map((m, i) => (
                      <li key={m.id} className="border rounded-lg" draggable onDragStart={() => onDragStart(i)} onDragOver={onDragOver} onDrop={() => onDrop(i)}>
                        <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${selected.type==='module' && selected.moduleId===m.id ? 'bg-indigo-50' : 'bg-white'}`}
                             onClick={() => setSelected({ type: 'module', moduleId: m.id })}>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              value={m.title}
                              onChange={e => renameModule(m.id, e.target.value)}
                              className="flex-1 rounded border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            />
                            {m.reused && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800" title={`Reused module${m.usageCount ? ` • used ${m.usageCount} times` : ''}`}>Reused</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(ev) => { ev.stopPropagation(); moveModule(m.id, -1); }} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50" title="Move up">↑</button>
                            <button onClick={(ev) => { ev.stopPropagation(); moveModule(m.id, 1); }} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50" title="Move down">↓</button>
                            <button onClick={(ev) => { ev.stopPropagation(); removeModule(m.id); }} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50">Remove</button>
                          </div>
                        </div>
                        <div className="p-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">Lessons</div>
                            <button onClick={() => addLesson(m.id)} className="text-xs px-2 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-900">Add lesson</button>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {m.lessons.map((l, lessonIdx) => (
                              <li key={l.id} 
                                  className={`flex items-center justify-between px-2 py-1 rounded ${selected.type==='lesson' && selected.lessonId===l.id ? 'bg-indigo-50' : 'bg-white'}`}
                                  draggable 
                                  onDragStart={() => onLessonDragStart(m.id, lessonIdx)} 
                                  onDragOver={onLessonDragOver} 
                                  onDrop={() => onLessonDrop(m.id, lessonIdx)}
                                  onClick={() => setSelected({ type: 'lesson', moduleId: m.id, lessonId: l.id })}>
                                <input
                                  value={l.title}
                                  onChange={e => updateLesson(m.id, l.id, e.target.value)}
                                  className="mr-2 flex-1 rounded border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                />
                                <div className="flex items-center gap-1">
                                  <button onClick={(ev) => { ev.stopPropagation(); moveLesson(m.id, l.id, -1); }} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-gray-50" title="Move up">↑</button>
                                  <button onClick={(ev) => { ev.stopPropagation(); moveLesson(m.id, l.id, 1); }} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-gray-50" title="Move down">↓</button>
                                  <button onClick={(ev) => { ev.stopPropagation(); removeLesson(m.id, l.id); }} className="text-[11px] px-2 py-0.5 rounded border bg-white hover:bg-gray-50">Remove</button>
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
                <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-6">
                  {selected.type === 'course' && (
                    <div className="text-sm text-gray-600">Select a module or lesson from the outline to edit its content. Start by adding a module.</div>
                  )}
                  {selected.type === 'module' && (
                    <div>
                      <div className="text-lg font-semibold">Module content</div>
                      <div className="mt-2 text-sm text-gray-500">Add lessons to this module in the sidebar. Rich module-level content editor — TODO.</div>
                    </div>
                  )}
                  {selected.type === 'lesson' && (() => {
                    const foundModule = modules.find(m => m.id === selected.moduleId);
                    const lesson = foundModule?.lessons.find(l => l.id === selected.lessonId);
                    return (
                      <div className="space-y-4">
                        <div className="text-lg font-semibold">Lesson editor</div>
                        
                        {/* Video Section */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="text-sm font-medium text-gray-700">Video Content</div>
                          
                          {/* Video Upload */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Upload Video</label>
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
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                              />
                            </div>
                            {videoUploading && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Uploading video...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* OR Divider */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="text-xs text-gray-500 font-medium">OR</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                          </div>
                          
                          {/* Video URL */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Video URL (HLS/MP4)</label>
                            <input 
                              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                              placeholder="https://..." 
                              value={lesson?.contentUrl || ''} 
                              onChange={e => lesson && updateLessonContentUrl(selected.moduleId!, selected.lessonId!, e.target.value)}
                              disabled={videoUploading}
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter a direct video URL or upload a video file above</p>
                          </div>
                          
                          {/* Video Preview */}
                          {lesson?.contentUrl && (
                            <div className="mt-3">
                              <div className="text-xs text-gray-600 mb-2">Video Preview</div>
                              <video 
                                src={lesson.contentUrl} 
                                controls 
                                className="w-full rounded-lg border border-gray-300 max-h-64"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </div>
                        
                        {/* Lesson Content */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Lesson content (Markdown)</label>
                          <textarea 
                            rows={10} 
                            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                            placeholder="Write lesson content..."
                            value={lesson?.content || ''}
                            onChange={e => lesson && updateLessonContent(selected.moduleId!, selected.lessonId!, e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Estimated duration (min)</label>
                            <input type="number" className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="10" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Has quiz?</label>
                            <select className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"><option>No</option><option>Yes</option></select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Visibility</label>
                            <select className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"><option>Draft</option><option>Published</option></select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button onClick={() => setPreview(p => !p)} className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition-colors">{preview ? 'Close preview' : 'Preview'}</button>
                  <button onClick={onSave} disabled={saving} className={`px-5 py-2.5 rounded-lg text-white shadow-sm transition-colors ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{saving ? 'Saving…' : 'Save Course'}</button>
                  <button onClick={onSubmitForReview} disabled={saving || isNew} className={`px-5 py-2.5 rounded-lg text-white shadow-sm transition-colors ${(saving || isNew) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>Submit for Review</button>
                </div>

                {preview && (
                  <div className="mt-4 bg-white/70 backdrop-blur rounded-xl border shadow-sm p-6">
                    <div className="text-sm font-semibold mb-2">Preview</div>
                    <div className="prose max-w-none">
                      <h1 className="text-xl font-bold">{title || 'Untitled course'}</h1>
                      <p className="text-gray-600">{description || 'No description yet.'}</p>
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
            <div className="relative bg-white rounded-xl shadow-xl border w-[90vw] max-w-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Browse module library</div>
                <button onClick={() => setLibraryOpen(false)} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50">Close</button>
              </div>
              <div className="mt-3 flex gap-2">
                <input value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Search modules..."
                       className="flex-1 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                <button onClick={() => loadLibraryModules(librarySearch)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Search</button>
              </div>
              <div className="mt-4 max-h-80 overflow-auto border rounded-lg divide-y">
                {libraryLoading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
                {!libraryLoading && libraryItems.length === 0 && <div className="p-4 text-sm text-gray-500">No modules found.</div>}
                {!libraryLoading && libraryItems.map((m) => (
                  <div key={m.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{m.title}</div>
                      <div className="text-xs text-gray-500">{m.visibility || 'private'}{typeof m.usageCount === 'number' ? ` • used ${m.usageCount}x` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => addLibraryModule(m)} className="text-xs px-2 py-1 rounded bg-gray-800 text-white hover:bg-gray-900">Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-xl shadow-xl border max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">Course Saved Successfully!</h3>
              <p className="text-sm text-center text-gray-600">Your course has been saved and all changes are now stored.</p>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowErrorModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl border max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">Failed to Save Course</h3>
              <p className="text-sm text-center text-gray-600 mb-4">{errorMessage}</p>
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowErrorModal(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
