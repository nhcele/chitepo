import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HandThumbUpIcon, PencilIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid';
import { ForumPost, toggleLike, updatePost, deletePost } from '@/lib/api/forums';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, timeAgo } from './PostCard';
import { UserRole } from '@mindelta/shared';

interface ReplyItemProps {
  reply: ForumPost;
  onChanged: () => void;
  onQuoteReply?: (authorName: string, content: string) => void;
}

export default function ReplyItem({ reply, onChanged, onQuoteReply }: ReplyItemProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [liked, setLiked] = useState(
    () => !!user && (reply.likes || []).some((l: any) => l.userId === user.id || l.user?.id === user.id),
  );
  const [likeCount, setLikeCount] = useState(reply.likeCount || 0);

  const isAuthor = !!user && user.id === reply.authorId;
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in to like replies');
      return;
    }
    try {
      const res = await toggleLike(reply.id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      toast.error('Could not update like');
    }
  };

  const handleSave = async () => {
    try {
      await updatePost(reply.id, { content: editContent });
      setEditing(false);
      onChanged();
    } catch {
      toast.error('Failed to update reply');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this reply?')) return;
    try {
      await deletePost(reply.id);
      onChanged();
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  return (
    <div className="bg-paper rounded-md p-5 border border-border/60">
      <div className="flex gap-3.5">
        <Avatar name={reply.author?.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-sm font-semibold text-charcoal truncate">
                {reply.author?.name || 'Unknown'}
              </span>
              <span className="text-xs text-pewter flex-shrink-0">{timeAgo(reply.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onQuoteReply && (
                <button
                  onClick={() => onQuoteReply(reply.author?.name || 'Unknown', reply.content)}
                  className="p-1.5 text-pewter hover:text-forest-600 rounded transition-colors"
                  title="Quote reply"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => {
                    setEditContent(reply.content);
                    setEditing(true);
                  }}
                  className="p-1.5 text-pewter hover:text-forest-600 rounded transition-colors"
                  title="Edit reply"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-pewter hover:text-terracotta-600 rounded transition-colors"
                  title="Delete reply"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 text-sm bg-cream border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 text-charcoal"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-xs font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal border border-border/60 rounded-md hover:bg-forest-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-charcoal whitespace-pre-wrap mb-3">{reply.content}</div>
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 transition-colors ${
                  liked ? 'text-terracotta-600 bg-terracotta-100' : 'text-pewter hover:text-terracotta-600 hover:bg-terracotta-100'
                }`}
              >
                {liked ? <HandThumbUpSolid className="w-3.5 h-3.5" /> : <HandThumbUpIcon className="w-3.5 h-3.5" />}
                {likeCount}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
