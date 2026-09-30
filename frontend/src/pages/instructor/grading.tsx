import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '@/components/layouts/AppLayout';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAttemptForGrading,
  getQuizAssessmentSummary,
  gradeAttemptItem,
  listPendingGradingAttempts,
  type QuizAssessmentSummary,
} from '@/lib/api/assessments';
import {
  AssessmentAttemptView,
  AttemptItem,
  AttemptItemGradingStatus,
  UserRole,
} from '@mindelta/shared';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

type GradeDraft = Record<string, { pointsEarned: string; feedback: string }>;

function shortId(id?: string | null): string {
  if (!id) return 'Unknown';
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function formatDate(value?: Date | string | null): string {
  if (!value) return 'Not submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not submitted';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InstructorGradingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quizId, setQuizId] = useState('');
  const [queue, setQueue] = useState<AssessmentAttemptView[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<AssessmentAttemptView | null>(null);
  const [drafts, setDrafts] = useState<GradeDraft>({});
  const [loading, setLoading] = useState(false);
  const [gradingItemId, setGradingItemId] = useState<string | null>(null);
  const [summary, setSummary] = useState<QuizAssessmentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const effectiveQuizId = useMemo(() => {
    const queryQuizId = typeof router.query.quizId === 'string' ? router.query.quizId : '';
    return quizId.trim() || queryQuizId.trim();
  }, [quizId, router.query.quizId]);

  const pendingItems = selectedAttempt?.items.filter(
    (item) => item.gradingStatus === AttemptItemGradingStatus.PENDING_MANUAL,
  ) || [];
  const selectedTotalPoints = selectedAttempt?.items.reduce((sum, item) => sum + Number(item.points || 0), 0) || 0;
  const selectedEarnedPoints = selectedAttempt?.items.reduce((sum, item) => sum + Number(item.pointsEarned || 0), 0) || 0;

  const loadQueue = async () => {
    if (!isAdmin && !effectiveQuizId) {
      setQueue([]);
      setSelectedAttempt(null);
      setSummary(null);
      setError('Enter a quiz ID to load your pending grading queue.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [attempts, nextSummary] = await Promise.all([
        listPendingGradingAttempts(effectiveQuizId || undefined),
        effectiveQuizId ? getQuizAssessmentSummary(effectiveQuizId) : Promise.resolve(null),
      ]);
      setSummary(nextSummary);
      setQueue(attempts);
      const nextSelected = selectedAttemptId && attempts.some((attempt) => attempt.attempt.id === selectedAttemptId)
        ? selectedAttemptId
        : attempts[0]?.attempt.id || null;
      setSelectedAttemptId(nextSelected);
      if (nextSelected) {
        const details = await getAttemptForGrading(nextSelected);
        setSelectedAttempt(details);
        setDrafts(buildDrafts(details.items));
      } else {
        setSelectedAttempt(null);
        setDrafts({});
        if (attempts.length === 0) {
          setNotice('No pending manual grading for this quiz.');
          setTimeout(() => setNotice(null), 2500);
        }
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load grading queue');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempt = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setError(null);
    try {
      const details = await getAttemptForGrading(attemptId);
      setSelectedAttempt(details);
      setDrafts(buildDrafts(details.items));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load attempt');
    }
  };

  const submitGrade = async (item: AttemptItem) => {
    if (!selectedAttempt) return;
    const draft = drafts[item.id] || { pointsEarned: '', feedback: '' };
    const pointsEarned = Number(draft.pointsEarned);
    if (!Number.isFinite(pointsEarned)) {
      setError('Enter a valid points value before saving a grade.');
      return;
    }

    setGradingItemId(item.id);
    setError(null);
    try {
      await gradeAttemptItem(selectedAttempt.attempt.id, item.id, {
        pointsEarned,
        isCorrect: pointsEarned >= item.points,
        feedback: draft.feedback.trim() || undefined,
      });
      const refreshed = await getAttemptForGrading(selectedAttempt.attempt.id);
      setSelectedAttempt(refreshed);
      setDrafts(buildDrafts(refreshed.items));
      setNotice('Grade saved');
      setTimeout(() => setNotice(null), 2000);
      if (!refreshed.items.some((candidate) => candidate.gradingStatus === AttemptItemGradingStatus.PENDING_MANUAL)) {
        await loadQueue();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save grade');
    } finally {
      setGradingItemId(null);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    const queryQuizId = typeof router.query.quizId === 'string' ? router.query.quizId : '';
    if (queryQuizId) setQuizId(queryQuizId);
  }, [router.isReady, router.query.quizId]);

  useEffect(() => {
    if (!router.isReady) return;
    if (isAdmin || effectiveQuizId) {
      loadQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, isAdmin]);

  return (
    <>
      <Head>
        <title>Manual grading - Chitepo</title>
      </Head>
      <AppLayout>
        <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-terracotta-600 mb-3">
                  <ClipboardDocumentCheckIcon className="h-5 w-5" />
                  Assessment studio
                </div>
                <h1 className="font-serif text-3xl font-semibold text-charcoal">Manual grading</h1>
                <p className="mt-2 text-stone max-w-2xl">
                  Review written responses, award points, and finalize pending quiz attempts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={quizId}
                  onChange={(event) => setQuizId(event.target.value)}
                  placeholder={isAdmin ? 'Quiz ID filter (optional)' : 'Quiz ID'}
                  className="min-w-[280px] rounded-md border border-border/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <button
                  type="button"
                  onClick={loadQueue}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Load queue
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md border border-terracotta-400/40 bg-terracotta-100 px-4 py-3 text-sm text-terracotta-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-6 rounded-md border border-forest-400/40 bg-forest-100 px-4 py-3 text-sm text-forest-700">
                {notice}
              </div>
            )}

            {summary && (
              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                <SummaryTile label="Attempts" value={summary.totalAttempts} />
                <SummaryTile label="Pending" value={summary.pendingGradingAttempts} />
                <SummaryTile label="Finalized" value={summary.finalizedAttempts} />
                <SummaryTile label="Pass rate" value={`${summary.passRate.toFixed(0)}%`} />
                <SummaryTile label="Avg score" value={summary.averageScore == null ? '-' : `${summary.averageScore.toFixed(0)}%`} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-4">
                <div className="rounded-md border border-border/60 bg-paper">
                  <div className="border-b border-border/60 px-4 py-3">
                    <h2 className="font-semibold text-charcoal">Pending attempts</h2>
                    <p className="text-xs text-stone">
                      {queue.length} waiting for grading
                      {effectiveQuizId ? ` in quiz ${shortId(effectiveQuizId)}` : ''}
                    </p>
                  </div>
                  <div className="max-h-[640px] overflow-auto">
                    {queue.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-stone">
                        {loading ? 'Loading...' : 'No written responses are waiting for grading.'}
                      </div>
                    ) : (
                      queue.map((attempt) => (
                        <button
                          key={attempt.attempt.id}
                          type="button"
                          onClick={() => loadAttempt(attempt.attempt.id)}
                          className={`block w-full border-b border-border/40 px-4 py-3 text-left hover:bg-forest-100 ${
                            selectedAttemptId === attempt.attempt.id ? 'bg-forest-100' : ''
                          }`}
                        >
                          <div className="text-sm font-semibold text-charcoal">Attempt {attempt.attempt.attemptNumber}</div>
                          <div className="mt-1 text-xs text-stone">Quiz: {shortId(attempt.attempt.quizId)}</div>
                          <div className="mt-1 text-xs text-stone">Learner: {shortId(attempt.attempt.userId)}</div>
                          <div className="mt-1 text-xs text-stone">Submitted: {formatDate(attempt.attempt.submittedAt || attempt.attempt.completedAt)}</div>
                          <div className="mt-2 inline-flex rounded-full bg-ochre-100 px-2 py-1 text-xs font-medium text-ochre-700">
                            {attempt.items.filter((item) => item.gradingStatus === AttemptItemGradingStatus.PENDING_MANUAL).length} pending
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="lg:col-span-8">
                {!selectedAttempt ? (
                  <div className="rounded-md border border-border/60 bg-paper px-6 py-12 text-center text-stone">
                    Select an attempt to grade.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border border-border/60 bg-paper px-5 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-serif text-xl font-semibold text-charcoal">Attempt {selectedAttempt.attempt.attemptNumber}</h2>
                          <p className="text-sm text-stone">Learner {shortId(selectedAttempt.attempt.userId)}</p>
                          <p className="text-xs text-stone">Submitted {formatDate(selectedAttempt.attempt.submittedAt || selectedAttempt.attempt.completedAt)}</p>
                        </div>
                        <div className="text-sm text-stone">
                          {pendingItems.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-forest-700">
                              <CheckCircleIcon className="h-5 w-5" />
                              Fully graded
                            </span>
                          ) : (
                            `${pendingItems.length} item${pendingItems.length === 1 ? '' : 's'} pending`
                          )}
                          <div className="mt-1 text-xs text-stone text-right">
                            {selectedEarnedPoints} / {selectedTotalPoints} pts recorded
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedAttempt.items.map((item, index) => (
                      <div key={item.id} className="rounded-md border border-border/60 bg-paper p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-stone">Question {index + 1}</div>
                            <h3 className="mt-1 font-semibold text-charcoal">{item.stem}</h3>
                          </div>
                          <span className="text-sm text-stone">{item.points} pts</span>
                        </div>

                        <div className="mt-4 rounded-md border border-border/50 bg-white px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-stone mb-1">Learner response</div>
                          <p className="whitespace-pre-wrap text-sm text-charcoal">{item.response || 'No response'}</p>
                        </div>

                        {item.gradingStatus === AttemptItemGradingStatus.PENDING_MANUAL ? (
                          <div className="mt-4 grid grid-cols-1 gap-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <label className="text-sm font-medium text-charcoal">
                                Points
                                <input
                                  type="number"
                                  min="0"
                                  max={item.points}
                                  step="0.25"
                                  value={drafts[item.id]?.pointsEarned ?? ''}
                                  onChange={(event) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        pointsEarned: event.target.value,
                                        feedback: prev[item.id]?.feedback || '',
                                      },
                                    }))
                                  }
                                  className="mt-1 w-32 rounded-md border border-border/70 px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="flex-1 text-sm font-medium text-charcoal">
                                Feedback
                                <input
                                  value={drafts[item.id]?.feedback ?? ''}
                                  onChange={(event) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        pointsEarned: prev[item.id]?.pointsEarned || '',
                                        feedback: event.target.value,
                                      },
                                    }))
                                  }
                                  className="mt-1 w-full rounded-md border border-border/70 px-3 py-2 text-sm"
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => submitGrade(item)}
                              disabled={gradingItemId === item.id}
                              className="w-fit rounded-md bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-50"
                            >
                              {gradingItemId === item.id ? 'Saving...' : 'Save grade'}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-md border border-forest-400/40 bg-forest-100 px-4 py-3 text-sm text-forest-700">
                            Graded: {Number(item.pointsEarned || 0)} / {item.points}
                            {item.explanation ? <div className="mt-1 text-forest-800">{item.explanation}</div> : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>
        </RoleGuard>
      </AppLayout>
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/60 bg-paper px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-stone">{label}</div>
      <div className="mt-1 text-xl font-semibold text-charcoal">{value}</div>
    </div>
  );
}

function buildDrafts(items: AttemptItem[]): GradeDraft {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        pointsEarned: item.pointsEarned == null ? '' : String(item.pointsEarned),
        feedback: item.explanation || '',
      },
    ]),
  );
}
