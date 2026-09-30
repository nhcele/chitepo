import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getSessionByCode,
  joinSession,
  getSession,
  updateProgress,
  ClassroomSession,
  SessionStatus,
} from '@/lib/api/classroom-sessions';

export default function StudentSessionJoin() {
  const router = useRouter();
  const { code } = router.query;
  const [sessionCode, setSessionCode] = useState<string>((code as string) || '');
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhysical, setIsPhysical] = useState(true);

  useEffect(() => {
    if (code) {
      handleJoin();
    }
  }, [code]);

  const handleJoin = async () => {
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First verify the session exists
      const sessionData = await getSessionByCode(sessionCode.toUpperCase());
      setSession(sessionData);

      // Join the session
      await joinSession(sessionCode.toUpperCase(), isPhysical);
      setJoined(true);

      // Load full session data
      const fullSession = await getSession(sessionData.id);
      setSession(fullSession);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join session. Please check the code.');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (progress: number) => {
    if (!session) return;
    try {
      await updateProgress(session.id, progress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (joined && session) {
    return (
      <div className="min-h-screen bg-paper p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-md shadow-sm p-6 mb-6 border border-border/60">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-charcoal">{session.title}</h1>
                {session.description && (
                  <p className="text-stone mt-1">{session.description}</p>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-md ${
                  session.status === SessionStatus.ACTIVE
                    ? 'bg-forest-100 text-forest-800'
                    : 'bg-forest-100 text-charcoal'
                }`}
              >
                {session.status}
              </div>
            </div>

            {session.course && (
              <div className="bg-forest-50 p-4 rounded-md mb-4">
                <div className="text-sm text-stone mb-1">Course</div>
                <div className="font-semibold text-charcoal">{session.course.title}</div>
                {session.lesson && (
                  <div className="text-sm text-stone mt-1">
                    Current Lesson: {session.lesson.title}
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <div className="text-sm text-stone mb-2">You are connected to the session</div>
              <div className="text-lg font-semibold text-charcoal">
                {isPhysical ? '📍 Physically Present' : '🌐 Remote Participant'}
              </div>
            </div>
          </div>

          {session.course && (
            <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
              <h2 className="text-xl font-semibold mb-4">Course Content</h2>
              <a
                href={`/courses/${session.course.id}/learn`}
                className="inline-block bg-forest-600 text-white px-6 py-3 rounded-md hover:bg-forest-700 transition"
              >
                Open Course Content
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-md shadow-sm p-8 border border-border/60">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Join Classroom Session</h1>
        <p className="text-stone mb-6">Enter the session code provided by your trainer</p>

        {error && (
          <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Session Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPhysical}
                onChange={(e) => setIsPhysical(e.target.checked)}
                className="w-4 h-4"
                disabled={loading}
              />
              <span className="text-sm text-charcoal">I am physically present in the classroom</span>
            </label>
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || !sessionCode.trim()}
            className="w-full bg-forest-600 text-white px-4 py-3 rounded-md hover:bg-forest-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </div>

        {session && !joined && (
          <div className="mt-6 p-4 bg-forest-50 rounded-md">
            <div className="text-sm font-medium text-forest-900 mb-1">Session Found</div>
            <div className="text-sm text-forest-700">{session.title}</div>
            <div className="text-xs text-forest-600 mt-1">
              Scheduled: {new Date(session.scheduledStart).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

