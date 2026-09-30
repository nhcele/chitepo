import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PostComposerProps {
  heading: string;
  submitLabel: string;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  showTitle?: boolean;
  contentRows?: number;
  onSubmit: (data: { title: string; content: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
}

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-cream border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 text-charcoal';

export default function PostComposer({
  heading,
  submitLabel,
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  showTitle = true,
  contentRows = 6,
  onSubmit,
  onCancel,
}: PostComposerProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || (showTitle && !title.trim())) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), tags });
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-paper rounded-md p-6 border border-border/60">
      <h3 className="font-serif text-lg font-semibold text-charcoal mb-4">{heading}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {showTitle && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your discussion a clear title"
              className={inputCls}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">Content *</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={contentRows}
            placeholder="Share your thoughts, question, or resource…"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">
            Tags <span className="text-pewter font-normal">(up to 5)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="e.g. history"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2.5 text-sm font-semibold text-forest-600 border border-forest-600 rounded-md hover:bg-forest-100 transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-forest-100 text-forest-700 px-2.5 py-1 rounded text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    aria-label={`Remove tag ${tag}`}
                    className="text-forest-500 hover:text-forest-700"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting || !content.trim() || (showTitle && !title.trim())}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting…' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-semibold text-charcoal border border-border/60 rounded-md hover:bg-forest-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
