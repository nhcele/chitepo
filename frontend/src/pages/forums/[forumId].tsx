import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ForumView from '@/components/forums/ForumView';

export default function ForumPage() {
  const router = useRouter();
  const { forumId } = router.query;

  if (!forumId || typeof forumId !== 'string') {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Invalid forum ID
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ForumView forumId={forumId} />
    </Layout>
  );
}

