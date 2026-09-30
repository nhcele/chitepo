import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { ForumPost } from '@/lib/api/forums';

export function timeAgo(iso?: string | Date | null) {
  if (!iso) return '';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function Avatar({ name, size = 'md' }: { name?: string | null; size?: 'sm' | 'md' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-base';
  return (
    <span
      className={`${cls} rounded-full bg-forest-100 text-forest-700 font-serif font-semibold flex items-center justify-center flex-shrink-0`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

interface PostCardProps {
  post: ForumPost;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/forums/posts/${post.id}`}
      className="block bg-paper rounded-md p-5 border border-border/60 hover:border-forest-400 transition-colors"
    >
      <div className="flex gap-4">
        <Avatar name={post.author?.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 bg-ochre-100 text-ochre-700 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                <MapPinIcon className="w-3 h-3" />
                Pinned
              </span>
            )}
            {post.isLocked && (
              <span className="inline-flex items-center gap-1 bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                <LockClosedIcon className="w-3 h-3" />
                Locked
              </span>
            )}
            <h3 className="font-serif text-lg font-semibold text-charcoal leading-snug">
              {post.title}
            </h3>
          </div>

          <p className="text-sm text-stone line-clamp-2 mb-3">{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-forest-100 text-forest-700 px-2 py-0.5 rounded text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-pewter">
            <span className="font-medium text-stone">{post.author?.name || 'Unknown'}</span>
            <span>{timeAgo(post.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5" />
              {post.viewCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              {post.replyCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <HandThumbUpIcon className="w-3.5 h-3.5" />
              {post.likeCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
