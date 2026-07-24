import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PostView from '@/components/forums/PostView';

export default function PostPage() {
  const router = useRouter();
  const { postId } = router.query;

  if (!postId || typeof postId !== 'string') {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Invalid post ID
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PostView postId={postId} />
    </Layout>
  );
}

