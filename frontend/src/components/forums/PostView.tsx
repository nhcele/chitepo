import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getPost,
  createPost,
  toggleLike,
  updatePost,
  deletePost,
  ForumPost,
} from '../../lib/api/forums';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

interface PostViewProps {
  postId: string;
}

export default function PostView({ postId }: PostViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newReply, setNewReply] = useState({ content: '' });
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const postData = await getPost(postId);
      setPost(postData);
      setReplies(postData.replies || []);
      setEditContent(postData.content);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post) return;

    try {
      await createPost(post.forumId, {
        title: `Re: ${post.title}`,
        content: newReply.content,
        parentId: post.id,
      });
      setNewReply({ content: '' });
      setShowReplyForm(false);
      loadPost();
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    try {
      await updatePost(post.id, { content: editContent });
      setEditing(false);
      loadPost();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(post.id);
      router.push(`/forums/${post.forumId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      await toggleLike(post.id);
      loadPost();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Post not found</div>
      </div>
    );
  }

  const canEdit = user && (user.id === post.authorId || user.role === 'admin');

  return (
    <div className="p-6">
      {/* Back Button */}
      <Link
        href={`/forums/${post.forumId}`}
        className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
      >
        ← Back to Forum
      </Link>

      {/* Main Post */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
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
            onClick={handleLike}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <span>❤️</span>
            <span className="font-medium">{post.likeCount}</span>
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</div>

            {canEdit && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Replies Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Replies ({replies.length})
        </h2>

        {user && !showReplyForm && (
          <button
            onClick={() => setShowReplyForm(true)}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Reply
          </button>
        )}

        {showReplyForm && user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
            <form onSubmit={handleReply}>
              <textarea
                required
                value={newReply.content}
                onChange={(e) => setNewReply({ content: e.target.value })}
                rows={4}
                placeholder="Write your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Post Reply
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {replies.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 text-center">
              <p className="text-gray-500">No replies yet. Be the first to reply!</p>
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 ml-8"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {reply.author?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(reply.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      try {
                        await toggleLike(reply.id);
                        loadPost();
                      } catch (error) {
                        console.error('Error toggling like:', error);
                      }
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition"
                  >
                    <span>❤️</span>
                    <span>{reply.likeCount}</span>
                  </button>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap">{reply.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

