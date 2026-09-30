import React, { useState, useEffect } from 'react';
import { getForums, Forum, ForumType, ForumStatus } from '@/lib/api/forums';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon, GlobeAltIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { timeAgo } from './PostCard';

interface ForumListProps {
  filters?: {
    type?: ForumType;
    cohortId?: string;
    region?: string;
    country?: string;
  };
  search?: string;
  sort?: 'recent' | 'members' | 'posts';
  title?: string;
}

const typeBadge = (type: ForumType) =>
  ({
    [ForumType.COHORT]: 'bg-forest-100 text-forest-700',
    [ForumType.DIASPORA]: 'bg-ochre-100 text-ochre-700',
    [ForumType.GENERAL]: 'bg-stone/10 text-stone',
  })[type];

export default function ForumList({ filters, search = '', sort = 'recent', title }: ForumListProps) {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersKey = JSON.stringify(filters || {});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getForums({ ...JSON.parse(filtersKey), status: ForumStatus.ACTIVE });
        if (!cancelled) setForums(data);
      } catch (error) {
        console.error('Error loading forums:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filtersKey]);

  const filtered = forums
    .filter(
      (f) =>
        !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        (f.description || '').toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'members') return b.memberCount - a.memberCount;
      if (sort === 'posts') return b.postCount - a.postCount;
      return (
        new Date(b.lastActivityAt || b.createdAt).getTime() -
        new Date(a.lastActivityAt || a.createdAt).getTime()
      );
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h2 className="font-serif text-2xl font-semibold text-charcoal mb-6">{title}</h2>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-paper rounded-md border border-border/60">
          <ChatBubbleLeftRightIcon className="w-10 h-10 text-pewter mx-auto mb-3" />
          <p className="font-serif text-lg text-charcoal mb-1">
            {search ? 'No forums match your search' : 'No forums found'}
          </p>
          <p className="text-sm text-stone">
            {search ? 'Try a different search term.' : 'Check back later or start a new forum.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((forum) => (
            <Link
              key={forum.id}
              href={`/forums/${forum.id}`}
              className="bg-paper rounded-md p-6 border border-border/60 hover:border-forest-400 transition-colors block group"
            >
              <div className="flex justify-between items-start gap-3 mb-3">
                <h3 className="font-serif text-lg font-semibold text-charcoal line-clamp-2 group-hover:text-forest-600 transition-colors">
                  {forum.title}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${typeBadge(forum.type)}`}>
                  {forum.type}
                </span>
              </div>

              {forum.description && (
                <p className="text-stone text-sm mb-4 line-clamp-2">{forum.description}</p>
              )}

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-pewter">
                <span className="inline-flex items-center gap-1.5">
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  {forum.memberCount} members
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                  {forum.postCount} discussions
                </span>
                {forum.region && (
                  <span className="inline-flex items-center gap-1.5">
                    <GlobeAltIcon className="w-3.5 h-3.5" />
                    {forum.region}
                  </span>
                )}
              </div>

              {forum.lastActivityAt && (
                <p className="text-xs text-pewter mt-3 pt-3 border-t border-border/60">
                  Active {timeAgo(forum.lastActivityAt)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
