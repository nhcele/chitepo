import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '@/components/layouts/AppLayout';
import PostView from '@/components/forums/PostView';

export default function PostPage() {
  const router = useRouter();
  const { postId } = router.query;

  return (
    <>
      <Head>
        <title>Discussion — Chitepo</title>
      </Head>
      <AppLayout>
        {!postId || typeof postId !== 'string' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-terracotta-100 border border-terracotta-400/40 text-terracotta-700 px-4 py-3 rounded-md">
              Invalid post ID
            </div>
          </div>
        ) : (
          <PostView postId={postId} />
        )}
      </AppLayout>
    </>
  );
}
