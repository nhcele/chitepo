import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RoleGuard from '@/components/RoleGuard';
import { User, UserRole } from '@mindelta/shared';
import { adminListUsers } from '@/lib/api/admin';
import { listCourses } from '@/lib/api/courses';
import { Course } from '@mindelta/shared';
import {
  autoAssignRoleBasedCourses,
  getComplianceStatus,
  getRoleLearningPath,
  RoleLearningPath,
  ComplianceStatus,
} from '@/lib/api/role-learning';
import {
  CheckCircleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function OnboardingFlows() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [path, setPath] = useState<RoleLearningPath | null>(null);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadOnboarding(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListUsers();
      const courseList = await listCourses();
      const sorted = (res.items || []).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
      setUsers(sorted);
      setCourses(courseList || []);
      if (sorted.length > 0) {
        setSelectedUserId(sorted[0].id);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadOnboarding = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [pathRes, complianceRes] = await Promise.all([
        getRoleLearningPath(userId),
        getComplianceStatus(userId),
      ]);
      setPath(pathRes);
      setCompliance(complianceRes);
    } catch (e: any) {
      setError(e?.message || 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedUserId) return;
    setProcessing(true);
    setError(null);
    try {
      await autoAssignRoleBasedCourses(selectedUserId);
      await loadOnboarding(selectedUserId);
    } catch (e: any) {
      setError(e?.message || 'Failed to auto-assign courses');
    } finally {
      setProcessing(false);
    }
  };

  const requiredCourses = useMemo(() => path?.learningPath.requiredCourses || [], [path]);
  const courseMap = useMemo(() => {
    return new Map(courses.map((course) => [course.id, course]));
  }, [courses]);
  const complianceItems = useMemo(() => compliance?.complianceItems || [], [compliance]);

  return (
    <AdminLayout
      title="Onboarding Flows"
      subtitle="Role-based onboarding paths with guided checklists for new hires."
    >
      <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <div className="space-y-6">
          {error && (
            <div className="rounded-md border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="min-w-[240px] rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} {user.jobTitle ? `• ${user.jobTitle}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={loadUsers}
              className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-charcoal hover:bg-paper"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleAutoAssign}
              disabled={processing || !selectedUserId}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white ${
                processing ? 'bg-stone' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <SparklesIcon className="h-4 w-4" />
              {processing ? 'Assigning...' : 'Auto-assign required courses'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-md border border-border/60 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-stone">
                <span>Job Role</span>
                <UserGroupIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-lg font-semibold text-charcoal">
                {path?.user?.jobRole ? String(path.user.jobRole).replace('_', ' ') : 'Unassigned'}
              </div>
              <p className="text-xs text-pewter">{path?.user?.department || 'No department set'}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-stone">
                <span>Path Progress</span>
                <CheckCircleIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-bold text-charcoal">{path?.learningPath.progress ?? 0}%</div>
              <p className="text-xs text-pewter">{requiredCourses.length} required courses</p>
            </div>
            <div className="rounded-md border border-border/60 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-stone">
                <span>Compliance Status</span>
                <ClipboardDocumentListIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-lg font-semibold text-charcoal">
                {compliance?.status ? compliance.status.replace('_', ' ') : 'N/A'}
              </div>
              <p className="text-xs text-pewter">
                {compliance?.summary?.completed || 0}/{compliance?.summary?.total || 0} completed
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-stone">
                <span>Overdue Items</span>
                <ExclamationTriangleIcon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-bold text-charcoal">{compliance?.summary?.overdue || 0}</div>
              <p className="text-xs text-pewter">Due in next 30 days</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-border/60 bg-white shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <h3 className="text-lg font-semibold text-charcoal">Guided Onboarding Checklist</h3>
                <p className="text-xs text-stone">Required role-based courses auto-generated</p>
              </div>
              <div className="divide-y divide-border/60">
                {requiredCourses.length === 0 ? (
                  <div className="p-6 text-sm text-stone">
                    No required courses yet. Assign a job role to generate the onboarding path.
                  </div>
                ) : (
                  requiredCourses.map((course: any) => {
                    const resolved = courseMap.get(course.id);
                    const title = resolved?.title || course.title || course.id;
                    return (
                      <div key={course.id} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{title}</p>
                          <p className="text-xs text-stone">
                            Deadline: {course.deadlineDays ? `${course.deadlineDays} days` : 'Not set'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            course.status === 'completed'
                              ? 'bg-forest-100 text-forest-700'
                              : course.status === 'in_progress'
                                ? 'bg-ochre-100 text-ochre-700'
                                : 'bg-forest-100 text-stone'
                          }`}
                        >
                          {course.status ? course.status.replace('_', ' ') : 'not started'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-white shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <h3 className="text-lg font-semibold text-charcoal">Compliance Deadlines</h3>
                <p className="text-xs text-stone">Upcoming due dates for new hires</p>
              </div>
              <div className="divide-y divide-border/60">
                {complianceItems.length === 0 ? (
                  <div className="p-6 text-sm text-stone">
                    No compliance deadlines set for this role.
                  </div>
                ) : (
                  complianceItems.map((item) => (
                    <div key={item.courseId} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{item.courseTitle}</p>
                        <p className="text-xs text-stone">
                          Due {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.isCompleted
                            ? 'bg-forest-100 text-forest-700'
                            : item.isOverdue
                              ? 'bg-terracotta-100 text-terracotta-700'
                              : 'bg-ochre-100 text-ochre-700'
                        }`}
                      >
                        {item.isCompleted ? 'Completed' : item.isOverdue ? 'Overdue' : `${item.daysUntilDue} days`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 text-sm text-stone">
              Loading onboarding data...
            </div>
          )}
        </div>
      </RoleGuard>
    </AdminLayout>
  );
}
