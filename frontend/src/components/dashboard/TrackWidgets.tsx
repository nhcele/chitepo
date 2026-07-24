import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { getAuthHeaders } from '@/lib/auth';

interface TrackAssignment {
  id: string;
  trackType: string;
  status: string;
  isMandatory: boolean;
  startDate: string;
  completionTargetDate: string;
  assignedReason: string;
  metadata?: Record<string, any>;
}

interface TrackWidgetsProps {
  userId: string;
}

const trackTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  general_education: { label: 'General Education', icon: '🎓', color: 'bg-blue-500' },
  government_officials: { label: 'Government Officials', icon: '🏛️', color: 'bg-purple-500' },
  diaspora_engagement: { label: 'Diaspora Engagement', icon: '✈️', color: 'bg-indigo-500' },
  youth_leadership: { label: 'Youth Leadership', icon: '🌟', color: 'bg-yellow-500' },
  womens_leadership: { label: "Women's Leadership", icon: '👩', color: 'bg-pink-500' },
  specialist: { label: 'Specialist', icon: '⭐', color: 'bg-green-500' },
};

const trackTypeRoutes: Record<string, string> = {
  general_education: '/certifications',
  government_officials: '/government-officials',
  diaspora_engagement: '/diaspora',
  youth_leadership: '/certifications',
  womens_leadership: '/certifications',
  specialist: '/certifications',
};

export default function TrackWidgets({ userId }: TrackWidgetsProps) {
  const [tracks, setTracks] = useState<TrackAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracks();
  }, [userId]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tracks/my-tracks', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow p-6 border border-blue-200"
      >
        <div className="flex items-start">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Learning Tracks</h3>
            <p className="text-gray-700 mb-4">
              You haven't been assigned to any learning tracks yet. Explore our certification pathways to get started.
            </p>
            <Link
              href="/certifications"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse Certification Pathways
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Learning Tracks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track, index) => {
          const trackInfo = trackTypeLabels[track.trackType] || {
            label: track.trackType,
            icon: '📚',
            color: 'bg-gray-500',
          };
          const route = trackTypeRoutes[track.trackType] || '/certifications';

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4"
              style={{
                borderLeftColor: trackInfo.color.replace('bg-', ''),
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`${trackInfo.color} w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl mr-3`}>
                      {trackInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{trackInfo.label}</h3>
                      {track.isMandatory && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                          Mandatory
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {track.completionTargetDate && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Target: {new Date(track.completionTargetDate).toLocaleDateString()}</span>
                  </div>
                )}

                {track.assignedReason && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{track.assignedReason}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    track.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {track.status === 'active' ? 'Active' : track.status}
                  </span>
                  <Link
                    href={route}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Track
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

