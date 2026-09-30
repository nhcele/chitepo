import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getTrainerSessions,
  createSession,
  ClassroomSession,
  SessionStatus,
  SessionType,
  CreateSessionDto,
} from '@/lib/api/classroom-sessions';
import { listCourses } from '@/lib/api/courses';
import { Course } from '@mindelta/shared';

interface TrainerDashboardProps {
  trainerId: string;
}

export default function TrainerDashboard({ trainerId }: TrainerDashboardProps) {
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  const [newSession, setNewSession] = useState<CreateSessionDto>({
    title: '',
    description: '',
    type: SessionType.PHYSICAL,
    scheduledStart: new Date().toISOString().slice(0, 16),
    maxParticipants: 50,
    allowRemoteJoin: false,
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, coursesData] = await Promise.all([
        getTrainerSessions({
          upcoming: filter === 'upcoming',
          status: filter === 'active' ? SessionStatus.ACTIVE : undefined,
        }),
        listCourses(),
      ]);

      let filteredSessions = sessionsData;
      if (filter === 'completed') {
        filteredSessions = sessionsData.filter((s) => s.status === SessionStatus.COMPLETED);
      } else if (filter === 'all') {
        filteredSessions = sessionsData;
      }

      setSessions(filteredSessions);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await createSession(newSession);
      setSessions([session, ...sessions]);
      setShowCreateModal(false);
      setNewSession({
        title: '',
        description: '',
        type: SessionType.PHYSICAL,
        scheduledStart: new Date().toISOString().slice(0, 16),
        maxParticipants: 50,
        allowRemoteJoin: false,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast('Failed to create session. Please try again.');
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.ACTIVE:
        return 'bg-forest-100 text-forest-800';
      case SessionStatus.SCHEDULED:
        return 'bg-forest-100 text-forest-800';
      case SessionStatus.PAUSED:
        return 'bg-ochre-100 text-ochre-800';
      case SessionStatus.COMPLETED:
        return 'bg-forest-100 text-charcoal';
      case SessionStatus.CANCELLED:
        return 'bg-terracotta-100 text-terracotta-800';
      default:
        return 'bg-forest-100 text-charcoal';
    }
  };

  const getTypeBadge = (type: SessionType) => {
    const badges = {
      [SessionType.PHYSICAL]: { label: 'Physical', color: 'bg-terracotta-100 text-terracotta-800' },
      [SessionType.HYBRID]: { label: 'Hybrid', color: 'bg-forest-100 text-forest-800' },
      [SessionType.VIRTUAL]: { label: 'Virtual', color: 'bg-forest-100 text-forest-800' },
    };
    return badges[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-stone">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Classroom Sessions</h1>
          <p className="text-stone mt-1">Manage your physical and hybrid training sessions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-forest-600 text-white px-4 py-2 rounded-md hover:bg-forest-700 transition"
        >
          + Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'upcoming', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md transition ${
              filter === f
                ? 'bg-forest-600 text-white'
                : 'bg-forest-100 text-charcoal hover:bg-forest-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-md shadow-sm p-6 border border-border/60 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-charcoal">{session.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>

            {session.description && (
              <p className="text-stone text-sm mb-3 line-clamp-2">{session.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-stone">
                <span className="font-medium mr-2">Code:</span>
                <span className="font-mono bg-forest-100 px-2 py-1 rounded">{session.sessionCode}</span>
              </div>

              <div className="flex items-center text-sm text-stone">
                <span className="font-medium mr-2">Type:</span>
                <span className={`px-2 py-1 rounded text-xs ${getTypeBadge(session.type).color}`}>
                  {getTypeBadge(session.type).label}
                </span>
              </div>

              <div className="flex items-center text-sm text-stone">
                <span className="font-medium mr-2">Start:</span>
                <span>{new Date(session.scheduledStart).toLocaleString()}</span>
              </div>

              {session.venue && (
                <div className="flex items-center text-sm text-stone">
                  <span className="font-medium mr-2">Venue:</span>
                  <span>{session.venue}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-stone">
                <span className="font-medium mr-2">Participants:</span>
                <span>
                  {session.participants?.length || 0} / {session.maxParticipants}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`/trainer/classroom/${session.id}`}
                className="flex-1 bg-forest-600 text-white text-center px-4 py-2 rounded-md hover:bg-forest-700 transition text-sm"
              >
                {session.status === SessionStatus.ACTIVE ? 'View Live' : 'Manage'}
              </a>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-md border border-border/60">
          <p className="text-stone">No sessions found. Create your first session to get started.</p>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Session</h2>
            <form onSubmit={handleCreateSession}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Description
                  </label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Session Type *
                    </label>
                    <select
                      required
                      value={newSession.type}
                      onChange={(e) => setNewSession({ ...newSession, type: e.target.value as SessionType })}
                      className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    >
                      <option value={SessionType.PHYSICAL}>Physical</option>
                      <option value={SessionType.HYBRID}>Hybrid</option>
                      <option value={SessionType.VIRTUAL}>Virtual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newSession.maxParticipants}
                      onChange={(e) =>
                        setNewSession({ ...newSession, maxParticipants: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={newSession.scheduledStart}
                      onChange={(e) => setNewSession({ ...newSession, scheduledStart: e.target.value })}
                      className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newSession.scheduledEnd || ''}
                      onChange={(e) => setNewSession({ ...newSession, scheduledEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    value={newSession.venue || ''}
                    onChange={(e) => setNewSession({ ...newSession, venue: e.target.value })}
                    placeholder="e.g., Training Center Room 101"
                    className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Course (Optional)
                  </label>
                  <select
                    value={newSession.courseId || ''}
                    onChange={(e) => setNewSession({ ...newSession, courseId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowRemote"
                    checked={newSession.allowRemoteJoin}
                    onChange={(e) => setNewSession({ ...newSession, allowRemoteJoin: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="allowRemote" className="text-sm text-charcoal">
                    Allow remote students to join
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-forest-600 text-white px-4 py-2 rounded-md hover:bg-forest-700 transition"
                >
                  Create Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-forest-100 text-charcoal px-4 py-2 rounded-md hover:bg-stone transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

