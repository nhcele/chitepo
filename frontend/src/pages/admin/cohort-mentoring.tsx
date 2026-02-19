import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import RoleGuard from '@/components/RoleGuard';
import { User, UserRole } from '@mindelta/shared';
import { adminListUsers } from '@/lib/api/admin';
import {
  assignMentor,
  CohortEnrollment,
  CohortPacingMode,
  getCohort,
  listCohorts,
  OnboardingChecklistItem,
  TrainingCohort,
  updateCohortPacing,
  updateOnboardingChecklist,
  isMentorRole,
} from '@/lib/api/cohorts';
import {
  UsersIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

type EnrollmentFilter = 'all' | 'enrolled' | 'active' | 'completed' | 'withdrawn' | 'failed';
type ChecklistFilter = 'all' | 'not_started' | 'in_progress' | 'completed';

export default function CohortMentoring() {
  const [cohorts, setCohorts] = useState<TrainingCohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [selectedCohort, setSelectedCohort] = useState<TrainingCohort | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkMentorId, setBulkMentorId] = useState<string>('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentFilter>('all');
  const [checklistFilter, setChecklistFilter] = useState<ChecklistFilter>('all');
  const [mentorFilter, setMentorFilter] = useState<string>('all');
  const [pacingMode, setPacingMode] = useState<CohortPacingMode>('cohort_paced');
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState<string>('');
  const [pacingSaving, setPacingSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeEnrollment, setActiveEnrollment] = useState<CohortEnrollment | null>(null);
  const [checklistDraft, setChecklistDraft] = useState<OnboardingChecklistItem[]>([]);

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (selectedCohortId) {
      loadCohort(selectedCohortId);
    }
  }, [selectedCohortId]);

  useEffect(() => {
    if (!selectedCohort) return;
    setPacingMode(selectedCohort.pacingMode || 'cohort_paced');
    setWeeklyTargetMinutes(
      selectedCohort.weeklyTargetMinutes !== null && selectedCohort.weeklyTargetMinutes !== undefined
        ? String(selectedCohort.weeklyTargetMinutes)
        : ''
    );
  }, [selectedCohort]);

  const loadBase = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cohortList, usersRes] = await Promise.all([
        listCohorts(),
        adminListUsers(),
      ]);
      setCohorts(cohortList);
      setUsers(usersRes.items || []);
      if (cohortList.length > 0) {
        setSelectedCohortId(cohortList[0].id);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load cohorts');
    } finally {
      setLoading(false);
    }
  };

  const loadCohort = async (cohortId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cohort = await getCohort(cohortId);
      setSelectedCohort(cohort);
    } catch (e: any) {
      setError(e?.message || 'Failed to load cohort details');
    } finally {
      setLoading(false);
    }
  };

  const mentorOptions = useMemo(() => {
    return users
      .filter((u) => isMentorRole(u.role))
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
  }, [users]);

  const enrollments = selectedCohort?.enrollments || [];
  const pacingLabel = (mode?: CohortPacingMode) => {
    if (mode === 'self_paced') return 'Self-paced';
    if (mode === 'hybrid') return 'Hybrid';
    return 'Cohort-paced';
  };
  const trimmedWeeklyTarget = weeklyTargetMinutes.trim();
  const parsedWeeklyTarget = trimmedWeeklyTarget.length > 0 ? parseInt(trimmedWeeklyTarget, 10) : null;
  const weeklyTargetInvalid =
    trimmedWeeklyTarget.length > 0 && (Number.isNaN(parsedWeeklyTarget) || (parsedWeeklyTarget ?? 0) < 0);
  const weeklyTargetRequired = pacingMode !== 'self_paced';
  const weeklyTargetMissing = weeklyTargetRequired && trimmedWeeklyTarget.length === 0;
  const pacingSaveDisabled = pacingSaving || !selectedCohort || weeklyTargetInvalid || weeklyTargetMissing;
  const pacingHelperText = pacingMode === 'self_paced'
    ? 'Learners can move at their own pace. Weekly target is optional.'
    : pacingMode === 'hybrid'
    ? 'Mix of synchronous milestones and self-paced work. Weekly target is required.'
    : 'Learners move together on a shared cadence. Weekly target is required.';
  const pacingSummary = selectedCohort
    ? `${pacingLabel(selectedCohort.pacingMode)}${
        selectedCohort.weeklyTargetMinutes !== null && selectedCohort.weeklyTargetMinutes !== undefined
          ? ` • ${selectedCohort.weeklyTargetMinutes} min/week`
          : ''
      }`
    : 'No cohort selected';

  const summary = useMemo(() => {
    const total = enrollments.length;
    const withMentor = enrollments.filter((e) => !!e.mentorId).length;
    const noMentor = total - withMentor;
    const checklistTotals = enrollments.map((e) => {
      const list = e.onboardingChecklist || [];
      const completed = list.filter((i) => i.completed).length;
      return { total: list.length, completed };
    });
    const checklistItems = checklistTotals.reduce((sum, row) => sum + row.total, 0);
    const checklistCompleted = checklistTotals.reduce((sum, row) => sum + row.completed, 0);
    const completionRate = checklistItems ? Math.round((checklistCompleted / checklistItems) * 100) : 0;
    return { total, withMentor, noMentor, completionRate };
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const user = enrollment.user;
      const name = user?.name?.toLowerCase() || '';
      const email = user?.email?.toLowerCase() || '';
      if (term && !name.includes(term) && !email.includes(term)) return false;
      if (statusFilter !== 'all' && enrollment.status !== statusFilter) return false;
      if (mentorFilter !== 'all' && (enrollment.mentorId || '') !== mentorFilter) return false;

      const checklist = enrollment.onboardingChecklist || [];
      const completedCount = checklist.filter((i) => i.completed).length;
      if (checklistFilter === 'not_started' && checklist.length > 0) return completedCount === 0;
      if (checklistFilter === 'in_progress') {
        return checklist.length > 0 && completedCount > 0 && completedCount < checklist.length;
      }
      if (checklistFilter === 'completed') {
        return checklist.length > 0 && completedCount === checklist.length;
      }
      return true;
    });
  }, [enrollments, search, statusFilter, mentorFilter, checklistFilter]);

  const openChecklist = (enrollment: CohortEnrollment) => {
    setActiveEnrollment(enrollment);
    setChecklistDraft(enrollment.onboardingChecklist ? [...enrollment.onboardingChecklist] : []);
    setDrawerOpen(true);
  };

  const updateChecklistItem = (index: number, patch: Partial<OnboardingChecklistItem>) => {
    setChecklistDraft((prev) => {
      const next = [...prev];
      const current = next[index];
      next[index] = { ...current, ...patch };
      return next;
    });
  };

  const addChecklistItem = () => {
    setChecklistDraft((prev) => [...prev, { title: '', completed: false }]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistDraft((prev) => prev.filter((_, idx) => idx !== index));
  };

  const saveChecklist = async () => {
    if (!activeEnrollment || !selectedCohort) return;
    setSaving(true);
    setError(null);
    try {
      const cleaned = checklistDraft
        .map((item) => ({
          title: item.title.trim(),
          completed: !!item.completed,
          completedAt: item.completed ? item.completedAt || new Date().toISOString() : undefined,
        }))
        .filter((item) => item.title.length > 0);
      await updateOnboardingChecklist(selectedCohort.id, activeEnrollment.userId, cleaned);
      await loadCohort(selectedCohort.id);
      setDrawerOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to update checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleMentorChange = async (enrollment: CohortEnrollment, mentorId: string) => {
    if (!selectedCohort) return;
    setSaving(true);
    setError(null);
    try {
      await assignMentor(selectedCohort.id, enrollment.userId, mentorId);
      await loadCohort(selectedCohort.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to assign mentor');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedCohort || !bulkMentorId) return;
    setBulkProcessing(true);
    setError(null);
    try {
      const targets = filteredEnrollments.filter((e) => e.mentorId !== bulkMentorId);
      for (const enrollment of targets) {
        await assignMentor(selectedCohort.id, enrollment.userId, bulkMentorId);
      }
      await loadCohort(selectedCohort.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to bulk assign mentors');
    } finally {
      setBulkProcessing(false);
    }
  };

  const parseCsv = (text: string): Array<Record<string, string>> => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      return row;
    });
  };

  const handleCsvImport = async (file: File) => {
    if (!selectedCohort) return;
    setCsvProcessing(true);
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const emailToUser = new Map(users.map((u) => [u.email.toLowerCase(), u]));
      const enrollmentsByUser = new Map(enrollments.map((e) => [e.userId, e]));

      for (const row of rows) {
        const userId = row.userId || '';
        const mentorId = row.mentorId || '';
        const userEmail = row.userEmail?.toLowerCase() || '';
        const mentorEmail = row.mentorEmail?.toLowerCase() || '';

        const user = userId ? users.find((u) => u.id === userId) : emailToUser.get(userEmail);
        const mentor = mentorId ? users.find((u) => u.id === mentorId) : emailToUser.get(mentorEmail);
        if (!user || !mentor) continue;
        if (!isMentorRole(mentor.role)) continue;

        const enrollment = enrollmentsByUser.get(user.id);
        if (!enrollment) continue;
        if (enrollment.mentorId === mentor.id) continue;

        await assignMentor(selectedCohort.id, user.id, mentor.id);
      }

      await loadCohort(selectedCohort.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to import CSV');
    } finally {
      setCsvProcessing(false);
    }
  };

  const handlePacingSave = async () => {
    if (!selectedCohort) return;
    if (weeklyTargetInvalid || weeklyTargetMissing) return;
    setPacingSaving(true);
    setError(null);
    try {
      const parsed =
        weeklyTargetMinutes.trim().length === 0 ? null : Math.max(0, parseInt(weeklyTargetMinutes, 10));
      await updateCohortPacing(selectedCohort.id, {
        pacingMode,
        weeklyTargetMinutes: Number.isNaN(parsed as number) ? null : (parsed as number | null),
      });
      await loadCohort(selectedCohort.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to update cohort pacing');
    } finally {
      setPacingSaving(false);
    }
  };

  if (loading && !selectedCohort) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Cohort Mentoring"
      subtitle="Assign mentors, track onboarding checklists, and keep cohort communities engaged."
    >
      <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cohort Command Center</h2>
              <p className="text-sm text-gray-500">
                Keep learners connected to mentors and momentum with guided checklists.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadBase}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </button>
              {selectedCohort && (
                <Link
                  href={`/cohorts/${selectedCohort.id}/forum`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Open Cohort Forum
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Total Enrollments</span>
                <UsersIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Mentors Assigned</span>
                <UserCircleIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{summary.withMentor}</div>
              <p className="text-xs text-gray-400">{summary.noMentor} still need a mentor</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Checklist Completion</span>
                <CheckCircleIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{summary.completionRate}%</div>
              <p className="text-xs text-gray-400">Across onboarding steps</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary-600 to-indigo-600 p-4 text-white shadow-sm">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Community Pulse</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {selectedCohort ? pacingLabel(selectedCohort.pacingMode) : 'Pacing'}
                  </span>
                  <SparklesIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold">{selectedCohort?.name || 'No cohort selected'}</div>
              <p className="text-xs text-white/70">
                {selectedCohort?.meetingSchedule || 'Set a meeting cadence to keep the cohort aligned.'}
              </p>
              <p className="mt-2 text-xs text-white/70">
                {selectedCohort ? `Pacing: ${pacingSummary}` : 'Pacing: N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold text-gray-600">Select Cohort</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
                {selectedCohort && (
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p>Status: <span className="font-medium text-gray-700">{selectedCohort.status.replace('_', ' ')}</span></p>
                    <p>Dates: {new Date(selectedCohort.startDate).toLocaleDateString()} - {new Date(selectedCohort.endDate).toLocaleDateString()}</p>
                    <p>Capacity: {selectedCohort.currentParticipants}/{selectedCohort.maxParticipants}</p>
                    <p>Pacing: <span className="font-medium text-gray-700">{pacingSummary}</span></p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold text-gray-600">Cohort Pacing</label>
                <div className="mt-3 space-y-2">
                  <select
                    value={pacingMode}
                    onChange={(e) => setPacingMode(e.target.value as CohortPacingMode)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="cohort_paced">Cohort-paced</option>
                    <option value="self_paced">Self-paced</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={weeklyTargetMinutes}
                    onChange={(e) => setWeeklyTargetMinutes(e.target.value)}
                    placeholder="Weekly target minutes (optional)"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 ${
                      weeklyTargetInvalid || weeklyTargetMissing ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-400">{pacingHelperText}</p>
                  {(weeklyTargetMissing || weeklyTargetInvalid) && (
                    <p className="text-xs text-red-500">
                      {weeklyTargetInvalid
                        ? 'Enter a valid non-negative number of minutes.'
                        : 'Weekly target minutes are required for this pacing mode.'}
                    </p>
                  )}
                  <button
                    onClick={handlePacingSave}
                    disabled={pacingSaveDisabled}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white ${
                      pacingSaveDisabled ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {pacingSaving ? 'Saving...' : 'Save pacing'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {weeklyTargetRequired
                    ? 'Weekly target is required for this pacing mode.'
                    : 'Weekly target is optional. Leave blank to remove.'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold text-gray-600">Search Learners</label>
                <div className="relative mt-2">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name or email"
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as EnrollmentFilter)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="failed">Failed</option>
                  </select>
                  <select
                    value={checklistFilter}
                    onChange={(e) => setChecklistFilter(e.target.value as ChecklistFilter)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All checklist states</option>
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={mentorFilter}
                    onChange={(e) => setMentorFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All mentors</option>
                    {mentorOptions.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.name || mentor.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold text-gray-600">Bulk Mentor Assignment</label>
                <select
                  value={bulkMentorId}
                  onChange={(e) => setBulkMentorId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Select mentor</option>
                  {mentorOptions.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name || mentor.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkMentorId || bulkProcessing || filteredEnrollments.length === 0}
                  className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-white ${
                    bulkProcessing ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {bulkProcessing ? 'Assigning...' : `Assign to ${filteredEnrollments.length} learners`}
                </button>
                <p className="mt-2 text-xs text-gray-400">
                  Applies to the currently filtered list.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold text-gray-600">CSV Import</label>
                <p className="mt-2 text-xs text-gray-400">
                  Headers supported: `userEmail,mentorEmail` or `userId,mentorId`.
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:border-primary-400 hover:bg-primary-50">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {csvProcessing ? 'Importing...' : 'Upload CSV'}
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvImport(file);
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-400">
                  Rows with unknown users or mentors are skipped.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mentor Assignments</h3>
                  <p className="text-xs text-gray-500">Showing {filteredEnrollments.length} of {enrollments.length} learners</p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Onboarding checklist ready
                </span>
              </div>

              {filteredEnrollments.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No learners match the current filters.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredEnrollments.map((enrollment, index) => {
                    const checklist = enrollment.onboardingChecklist || [];
                    const completed = checklist.filter((i) => i.completed).length;
                    const percent = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;
                    return (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="px-5 py-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {enrollment.user?.name || enrollment.user?.email || 'Unknown learner'}
                            </p>
                            <p className="text-xs text-gray-500">{enrollment.user?.email}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5">{enrollment.status}</span>
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">{percent}% checklist</span>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                            <div className="min-w-[220px]">
                              <label className="text-[11px] font-semibold text-gray-500">Mentor</label>
                              <select
                                value={enrollment.mentorId || ''}
                                onChange={(e) => handleMentorChange(enrollment, e.target.value)}
                                disabled={saving}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-primary-500 focus:ring-primary-500"
                              >
                                <option value="">Unassigned</option>
                                {mentorOptions.map((mentor) => (
                                  <option key={mentor.id} value={mentor.id}>
                                    {mentor.name || mentor.email}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={() => openChecklist(enrollment)}
                              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit Checklist
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </RoleGuard>

      {drawerOpen && activeEnrollment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Onboarding checklist</p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeEnrollment.user?.name || activeEnrollment.user?.email}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {checklistDraft.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                  No onboarding steps yet. Add tasks to guide the learner through their first days.
                </div>
              )}

              {checklistDraft.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) =>
                        updateChecklistItem(index, {
                          completed: e.target.checked,
                          completedAt: e.target.checked ? new Date().toISOString() : undefined,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <input
                      value={item.title}
                      onChange={(e) => updateChecklistItem(index, { title: e.target.value })}
                      placeholder="Checklist task"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => removeChecklistItem(index)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  {item.completed && item.completedAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      Completed {new Date(item.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}

              <button
                onClick={addChecklistItem}
                className="w-full rounded-lg border border-dashed border-primary-300 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50"
              >
                Add checklist item
              </button>
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={saveChecklist}
                disabled={saving}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  saving ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
