import React, { useEffect, useState } from 'react';
import { adminGetApprovalQueue, adminApproveCourse, adminRejectCourse } from '@/lib/api/admin';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';

type QueueItem = {
  id: string;
  title?: string;
  status?: string;
  updatedAt?: string;
  instructor?: { id: string; name?: string; email?: string };
};

export default function AdminApprovalQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetApprovalQueue();
      setItems(res.items as any);
    } catch (e: any) {
      setError(e?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await adminApproveCourse(id);
    await load();
    setToast('Course approved');
    setTimeout(() => setToast(null), 2000);
  };
  const beginReject = (id: string) => {
    setRejectId(id);
    setRejectComment('');
  };
  const cancelReject = () => {
    setRejectId(null);
    setRejectComment('');
  };
  const confirmReject = async () => {
    if (!rejectId) return;
    await adminRejectCourse(rejectId, rejectComment || undefined);
    await load();
    setToast('Course rejected');
    setTimeout(() => setToast(null), 2000);
    cancelReject();
  };

  return (
    <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-forest-50 via-white to-terracotta-50 pointer-events-none" />
          <div className="relative px-6 pt-8 pb-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-forest-600 to-terracotta-600 bg-clip-text text-transparent">
                Course Approval Queue
              </h1>
              <p className="mt-2 text-sm text-stone">Review and approve or reject submitted courses.</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto space-y-4">
            {toast && <div className="text-forest-700 text-sm">{toast}</div>}
            {error && <div className="text-sm text-terracotta-600">{error}</div>}
            <div className="bg-white/70 backdrop-blur rounded-md border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-paper text-left">
                      <th className="p-3">Title</th>
                      <th className="p-3">Instructor</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Updated</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="p-4" colSpan={5}>Loading…</td></tr>
                    ) : items.length === 0 ? (
                      <tr><td className="p-4" colSpan={5}>No items in queue</td></tr>
                    ) : (
                      items.map((c: any) => (
                        <tr key={c.id} className="border-t align-top">
                          <td className="p-3">
                            <div className="font-medium">{c.title || '(Untitled course)'}</div>
                            <div className="text-xs text-stone">{c.id}</div>
                          </td>
                          <td className="p-3">
                            <div>{c.instructor?.name || '-'}</div>
                            <div className="text-xs text-stone">{c.instructor?.email || ''}</div>
                          </td>
                          <td className="p-3">{c.status || 'REVIEW'}</td>
                          <td className="p-3">{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '-'}</td>
                          <td className="p-3 min-w-[220px]">
                            {rejectId === c.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={rejectComment}
                                  onChange={e => setRejectComment(e.target.value)}
                                  rows={3}
                                  placeholder="Rejection comment (optional)"
                                  className="w-full rounded-md border-border/60 focus:border-forest-500 focus:ring-forest-500"
                                />
                                <div className="flex gap-2">
                                  <button onClick={confirmReject} className="px-3 py-1.5 rounded-md bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-sm">Reject</button>
                                  <button onClick={cancelReject} className="px-3 py-1.5 rounded-md border bg-white hover:bg-paper shadow-sm">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => approve(c.id)} className="px-3 py-1.5 rounded-md bg-forest-600 hover:bg-forest-700 text-white shadow-sm">Approve</button>
                                <button onClick={() => beginReject(c.id)} className="px-3 py-1.5 rounded-md bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-sm">Reject</button>
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
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
}
