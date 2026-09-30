import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  getPost,
  createPost,
  toggleLike,
  updatePost,
  deletePost,
  pinPost,
  lockPost,
  getPosts,
  ForumPost,
} from '@/lib/api/forums';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  LinkIcon,
  LockClosedIcon,
  MapPinIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid';
import { Avatar, timeAgo } from './PostCard';
import ReplyItem from './ReplyItem';
import PostComposer from './PostComposer';
import { UserRole } from '@mindelta/shared';

interface PostViewProps {
  postId: string;
}

export default function PostView({ postId }: PostViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [related, setRelated] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const replyBoxRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const loadPost = async () => {
    setLoading(true);
    try {
      const postData = await getPost(postId);
      setPost(postData);
      setReplies(postData.replies || []);
      setLikeCount(postData.likeCount || 0);
      setLiked(
        !!user && (postData.likes || []).some((l: any) => l.userId === user.id || l.user?.id === user.id),
      );
      // Related discussions in the same forum
      try {
        const others = await getPosts(postData.forumId, { parentId: null, limit: 6 });
        setRelated(others.filter((p) => p.id !== postId).slice(0, 4));
      } catch {
        setRelated([]);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      await createPost(post.forumId, {
        title: `Re: ${post.title}`,
        content: replyContent.trim(),
        parentId: post.id,
      });
      setReplyContent('');
      loadPost();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in to like discussions');
      return;
    }
    try {
      const res = await toggleLike(post!.id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      toast.error('Could not update like');
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('Delete this discussion? This cannot be undone.')) return;
    try {
      await deletePost(post.id);
      router.push(`/forums/${post.forumId}`);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handlePin = async () => {
    if (!post) return;
    try {
      const updated = await pinPost(post.id, !post.isPinned);
      setPost({ ...post, isPinned: updated.isPinned });
      toast.success(updated.isPinned ? 'Pinned to top' : 'Unpinned');
    } catch (error: any) {
      toast.error(error?.message || 'Not allowed');
    }
  };

  const handleLock = async () => {
    if (!post) return;
    try {
      const updated = await lockPost(post.id, !post.isLocked);
      setPost({ ...post, isLocked: updated.isLocked });
      toast.success(updated.isLocked ? 'Discussion locked' : 'Discussion unlocked');
    } catch (error: any) {
      toast.error(error?.message || 'Not allowed');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleQuoteReply = (authorName: string, content: string) => {
    const quote = content.length > 160 ? `${content.slice(0, 160)}…` : content;
    setReplyContent((prev) => `${prev}@${authorName} wrote: "${quote}"\n\n`);
    replyBoxRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-paper rounded-md p-12 border border-border/60 text-center">
          <p className="font-serif text-xl text-charcoal mb-2">Discussion not found</p>
          <Link href="/forums" className="text-sm font-semibold text-forest-600 hover:text-forest-500">
            Back to forums
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = !!user && user.id === post.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;
  const canReply = !!user && !post.isLocked;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/forums" className="font-semibold text-stone hover:text-forest-600 transition-colors">
          Forums
        </Link>
        <span className="text-pewter">/</span>
        <Link
          href={`/forums/${post.forumId}`}
          className="font-semibold text-stone hover:text-forest-600 transition-colors truncate max-w-[200px]"
        >
          {post.forum?.title || 'Forum'}
        </Link>
        <span className="text-pewter">/</span>
        <span className="text-charcoal truncate max-w-[240px]">{post.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2">
          {/* Post */}
          <article className="bg-paper rounded-md border border-border/60 overflow-hidden">
            <div className="p-6 lg:p-8">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {post.isPinned && (
                  <span className="inline-flex items-center gap-1 bg-ochre-100 text-ochre-700 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                    <MapPinIcon className="w-3 h-3" />
                    Pinned
                  </span>
                )}
                {post.isLocked && (
                  <span className="inline-flex items-center gap-1 bg-terracotta-100 text-terracotta-700 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                    <LockClosedIcon className="w-3 h-3" />
                    Locked
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal leading-tight mb-4">
                {post.title}
              </h1>

              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border/60">
                <Avatar name={post.author?.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal">{post.author?.name || 'Unknown'}</p>
                  <p className="text-xs text-pewter">
                    {timeAgo(post.createdAt)}
                    {post.updatedAt && post.updatedAt !== post.createdAt && ' (edited)'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-pewter flex-shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    {post.viewCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    {post.replyCount}
                  </span>
                </div>
              </div>

              {editing ? (
                <PostComposer
                  heading="Edit discussion"
                  submitLabel="Save changes"
                  initialTitle={post.title}
                  initialContent={post.content}
                  initialTags={post.tags || []}
                  onSubmit={async (data) => {
                    await updatePost(post.id, data);
                    setEditing(false);
                    toast.success('Updated');
                    loadPost();
                  }}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="text-charcoal whitespace-pre-wrap leading-relaxed">{post.content}</div>
              )}

              {post.tags && post.tags.length > 0 && !editing && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-forest-100 text-forest-700 px-2.5 py-1 rounded text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 py-3 border-t border-border/60 bg-cream/60 flex-wrap">
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  liked ? 'text-terracotta-600 bg-terracotta-100' : 'text-stone hover:text-terracotta-600 hover:bg-terracotta-100'
                }`}
              >
                {liked ? <HandThumbUpSolid className="w-4 h-4" /> : <HandThumbUpIcon className="w-4 h-4" />}
                {likeCount}
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone hover:text-forest-600 hover:bg-forest-100 rounded-md transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Share
              </button>
              <span className="flex-1" />
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone hover:text-forest-600 hover:bg-forest-100 rounded-md transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone hover:text-terracotta-600 hover:bg-terracotta-100 rounded-md transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
              {isAdmin && (
                <>
                  <button
                    onClick={handlePin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone hover:text-ochre-600 hover:bg-ochre-100 rounded-md transition-colors"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    {post.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={handleLock}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone hover:text-terracotta-600 hover:bg-terracotta-100 rounded-md transition-colors"
                  >
                    <LockClosedIcon className="w-4 h-4" />
                    {post.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                </>
              )}
            </div>
          </article>

          {/* Replies */}
          <section className="mt-8">
            <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">
              Replies ({replies.length})
            </h2>

            {post.isLocked && (
              <div className="mb-4 p-3 bg-terracotta-100 border border-terracotta-400/40 text-terracotta-700 text-sm rounded-md">
                This discussion is locked — no new replies can be posted.
              </div>
            )}

            {user && canReply && (
              <form onSubmit={handleReply} className="mb-6">
                <textarea
                  ref={replyBoxRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  required
                  placeholder="Write your reply…"
                  className="w-full px-3 py-2.5 text-sm bg-paper border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 text-charcoal mb-3"
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors disabled:opacity-50"
                >
                  {submittingReply ? 'Posting…' : 'Post reply'}
                </button>
              </form>
            )}

            {!user && (
              <div className="mb-6 p-4 bg-paper border border-border/60 rounded-md text-sm text-stone">
                <Link href="/auth/login" className="font-semibold text-forest-600 hover:text-forest-500">
                  Sign in
                </Link>{' '}
                to join this discussion.
              </div>
            )}

            <div className="space-y-3">
              {replies.length === 0 ? (
                <div className="bg-paper rounded-md p-8 border border-border/60 text-center text-sm text-stone">
                  No replies yet — start the conversation.
                </div>
              ) : (
                replies.map((reply) => (
                  <ReplyItem key={reply.id} reply={reply} onChanged={loadPost} onQuoteReply={canReply ? handleQuoteReply : undefined} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Author card */}
          <div className="bg-paper rounded-md p-5 border border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-pewter mb-4">Author</h3>
            <div className="flex items-center gap-3">
              <Avatar name={post.author?.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">{post.author?.name || 'Unknown'}</p>
                <p className="text-xs text-pewter">Community member</p>
              </div>
            </div>
          </div>

          {/* Forum card */}
          {post.forum && (
            <div className="bg-forest-700 rounded-md p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ochre-400 mb-2">Forum</h3>
              <p className="font-serif text-lg font-semibold text-cream mb-3">
                {post.forum.title}
              </p>
              <Link
                href={`/forums/${post.forumId}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ochre-400 hover:text-ochre-300 transition-colors"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                Back to forum
              </Link>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="bg-paper rounded-md p-5 border border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-pewter mb-4">
                More in this forum
              </h3>
              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/forums/posts/${r.id}`} className="group block">
                      <p className="text-sm font-medium text-charcoal group-hover:text-forest-600 transition-colors line-clamp-2">
                        {r.title}
                      </p>
                      <p className="text-xs text-pewter mt-0.5">
                        {r.replyCount} replies · {r.likeCount} likes
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
