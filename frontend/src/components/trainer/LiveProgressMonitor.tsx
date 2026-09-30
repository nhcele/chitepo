import React, { useState, useEffect } from 'react';
import {
  getSessionParticipants,
  getSessionStats,
  ClassroomSessionParticipant,
  SessionStats,
} from '@/lib/api/classroom-sessions';

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
      <div className="bg-white rounded-md p-6 border border-border/60">
        <div className="text-center text-stone">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-6 border border-border/60">
      <h3 className="text-lg font-semibold mb-4">Live Progress Monitor</h3>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-forest-50 p-4 rounded-md">
            <div className="text-2xl font-bold text-forest-600">{stats.totalParticipants}</div>
            <div className="text-sm text-stone">Total</div>
          </div>
          <div className="bg-terracotta-50 p-4 rounded-md">
            <div className="text-2xl font-bold text-terracotta-600">{stats.physicalParticipants}</div>
            <div className="text-sm text-stone">Physical</div>
          </div>
          <div className="bg-forest-50 p-4 rounded-md">
            <div className="text-2xl font-bold text-forest-600">{stats.remoteParticipants}</div>
            <div className="text-sm text-stone">Remote</div>
          </div>
          <div className="bg-forest-50 p-4 rounded-md">
            <div className="text-2xl font-bold text-forest-600">{stats.averageProgress.toFixed(0)}%</div>
            <div className="text-sm text-stone">Avg Progress</div>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-paper rounded-md"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-forest-600 rounded-full flex items-center justify-center text-white font-semibold">
                {participant.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-charcoal">
                  {participant.user?.name || 'Unknown User'}
                </div>
                <div className="text-sm text-stone flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      participant.isPhysical
                        ? 'bg-terracotta-100 text-terracotta-800'
                        : 'bg-forest-100 text-forest-800'
                    }`}
                  >
                    {participant.isPhysical ? 'Physical' : 'Remote'}
                  </span>
                  {participant.lastActivityAt && (
                    <span className="text-pewter">
                      Active {new Date(participant.lastActivityAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-charcoal">
                  {participant.progressPercentage.toFixed(0)}%
                </div>
                <div className="w-24 bg-forest-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-forest-600 h-2 rounded-full transition-all"
                    style={{ width: `${participant.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8 text-stone">No participants yet</div>
      )}
    </div>
  );
}

