import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import AppLayout from '@/components/layouts/AppLayout';
import RoleGuard from '@/components/RoleGuard';
import {
  archiveQuestionBankItem,
  importQuestionBankItemToQuiz,
  listLearningObjectives,
  listQuestionBankItems,
  upsertLearningObjective,
  upsertQuestionBankItem,
} from '@/lib/api/assessments';
import { LearningObjective, QuestionBankItem, QuestionType, UserRole } from '@mindelta/shared';
import { ArchiveBoxIcon, ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

const emptyItem = {
  objectiveId: '',
  questionType: QuestionType.MULTIPLE_CHOICE,
  questionText: '',
  options: 'Option A\nOption B',
  correctAnswer: '0',
  explanation: '',
  points: '1',
  difficulty: '',
  tags: '',
};

export default function InstructorQuestionBankPage() {
  const [courseId, setCourseId] = useState('');
  const [quizId, setQuizId] = useState('');
  const [objectiveDraft, setObjectiveDraft] = useState({ code: '', title: '', description: '' });
  const [itemDraft, setItemDraft] = useState(emptyItem);
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const objectiveById = useMemo(
    () => new Map(objectives.map((objective) => [objective.id, objective])),
    [objectives],
  );

  const loadBank = async () => {
    if (!courseId.trim()) {
      setError('Enter a course ID to load its question bank.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextObjectives, nextItems] = await Promise.all([
        listLearningObjectives(courseId.trim()),
        listQuestionBankItems({
          courseId: courseId.trim(),
          objectiveId: selectedObjectiveId || undefined,
          search: search.trim() || undefined,
        }),
      ]);
      setObjectives(nextObjectives);
      setItems(nextItems);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load question bank');
    } finally {
      setLoading(false);
    }
  };

  const saveObjective = async () => {
    if (!courseId.trim() || !objectiveDraft.title.trim()) {
      setError('Course ID and objective title are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertLearningObjective({
        courseId: courseId.trim(),
        code: objectiveDraft.code.trim() || undefined,
        title: objectiveDraft.title.trim(),
        description: objectiveDraft.description.trim() || undefined,
      });
      setObjectiveDraft({ code: '', title: '', description: '' });
      setNotice('Objective saved');
      await loadBank();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save objective');
    } finally {
      setSaving(false);
    }
  };

  const saveItem = async () => {
    if (!courseId.trim() || !itemDraft.questionText.trim()) {
      setError('Course ID and question text are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertQuestionBankItem({
        courseId: courseId.trim(),
        objectiveId: itemDraft.objectiveId || null,
        questionType: itemDraft.questionType,
        questionText: itemDraft.questionText.trim(),
        options:
          itemDraft.questionType === QuestionType.SHORT_ANSWER
            ? null
            : itemDraft.options.split('\n').map((option) => option.trim()).filter(Boolean),
        correctAnswer: itemDraft.correctAnswer,
        explanation: itemDraft.explanation.trim() || null,
        points: Number(itemDraft.points) || 1,
        difficulty: itemDraft.difficulty.trim() || null,
        tags: itemDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      setItemDraft(emptyItem);
      setNotice('Question saved');
      await loadBank();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const archiveItem = async (item: QuestionBankItem) => {
    setError(null);
    try {
      await archiveQuestionBankItem(item.id, item.courseId);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setNotice('Question archived');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to archive question');
    }
  };

  const importItem = async (item: QuestionBankItem) => {
    if (!quizId.trim()) {
      setError('Enter a quiz ID before importing.');
      return;
    }
    setError(null);
    try {
      await importQuestionBankItemToQuiz(item.id, { quizId: quizId.trim() });
      setNotice('Question imported to quiz');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to import question');
    }
  };

  useEffect(() => {
    if (courseId.trim()) {
      loadBank();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectiveId]);

  return (
    <>
      <Head>
        <title>Question bank - Chitepo</title>
      </Head>
      <AppLayout>
        <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-terracotta-600">
                  <PlusIcon className="h-5 w-5" />
                  Assessment studio
                </div>
                <h1 className="font-serif text-3xl font-semibold text-charcoal">Question bank</h1>
                <p className="mt-2 max-w-2xl text-stone">
                  Reuse tagged assessment questions across quizzes and connect them to learning objectives.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={courseId} onChange={(event) => setCourseId(event.target.value)} placeholder="Course ID" className="min-w-[260px] rounded-md border border-border/70 px-3 py-2 text-sm" />
                <button type="button" onClick={loadBank} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-50">
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Load
                </button>
              </div>
            </div>

            {error && <div className="mb-6 rounded-md border border-terracotta-400/40 bg-terracotta-100 px-4 py-3 text-sm text-terracotta-700">{error}</div>}
            {notice && <div className="mb-6 rounded-md border border-forest-400/40 bg-forest-100 px-4 py-3 text-sm text-forest-700">{notice}</div>}

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <section className="space-y-6">
                <div className="rounded-md border border-border/60 bg-paper p-5">
                  <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Objectives</h2>
                  <div className="space-y-3">
                    <input value={objectiveDraft.code} onChange={(event) => setObjectiveDraft({ ...objectiveDraft, code: event.target.value })} placeholder="Code" className="w-full rounded-md border border-border/70 px-3 py-2 text-sm" />
                    <input value={objectiveDraft.title} onChange={(event) => setObjectiveDraft({ ...objectiveDraft, title: event.target.value })} placeholder="Objective title" className="w-full rounded-md border border-border/70 px-3 py-2 text-sm" />
                    <textarea value={objectiveDraft.description} onChange={(event) => setObjectiveDraft({ ...objectiveDraft, description: event.target.value })} placeholder="Description" rows={3} className="w-full rounded-md border border-border/70 px-3 py-2 text-sm" />
                    <button type="button" onClick={saveObjective} disabled={saving} className="w-full rounded-md bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-50">
                      Save objective
                    </button>
                  </div>
                  <div className="mt-5 space-y-2">
                    {objectives.map((objective) => (
                      <button key={objective.id} type="button" onClick={() => setSelectedObjectiveId(objective.id === selectedObjectiveId ? '' : objective.id)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selectedObjectiveId === objective.id ? 'border-forest-500 bg-forest-100 text-forest-800' : 'border-border/70 bg-white text-charcoal'}`}>
                        <span className="font-semibold">{objective.code || 'Objective'}</span>
                        <span className="block text-stone">{objective.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-border/60 bg-paper p-5">
                  <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Add question</h2>
                  <div className="space-y-3">
                    <select value={itemDraft.objectiveId} onChange={(event) => setItemDraft({ ...itemDraft, objectiveId: event.target.value })} className="w-full rounded-md border border-border/70 px-3 py-2 text-sm">
                      <option value="">No objective</option>
                      {objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.code ? `${objective.code}: ` : ''}{objective.title}</option>)}
                    </select>
                    <select value={itemDraft.questionType} onChange={(event) => setItemDraft({ ...itemDraft, questionType: event.target.value as QuestionType })} className="w-full rounded-md border border-border/70 px-3 py-2 text-sm">
                      <option value={QuestionType.MULTIPLE_CHOICE}>Multiple choice</option>
                      <option value={QuestionType.TRUE_FALSE}>True/false</option>
                      <option value={QuestionType.SHORT_ANSWER}>Short answer</option>
                    </select>
                    <textarea value={itemDraft.questionText} onChange={(event) => setItemDraft({ ...itemDraft, questionText: event.target.value })} placeholder="Question text" rows={4} className="w-full rounded-md border border-border/70 px-3 py-2 text-sm" />
                    {itemDraft.questionType !== QuestionType.SHORT_ANSWER && (
                      <textarea value={itemDraft.options} onChange={(event) => setItemDraft({ ...itemDraft, options: event.target.value })} placeholder="One option per line" rows={4} className="w-full rounded-md border border-border/70 px-3 py-2 text-sm" />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input value={itemDraft.correctAnswer} onChange={(event) => setItemDraft({ ...itemDraft, correctAnswer: event.target.value })} placeholder="Correct answer" className="rounded-md border border-border/70 px-3 py-2 text-sm" />
                      <input value={itemDraft.points} onChange={(event) => setItemDraft({ ...itemDraft, points: event.target.value })} placeholder="Points" className="rounded-md border border-border/70 px-3 py-2 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={itemDraft.difficulty} onChange={(event) => setItemDraft({ ...itemDraft, difficulty: event.target.value })} placeholder="Difficulty" className="rounded-md border border-border/70 px-3 py-2 text-sm" />
                      <input value={itemDraft.tags} onChange={(event) => setItemDraft({ ...itemDraft, tags: event.target.value })} placeholder="Tags, comma separated" className="rounded-md border border-border/70 px-3 py-2 text-sm" />
                    </div>
                    <textarea value={itemDraft.explanation} onChange={(event) => setItemDraft({ ...itemDraft, explanation: event.target.value })} placeholder="Explanation" rows={3} className="w-full rounded-md border border-border/70 px-3 py-2 text-sm" />
                    <button type="button" onClick={saveItem} disabled={saving} className="w-full rounded-md bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-50">
                      Save question
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-border/60 bg-paper p-5">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-charcoal">Reusable items</h2>
                    <p className="text-sm text-stone">{items.length} active questions</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={quizId} onChange={(event) => setQuizId(event.target.value)} placeholder="Import target quiz ID" className="rounded-md border border-border/70 px-3 py-2 text-sm" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="rounded-md border border-border/70 px-3 py-2 text-sm" />
                    <button type="button" onClick={loadBank} className="rounded-md border border-border/70 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-cream">Filter</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <article key={item.id} className="rounded-md border border-border/60 bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded bg-forest-100 px-2 py-1 font-semibold text-forest-800">{item.questionType.replace('_', ' ')}</span>
                            {item.difficulty && <span className="rounded bg-ochre-100 px-2 py-1 font-semibold text-ink-900">{item.difficulty}</span>}
                            {item.objectiveId && <span className="rounded bg-cream px-2 py-1 text-stone">{objectiveById.get(item.objectiveId)?.title || 'Tagged objective'}</span>}
                          </div>
                          <h3 className="font-semibold text-charcoal">{item.questionText}</h3>
                          {item.tags?.length ? <p className="mt-2 text-xs text-stone">{item.tags.join(', ')}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => importItem(item)} className="inline-flex items-center gap-2 rounded-md bg-forest-600 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-500">
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Import
                          </button>
                          <button type="button" onClick={() => archiveItem(item)} className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm font-semibold text-charcoal hover:bg-cream">
                            <ArchiveBoxIcon className="h-4 w-4" />
                            Archive
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!loading && items.length === 0 && <div className="rounded-md border border-dashed border-border/80 p-8 text-center text-sm text-stone">No questions found.</div>}
                </div>
              </section>
            </div>
          </main>
        </RoleGuard>
      </AppLayout>
    </>
  );
}
