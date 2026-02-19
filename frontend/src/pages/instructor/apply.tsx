import React, { useState } from 'react';
import Link from 'next/link';
import { instructorApply } from '@/lib/api/instructor';
import { useRouter } from 'next/router';

export default function InstructorApply() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', bio: '', sampleVideoUrl: '', socials: '' });
  const [agreements, setAgreements] = useState({ tos: false, ownership: false, revenue: false });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await instructorApply({ ...form, agreements });
      setSubmitted(true);
      setTimeout(() => router.push('/instructor/thank-you'), 500);
    } catch (err: any) {
      setError(err?.message || 'Submission failed');
    }
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">Application Submitted</h1>
        <p className="mt-2 text-gray-700">We’ll get back to you within 3 business days.</p>
        <Link className="mt-4 inline-flex px-4 py-2 rounded bg-indigo-600 text-white" href="/instructor/thank-you">Continue</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Instructor Application</h1>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" placeholder="Full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
        <input className="w-full border rounded p-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <textarea className="w-full border rounded p-2" placeholder="Bio (≤ 500 chars)" maxLength={500} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
        <input className="w-full border rounded p-2" placeholder="Sample video link" value={form.sampleVideoUrl} onChange={e => setForm({ ...form, sampleVideoUrl: e.target.value })} />
        <input className="w-full border rounded p-2" placeholder="Social profiles" value={form.socials} onChange={e => setForm({ ...form, socials: e.target.value })} />
        <div className="space-y-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={agreements.tos} onChange={e => setAgreements({ ...agreements, tos: e.target.checked })} /> Agree to TOS</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={agreements.ownership} onChange={e => setAgreements({ ...agreements, ownership: e.target.checked })} /> Content ownership</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={agreements.revenue} onChange={e => setAgreements({ ...agreements, revenue: e.target.checked })} /> Revenue share</label>
        </div>
        <button className="px-4 py-2 rounded bg-indigo-600 text-white" type="submit">Submit</button>
      </form>
    </div>
  );
}
