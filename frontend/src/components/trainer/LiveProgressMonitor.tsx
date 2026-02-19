import React, { useState, useEffect } from 'react';
import {
  getSessionParticipants,
  getSessionStats,
  ClassroomSessionParticipant,
  SessionStats,
} from '../../lib/api/classroom-sessions';

interface LiveProgressMonitorProps {
  sessionId: string;
}

export default function LiveProgressMonitor({ sessionId }: LiveProgressMonitorProps) {
  const [participants, setParticipants] = useState<ClassroomSessionParticipant[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadData = async () => {
    try {
      const [participantsData, statsData] = await Promise.all([
        getSessionParticipants(sessionId),
        getSessionStats(sessionId),
      ]);
      setParticipants(participantsData.filter((p) => !p.leftAt));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="text-center text-gray-500">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Live Progress Monitor</h3>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalParticipants}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.physicalParticipants}</div>
            <div className="text-sm text-gray-600">Physical</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{stats.remoteParticipants}</div>
            <div className="text-sm text-gray-600">Remote</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.averageProgress.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {participant.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {participant.user?.name || 'Unknown User'}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      participant.isPhysical
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {participant.isPhysical ? 'Physical' : 'Remote'}
                  </span>
                  {participant.lastActivityAt && (
                    <span className="text-gray-400">
                      Active {new Date(participant.lastActivityAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {participant.progressPercentage.toFixed(0)}%
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${participant.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8 text-gray-500">No participants yet</div>
      )}
    </div>
  );
}

