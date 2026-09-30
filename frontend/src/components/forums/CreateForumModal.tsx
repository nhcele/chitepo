import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createForum, ForumType } from '@/lib/api/forums';

interface CreateForumModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const typeOptions = [
  { value: ForumType.GENERAL, label: 'General', hint: 'Open to all learners' },
  { value: ForumType.DIASPORA, label: 'Diaspora', hint: 'Region-based community' },
  { value: ForumType.COHORT, label: 'Cohort', hint: 'Requires a cohort ID' },
];

export default function CreateForumModal({ onClose, onCreated }: CreateForumModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ForumType>(ForumType.GENERAL);
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const forum = await createForum({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        region: type === ForumType.DIASPORA ? region.trim() || undefined : undefined,
        country: type === ForumType.DIASPORA ? country.trim() || undefined : undefined,
        cohortId: type === ForumType.COHORT ? cohortId.trim() || undefined : undefined,
        isPublic,
      });
      toast.success('Forum created');
      onCreated?.();
      router.push(`/forums/${forum.id}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create forum');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2.5 text-sm bg-cream border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 text-charcoal';
  const labelCls = 'block text-sm font-medium text-charcoal mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
      <div className="bg-paper rounded-md border border-border/60 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <h3 className="font-serif text-xl font-semibold text-charcoal">Start a new forum</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-pewter hover:text-charcoal hover:bg-forest-100 rounded-md transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pan-African History Study Group"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this forum about?"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Forum type</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`px-3 py-2.5 rounded-md border text-left transition-colors ${
                    type === opt.value
                      ? 'border-forest-600 bg-forest-100'
                      : 'border-border/60 hover:border-forest-400'
                  }`}
                >
                  <span className={`block text-sm font-semibold ${type === opt.value ? 'text-forest-700' : 'text-charcoal'}`}>
                    {opt.label}
                  </span>
                  <span className="block text-xs text-pewter mt-0.5">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {type === ForumType.DIASPORA && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Region</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. south_africa"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Zimbabwe"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {type === ForumType.COHORT && (
            <div>
              <label className={labelCls}>Cohort ID</label>
              <input
                type="text"
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                placeholder="Paste the cohort ID"
                className={inputCls}
              />
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-forest-600 border-border/60 rounded focus:ring-forest-600"
            />
            <span className="text-sm text-charcoal">
              Public forum — anyone can view and join
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create forum'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-charcoal border border-border/60 rounded-md hover:bg-forest-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
