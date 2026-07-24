import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getSession,
  startSession,
  pauseSession,
  endSession,
  updateCurrentLesson,
  ClassroomSession,
  SessionStatus,
} from '@/lib/api/classroom-sessions';
import LiveProgressMonitor from './LiveProgressMonitor';
import { useRouter } from 'next/router';

interface ClassroomSessionViewProps {
  sessionId: string;
}

export default function ClassroomSessionView({ sessionId }: ClassroomSessionViewProps) {
  const router = useRouter();
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSession();
    const interval = setInterval(loadSession, 3000); // Refresh every 3 seconds
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

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const updated = await startSession(sessionId);
      setSession(updated);
    } catch (error) {
      console.error('Error starting session:', error);
      toast('Failed to start session');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const updated = await pauseSession(sessionId);
      setSession(updated);
    } catch (error) {
      console.error('Error pausing session:', error);
      toast('Failed to pause session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;
    setActionLoading(true);
    try {
      const updated = await endSession(sessionId);
      setSession(updated);
      router.push('/trainer/classroom');
    } catch (error) {
      console.error('Error ending session:', error);
      toast('Failed to end session');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Session not found</div>
      </div>
    );
  }

  const isActive = session.status === SessionStatus.ACTIVE;
  const canStart = session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.PAUSED;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            {session.description && (
              <p className="text-gray-600 mt-1">{session.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Session Code</div>
            <div className="text-2xl font-mono font-bold bg-gray-100 px-4 py-2 rounded-lg">
              {session.sessionCode}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {session.status}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Type</div>
            <div className="text-sm font-medium text-gray-900">
              {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Venue</div>
            <div className="text-sm font-medium text-gray-900">{session.venue || 'N/A'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canStart && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              Start Session
            </button>
          )}
          {isActive && (
            <>
              <button
                onClick={handlePause}
                disabled={actionLoading}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
              >
                Pause
              </button>
              <button
                onClick={handleEnd}
                disabled={actionLoading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                End Session
              </button>
            </>
          )}
          <a
            href={`/classroom/join?code=${session.sessionCode}`}
            target="_blank"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Open Presenter Mode
          </a>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {session.course && (
            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold mb-4">Course Content</h3>
              <div className="text-gray-900 font-medium">{session.course.title}</div>
              {session.lesson && (
                <div className="mt-2 text-gray-600">Current Lesson: {session.lesson.title}</div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Session Controls</h3>
            <div className="text-gray-600">
              Use the controls above to start, pause, or end the session. Students can join using the
              session code displayed at the top.
            </div>
          </div>
        </div>

        {/* Progress Monitor Sidebar */}
        <div className="lg:col-span-1">
          <LiveProgressMonitor sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}

