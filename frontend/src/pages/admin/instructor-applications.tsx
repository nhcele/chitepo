import React, { useEffect, useMemo, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import {
  adminListInstructorApplications,
  adminApproveInstructorApplication,
  adminRejectInstructorApplication,
  type InstructorApplicationDTO,
} from '@/lib/api/admin';

export default function AdminInstructorApplications() {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [items, setItems] = useState<InstructorApplicationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListInstructorApplications(status === 'ALL' ? undefined : status);
      setItems(res.items);
    } catch (e: any) {
      setError(e?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const beginReject = (id: string) => { setRejectId(id); setRejectComment(''); };
  const cancelReject = () => { setRejectId(null); setRejectComment(''); };
  const confirmReject = async () => {
    if (!rejectId) return;
    await adminRejectInstructorApplication(rejectId, rejectComment || undefined);
    await load();
    setToast('Application rejected');
    setTimeout(() => setToast(null), 2000);
    cancelReject();
  };

  const approve = async (id: string) => {
    await adminApproveInstructorApplication(id);
    await load();
    setToast('Application approved');
    setTimeout(() => setToast(null), 2000);
  };

  const filtered = useMemo(() => items, [items]);

  return (
    <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Instructor Applications</h1>
        {toast && <div className="text-forest-600 text-sm">{toast}</div>}
        {error && <div className="text-sm text-terracotta-600">{error}</div>}

        <div className="flex gap-2">
          {(['PENDING','APPROVED','REJECTED','ALL'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded border ${status===s ? 'bg-ink-900 text-white' : ''}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="rounded border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-paper text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Bio</th>
                <th className="p-2">Video</th>
                <th className="p-2">Status</th>
                <th className="p-2">Submitted</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={7}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-3" colSpan={7}>No applications</td></tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id} className="border-t align-top">
                    <td className="p-2">{app.fullName}</td>
                    <td className="p-2">{app.email}</td>
                    <td className="p-2 max-w-xs whitespace-pre-wrap">{app.bio || '-'}</td>
                    <td className="p-2">
                      {app.sampleVideoUrl ? <a className="text-forest-600" href={app.sampleVideoUrl} target="_blank" rel="noreferrer">View</a> : '-'}
                    </td>
                    <td className="p-2">{app.status}</td>
                    <td className="p-2">{app.createdAt ? new Date(app.createdAt).toLocaleString() : '-'}</td>
                    <td className="p-2">
                      {rejectId === app.id ? (
                        <div className="space-y-2">
                          <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={3} className="w-full border rounded p-2" placeholder="Reviewer comment (optional)" />
                          <div className="flex gap-2">
                            <button onClick={confirmReject} className="px-3 py-1 rounded bg-terracotta-600 text-white">Reject</button>
                            <button onClick={cancelReject} className="px-3 py-1 rounded border">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => approve(app.id)} disabled={app.status !== 'PENDING'} className="px-3 py-1 rounded bg-forest-600 text-white disabled:opacity-50">Approve</button>
                          <button onClick={() => beginReject(app.id)} disabled={app.status !== 'PENDING'} className="px-3 py-1 rounded bg-terracotta-600 text-white disabled:opacity-50">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
}
