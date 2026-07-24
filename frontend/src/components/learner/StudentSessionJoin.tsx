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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
                {session.description && (
                  <p className="text-gray-600 mt-1">{session.description}</p>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  session.status === SessionStatus.ACTIVE
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {session.status}
              </div>
            </div>

            {session.course && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-600 mb-1">Course</div>
                <div className="font-semibold text-gray-900">{session.course.title}</div>
                {session.lesson && (
                  <div className="text-sm text-gray-600 mt-1">
                    Current Lesson: {session.lesson.title}
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">You are connected to the session</div>
              <div className="text-lg font-semibold text-gray-900">
                {isPhysical ? '📍 Physically Present' : '🌐 Remote Participant'}
              </div>
            </div>
          </div>

          {session.course && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Course Content</h2>
              <a
                href={`/courses/${session.course.id}/learn`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Classroom Session</h1>
        <p className="text-gray-600 mb-6">Enter the session code provided by your trainer</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
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
              <span className="text-sm text-gray-700">I am physically present in the classroom</span>
            </label>
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || !sessionCode.trim()}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </div>

        {session && !joined && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">Session Found</div>
            <div className="text-sm text-blue-700">{session.title}</div>
            <div className="text-xs text-blue-600 mt-1">
              Scheduled: {new Date(session.scheduledStart).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

