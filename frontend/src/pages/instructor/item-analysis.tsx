import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import AppLayout from '@/components/layouts/AppLayout';
import RoleGuard from '@/components/RoleGuard';
import {
  getQuizAssessmentSummary,
  getQuizItemAnalysis,
  type QuizAssessmentSummary,
} from '@/lib/api/assessments';
import { QuizItemAnalysis, UserRole } from '@mindelta/shared';
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';

function pct(value: number | null | undefined): string {
  return value == null ? '-' : `${value.toFixed(0)}%`;
}

export default function InstructorItemAnalysisPage() {
  const [quizId, setQuizId] = useState('');
  const [analysis, setAnalysis] = useState<QuizItemAnalysis | null>(null);
  const [summary, setSummary] = useState<QuizAssessmentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weakestItems = useMemo(
    () =>
      (analysis?.items || [])
        .filter((item) => item.attempts > 0)
        .slice()
        .sort((a, b) => a.correctRate - b.correctRate)
        .slice(0, 3),
    [analysis],
  );

  const loadAnalysis = async () => {
    if (!quizId.trim()) {
      setError('Enter a quiz ID to load item analysis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, nextAnalysis] = await Promise.all([
        getQuizAssessmentSummary(quizId.trim()),
        getQuizItemAnalysis(quizId.trim()),
      ]);
      setSummary(nextSummary);
      setAnalysis(nextAnalysis);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load item analysis');
      setSummary(null);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Item analysis - Chitepo</title>
      </Head>
      <AppLayout>
        <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-terracotta-600">
                  <ChartBarIcon className="h-5 w-5" />
                  Assessment studio
                </div>
                <h1 className="font-serif text-3xl font-semibold text-charcoal">Item analysis</h1>
                <p className="mt-2 max-w-2xl text-stone">
                  Find weak questions, objective gaps, and score patterns from completed quiz attempts.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={quizId}
                  onChange={(event) => setQuizId(event.target.value)}
                  placeholder="Quiz ID"
                  className="min-w-[280px] rounded-md border border-border/70 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={loadAnalysis}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Load
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md border border-terracotta-400/40 bg-terracotta-100 px-4 py-3 text-sm text-terracotta-700">
                {error}
              </div>
            )}

            {summary && (
              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                <Metric label="Attempts" value={summary.totalAttempts} />
                <Metric label="Finalized" value={summary.finalizedAttempts} />
                <Metric label="Pass rate" value={pct(summary.passRate)} />
                <Metric label="Avg score" value={pct(summary.averageScore)} />
                <Metric label="Pending" value={summary.pendingGradingAttempts} />
              </div>
            )}

            {weakestItems.length > 0 && (
              <section className="mb-6 rounded-md border border-border/60 bg-paper p-5">
                <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Lowest performing items</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {weakestItems.map((item) => (
                    <div key={item.questionId} className="rounded-md border border-border/60 bg-white p-4">
                      <div className="mb-2 text-sm font-semibold text-terracotta-700">{pct(item.correctRate)} correct</div>
                      <p className="line-clamp-3 text-sm text-charcoal">{item.stem}</p>
                      <p className="mt-3 text-xs text-stone">{item.responses} responses from {item.attempts} attempts</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {analysis && (
              <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <section className="rounded-md border border-border/60 bg-paper p-5">
                  <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Objectives</h2>
                  <div className="space-y-3">
                    {analysis.objectives.map((objective) => (
                      <div key={objective.objectiveId || 'unassigned'} className="rounded-md border border-border/60 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-charcoal">{objective.objectiveTitle}</h3>
                            <p className="mt-1 text-xs text-stone">{objective.questionCount} questions</p>
                          </div>
                          <span className="rounded bg-forest-100 px-2 py-1 text-sm font-semibold text-forest-800">
                            {pct(objective.correctRate)}
                          </span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream">
                          <div className="h-full bg-forest-600" style={{ width: `${Math.min(100, objective.correctRate)}%` }} />
                        </div>
                      </div>
                    ))}
                    {analysis.objectives.length === 0 && <p className="text-sm text-stone">No objective data yet.</p>}
                  </div>
                </section>

                <section className="overflow-hidden rounded-md border border-border/60 bg-paper">
                  <div className="border-b border-border/60 p-5">
                    <h2 className="font-serif text-xl font-semibold text-charcoal">Question performance</h2>
                    <p className="mt-1 text-sm text-stone">{analysis.items.length} analyzed items</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border/60 text-sm">
                      <thead className="bg-cream">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-stone">
                          <th className="px-4 py-3">Question</th>
                          <th className="px-4 py-3">Objective</th>
                          <th className="px-4 py-3">Attempts</th>
                          <th className="px-4 py-3">Responses</th>
                          <th className="px-4 py-3">Correct</th>
                          <th className="px-4 py-3">Avg points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 bg-white">
                        {analysis.items.map((item) => (
                          <tr key={item.questionId}>
                            <td className="max-w-md px-4 py-3">
                              <div className="font-medium text-charcoal">{item.stem}</div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone">
                                <span>{item.type.replace('_', ' ')}</span>
                                {item.difficulty && <span>{item.difficulty}</span>}
                                {item.tags?.length ? <span>{item.tags.join(', ')}</span> : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-stone">{item.objectiveTitle || 'Unassigned'}</td>
                            <td className="px-4 py-3 text-charcoal">{item.attempts}</td>
                            <td className="px-4 py-3 text-charcoal">{item.responses}</td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-forest-100 px-2 py-1 font-semibold text-forest-800">{pct(item.correctRate)}</span>
                            </td>
                            <td className="px-4 py-3 text-charcoal">{item.averagePoints.toFixed(1)} / {item.maxPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </main>
        </RoleGuard>
      </AppLayout>
    </>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/60 bg-paper p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-stone">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-charcoal">{value}</div>
    </div>
  );
}
