import React, { useState, useEffect } from 'react';
import {
  getSession,
  ClassroomSession,
  SessionStatus,
} from '../../lib/api/classroom-sessions';

interface PresenterModeProps {
  sessionId: string;
}

export default function PresenterMode({ sessionId }: PresenterModeProps) {
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
    const interval = setInterval(loadSession, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Session not found</div>
      </div>
    );
  }

  const isActive = session.status === SessionStatus.ACTIVE;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <div>
          <h1 className="text-4xl font-bold mb-2">{session.title}</h1>
          {session.description && (
            <p className="text-gray-400 text-lg">{session.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-2">Session Code</div>
          <div className="text-5xl font-mono font-bold bg-gray-800 px-6 py-3 rounded-lg">
            {session.sessionCode}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left: Course Info */}
        <div className="col-span-2">
          {session.course ? (
            <div className="bg-gray-800 rounded-lg p-8 mb-6">
              <div className="text-sm text-gray-400 mb-2">Current Course</div>
              <div className="text-3xl font-bold mb-4">{session.course.title}</div>
              {session.lesson && (
                <>
                  <div className="text-sm text-gray-400 mb-2">Current Lesson</div>
                  <div className="text-2xl text-blue-400">{session.lesson.title}</div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 mb-6">
              <div className="text-2xl text-gray-400">No course selected</div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}
              />
              <div>
                <div className="text-sm text-gray-400">Session Status</div>
                <div className="text-xl font-semibold">
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="col-span-1 space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Type</div>
            <div className="text-xl font-semibold">
              {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Participants</div>
            <div className="text-3xl font-bold">
              {session.participants?.length || 0} / {session.maxParticipants}
            </div>
          </div>

          {session.venue && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Venue</div>
              <div className="text-lg font-semibold">{session.venue}</div>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Scheduled Start</div>
            <div className="text-lg font-semibold">
              {new Date(session.scheduledStart).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="text-center text-gray-400">
          Students can join using the session code above at{' '}
          <span className="text-white font-mono">/classroom/join</span>
        </div>
      </div>
    </div>
  );
}

