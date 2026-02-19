import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  getForum,
  getPosts,
  createPost,
  toggleLike,
  addMember,
  Forum,
  ForumPost,
} from '../../lib/api/forums';
import { useAuth } from '../../contexts/AuthContext';

interface ForumViewProps {
  forumId: string;
}

export default function ForumView({ forumId }: ForumViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: [] as string[] });

  useEffect(() => {
    loadData();
  }, [forumId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [forumData, postsData] = await Promise.all([
        getForum(forumId),
        getPosts(forumId, { parentId: null }),
      ]);
      setForum(forumData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Join forum if not already a member
      try {
        await addMember(forumId, {});
      } catch (error) {
        // Already a member, continue
      }

      await createPost(forumId, newPost);
      setNewPost({ title: '', content: '', tags: [] });
      setShowCreatePost(false);
      loadData();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      await toggleLike(postId);
      loadData();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading forum...</div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Forum not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Forum Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{forum.title}</h1>
            {forum.description && (
              <p className="text-gray-600">{forum.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Members</div>
            <div className="text-2xl font-bold text-gray-900">{forum.memberCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{forum.postCount} posts</span>
          {forum.lastActivityAt && (
            <span>Last activity: {new Date(forum.lastActivityAt).toLocaleString()}</span>
          )}
        </div>

        {user && (
          <div className="mt-4">
            <button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showCreatePost ? 'Cancel' : '+ New Post'}
            </button>
          </div>
        )}
      </div>

      {/* Create Post Form */}
      {showCreatePost && user && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
          <form onSubmit={handleCreatePost}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {post.isPinned && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Pinned
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span>By {post.author?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>{post.viewCount} views</span>
                    <span>•</span>
                    <span>{post.replyCount} replies</span>
                  </div>
                </div>
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition"
                >
                  <span>❤️</span>
                  <span>{post.likeCount}</span>
                </button>
              </div>

              <div className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Link
                  href={`/forums/posts/${post.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Discussion ({post.replyCount} replies)
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

