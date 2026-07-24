import React from 'react';
import PresenterMode from '@/components/trainer/PresenterMode';
import { useRouter } from 'next/router';

export default function PresenterModePage() {
  const router = useRouter();
  const { sessionId } = router.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Invalid session ID</div>
      </div>
    );
  }

  return <PresenterMode sessionId={sessionId} />;
}

