import React, { useEffect, useMemo, useRef, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import { apiClient } from '@/lib/api/client';
import Layout from '@/components/Layout';

export default function AdminExports() {
  const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  const [courseId, setCourseId] = useState('');
  const [quizId, setQuizId] = useState('');
  const [lessonId, setLessonId] = useState('');

  const usersHref = `${apiBase}/api/admin/exports/users.csv`;
  const engagementHref = useMemo(() => {
    const url = new URL(`${apiBase}/api/admin/exports/engagement.csv`);
    if (courseId) url.searchParams.set('courseId', courseId);
    return url.toString();
  }, [apiBase, courseId]);

  const quizHref = useMemo(() => {
    const url = new URL(`${apiBase}/api/admin/exports/quiz-outcomes.csv`);
    if (quizId) url.searchParams.set('quizId', quizId);
    if (!quizId && lessonId) url.searchParams.set('lessonId', lessonId);
    return url.toString();
  }, [apiBase, quizId, lessonId]);

  return (
    <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-pink-50 pointer-events-none" />
          <div className="relative px-6 pt-8 pb-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">CSV Exports</h1>
              <p className="mt-2 text-sm text-gray-500">Download on-demand or generate async CSV exports.</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-6 space-y-3">
              <div className="font-semibold">Users</div>
              <div className="flex items-center gap-3">
                <a href={usersHref} className="inline-flex px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Download users.csv</a>
                <AsyncExport type="users" label="Generate async" />
              </div>
              <div className="text-xs text-gray-500">Server-generated export with ID, name, email, role, active, createdAt.</div>
            </div>

            <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-6 space-y-3">
              <div className="font-semibold">Engagement</div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Course ID (optional)</label>
                  <input value={courseId} onChange={e=>setCourseId(e.target.value)} className="w-64 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="course UUID" />
                </div>
                <a href={engagementHref} className="inline-flex px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Download engagement.csv</a>
                <AsyncExport type="engagement" label="Generate async" params={{ courseId }} disabled={!courseId} hint="Enter Course ID or leave blank for all" />
              </div>
              <div className="text-xs text-gray-500">Includes enrollment rows with user, course, progress, completion, timestamps.</div>
            </div>

            <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-6 space-y-3">
              <div className="font-semibold">Quiz Outcomes</div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quiz ID</label>
                  <input value={quizId} onChange={e=>setQuizId(e.target.value)} className="w-64 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="quiz UUID" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Lesson ID (used if Quiz ID empty)</label>
                  <input value={lessonId} onChange={e=>setLessonId(e.target.value)} className="w-64 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="lesson UUID" />
                </div>
                <a href={quizHref} className="inline-flex px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Download quiz-outcomes.csv</a>
                <AsyncExport type="quiz-outcomes" label="Generate async" params={{ quizId, lessonId }} disabled={!quizId && !lessonId} hint="Provide Quiz ID or Lesson ID" />
              </div>
              <div className="text-xs text-gray-500">Attempts with user, quiz, score, pass, time spent, started/completed.</div>
            </div>
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
}

type ExportType = 'users' | 'engagement' | 'quiz-outcomes';

function AsyncExport({ type, label, params, disabled, hint }: { type: ExportType; label: string; params?: any; disabled?: boolean; hint?: string }) {
  const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'|null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<any>(null);

  const downloadHref = jobId ? `${apiBase}/api/admin/exports/jobs/${jobId}/download` : '#';

  useEffect(() => {
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const start = async () => {
    setError(null);
    setStatus('PENDING');
    try {
      const res = await apiClient.post<{ id: string }>(`/admin/exports/jobs`, { type, params });
      setJobId(res.id);
      // poll
      timer.current = setInterval(async () => {
        try {
          const job = await apiClient.get<{ status: any }>(`/admin/exports/jobs/${res.id}`);
          setStatus(job.status);
          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            clearInterval(timer.current);
          }
        } catch (e: any) {
          setError(e?.message || 'Polling failed');
          clearInterval(timer.current);
        }
      }, 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to create job');
      setStatus(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={start} disabled={disabled} className={`px-3 py-2 rounded ${disabled ? 'bg-gray-300 text-gray-600' : 'bg-primary-600 text-white'}`}>{label}</button>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
      {status && <span className="text-xs">Status: {status}</span>}
      {status === 'COMPLETED' && jobId && (
        <a href={downloadHref} className="text-xs underline text-primary-700">Download</a>
      )}
      {status === 'FAILED' && <span className="text-xs text-red-600">Failed. {error || ''}</span>}
    </div>
  );
}

function normalizeApiBase(raw?: string) {
  const fallback = 'http://localhost:3001';
  let base = (raw || fallback).trim();
  base = base.replace(/\/api\/?$/i, '');
  base = base.replace(/\/$/, '');
  return base;
}
