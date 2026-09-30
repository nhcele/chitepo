import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  getForum,
  getPosts,
  createPost,
  addMember,
  removeMember,
  checkMembership,
  Forum,
  ForumPost,
  ForumType,
  ForumStatus,
} from '@/lib/api/forums';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import PostCard, { Avatar, timeAgo } from './PostCard';
import PostComposer from './PostComposer';
import { UserRole } from '@mindelta/shared';

interface ForumViewProps {
  forumId: string;
}

type Tab = 'discussions' | 'members' | 'about';
type SortKey = 'new' | 'top' | 'active';

const typeBadge = (type: ForumType) =>
  ({
    [ForumType.COHORT]: 'bg-forest-100 text-forest-700',
    [ForumType.DIASPORA]: 'bg-ochre-100 text-ochre-700',
    [ForumType.GENERAL]: 'bg-stone/10 text-stone',
  })[type];

export default function ForumView({ forumId }: ForumViewProps) {
  const { user } = useAuth();
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('discussions');
  const [sort, setSort] = useState<SortKey>('new');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const loadForum = useCallback(async () => {
    try {
      const data = await getForum(forumId);
      setForum(data);
      if (user) {
        const memberIds = (data.members || []).map((m) => m.userId || m.user?.id);
        setIsMember(memberIds.includes(user.id));
      }
    } catch (error) {
      console.error('Error loading forum:', error);
    }
  }, [forumId, user]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const data = await getPosts(forumId, {
        parentId: null,
        q: debouncedSearch || undefined,
        sort,
        tag: activeTag || undefined,
      });
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [forumId, debouncedSearch, sort, activeTag]);

  useEffect(() => {
    setLoading(true);
    loadForum().finally(() => setLoading(false));
  }, [loadForum]);

  // Debounce search input before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (forum) loadPosts();
  }, [forum, loadPosts]);

  const handleToggleMembership = async () => {
    if (!user) {
      toast.error('Sign in to join this forum');
      return;
    }
    setJoining(true);
    try {
      if (isMember) {
        await removeMember(forumId, user.id);
        setIsMember(false);
        toast.success('Left forum');
      } else {
        await addMember(forumId, {});
        setIsMember(true);
        toast.success('Joined forum');
      }
      loadForum();
    } catch (error: any) {
      toast.error(error?.message || 'Could not update membership');
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePost = async (data: { title: string; content: string; tags: string[] }) => {
    if (!user) return;
    try {
      await addMember(forumId, {});
      setIsMember(true);
    } catch {
      // Already a member — continue
    }
    await createPost(forumId, data);
    setShowComposer(false);
    toast.success('Discussion posted');
    loadPosts();
    loadForum();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-paper rounded-md p-12 border border-border/60 text-center">
          <p className="font-serif text-xl text-charcoal mb-2">Forum not found</p>
          <Link href="/forums" className="text-sm font-semibold text-forest-600 hover:text-forest-500">
            Back to all forums
          </Link>
        </div>
      </div>
    );
  }

  const isLocked = forum.status === ForumStatus.LOCKED;
  const members = forum.members || [];
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <Link
        href="/forums"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone hover:text-forest-600 transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        All forums
      </Link>

      {/* Forum header */}
      <div className="bg-paper rounded-md p-6 lg:p-8 mb-6 border border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${typeBadge(forum.type)}`}>
                {forum.type}
              </span>
              {!forum.isPublic && (
                <span className="inline-flex items-center gap-1 bg-stone/10 text-stone px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                  <LockClosedIcon className="w-3 h-3" />
                  Private
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 bg-terracotta-100 text-terracotta-700 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                  <LockClosedIcon className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal mb-2">
              {forum.title}
            </h1>
            {forum.description && <p className="text-stone max-w-3xl">{forum.description}</p>}

            <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-sm text-pewter mt-4">
              <span className="inline-flex items-center gap-1.5">
                <UserGroupIcon className="w-4 h-4" />
                {forum.memberCount} members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                {forum.postCount} discussions
              </span>
              {forum.lastActivityAt && <span>Active {timeAgo(forum.lastActivityAt)}</span>}
              {forum.region && (
                <span className="inline-flex items-center gap-1.5">
                  <GlobeAltIcon className="w-4 h-4" />
                  {forum.region}
                  {forum.country ? `, ${forum.country}` : ''}
                </span>
              )}
              {forum.cohort && <span>Cohort: {forum.cohort.name}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {user ? (
              <button
                onClick={handleToggleMembership}
                disabled={joining}
                className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors ${
                  isMember
                    ? 'text-charcoal border border-border/60 hover:bg-forest-100'
                    : 'text-white bg-forest-600 hover:bg-forest-500'
                }`}
              >
                {joining ? '…' : isMember ? 'Leave forum' : 'Join forum'}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors text-center"
              >
                Sign in to join
              </Link>
            )}
            {user && !isLocked && (
              <button
                onClick={() => setShowComposer(!showComposer)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-forest-600 border border-forest-600 rounded-md hover:bg-forest-100 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New discussion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border/60">
        {(
          [
            { key: 'discussions', label: `Discussions (${forum.postCount})` },
            { key: 'members', label: `Members (${forum.memberCount})` },
            { key: 'about', label: 'About' },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-forest-600 text-forest-600'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'discussions' && (
        <>
          {showComposer && user && (
            <div className="mb-6">
              <PostComposer
                heading="Start a new discussion"
                submitLabel="Post discussion"
                onSubmit={handleCreatePost}
                onCancel={() => setShowComposer(false)}
              />
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pewter" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discussions…"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-paper border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 text-charcoal"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-3 py-2.5 text-sm bg-paper border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 text-charcoal"
              aria-label="Sort discussions"
            >
              <option value="new">Newest first</option>
              <option value="active">Most active</option>
              <option value="top">Most liked</option>
            </select>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveTag('')}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                  !activeTag ? 'bg-forest-600 text-white border-forest-600' : 'border-border/60 text-stone hover:border-forest-400'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                    activeTag === tag ? 'bg-forest-600 text-white border-forest-600' : 'border-border/60 text-stone hover:border-forest-400'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Posts */}
          {postsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-paper rounded-md p-12 border border-border/60 text-center">
              <ChatBubbleLeftRightIcon className="w-10 h-10 text-pewter mx-auto mb-3" />
              <p className="font-serif text-lg text-charcoal mb-1">
                {search || activeTag ? 'No discussions match your filters' : 'No discussions yet'}
              </p>
              <p className="text-sm text-stone">
                {search || activeTag
                  ? 'Try a different search or clear the tag filter.'
                  : user
                  ? 'Start the first discussion in this forum.'
                  : 'Sign in to start the conversation.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'members' && (
        <div className="bg-paper rounded-md border border-border/60">
          {members.length === 0 ? (
            <div className="p-12 text-center text-stone">No members yet.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-4">
                  <Avatar name={m.user?.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">
                      {m.user?.name || 'Member'}
                    </p>
                    <p className="text-xs text-pewter">Joined {timeAgo(m.joinedAt)}</p>
                  </div>
                  {m.role !== 'member' && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        m.role === 'admin' ? 'bg-terracotta-100 text-terracotta-700' : 'bg-ochre-100 text-ochre-700'
                      }`}
                    >
                      {m.role}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="bg-paper rounded-md p-6 lg:p-8 border border-border/60 max-w-3xl">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-pewter mb-1">Type</dt>
              <dd className="text-charcoal capitalize">{forum.type}</dd>
            </div>
            {forum.description && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-pewter mb-1">Description</dt>
                <dd className="text-charcoal">{forum.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-pewter mb-1">Visibility</dt>
              <dd className="text-charcoal">{forum.isPublic ? 'Public — anyone can view and join' : 'Private — members only'}</dd>
            </div>
            {forum.creator && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-pewter mb-1">Created by</dt>
                <dd className="text-charcoal">{forum.creator.name || forum.creator.email}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-pewter mb-1">Created</dt>
              <dd className="text-charcoal">{new Date(forum.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
