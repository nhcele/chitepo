import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ForumView from '@/components/forums/ForumView';
import { getCohortForum } from '@/lib/api/forums';

export default function CohortForumPage() {
  const router = useRouter();
  const { cohortId } = router.query;
  const [forumId, setForumId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cohortId && typeof cohortId === 'string') {
      loadForum();
    }
  }, [cohortId]);

  const loadForum = async () => {
    if (!cohortId || typeof cohortId !== 'string') return;

    setLoading(true);
    try {
      const forum = await getCohortForum(cohortId);
      setForumId(forum.id);
    } catch (error) {
      console.error('Error loading cohort forum:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <div className="text-stone">Loading forum...</div>
        </div>
      </Layout>
    );
  }

  if (!forumId) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-700 px-4 py-3 rounded-md">
            Forum not found
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

