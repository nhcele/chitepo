import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '@/components/layouts/AppLayout';
import ForumView from '@/components/forums/ForumView';

export default function ForumPage() {
  const router = useRouter();
  const { forumId } = router.query;

  return (
    <>
      <Head>
        <title>Forum — Chitepo</title>
      </Head>
      <AppLayout>
        {!forumId || typeof forumId !== 'string' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-terracotta-100 border border-terracotta-400/40 text-terracotta-700 px-4 py-3 rounded-md">
              Invalid forum ID
            </div>
          </div>
        ) : (
          <ForumView forumId={forumId} />
        )}
      </AppLayout>
    </>
  );
}
