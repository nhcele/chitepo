import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export interface CertificationProgress {
  id: string;
  pathway: {
    id: string;
    name: string;
    type: string;
    level: number;
    levelTitle: string;
  };
  status: 'not_started' | 'in_progress' | 'completed' | 'awarded' | 'expired';
  progressPercentage: number;
  coursesCompleted: number;
  coursesRequired: number;
  completedAt: Date | null;
  certificateUrl: string | null;
  certificateNumber: string | null;
}

interface CertificationProgressTrackerProps {
  userId?: string;
}

const statusIcons = {
  not_started: LockClosedIcon,
  in_progress: ClockIcon,
  completed: CheckCircleIcon,
  awarded: TrophyIcon,
  expired: ClockIcon,
};

const statusColors = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-600',
  completed: 'bg-green-100 text-green-600',
  awarded: 'bg-yellow-100 text-yellow-600',
  expired: 'bg-red-100 text-red-600',
};

const statusLabels = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  awarded: 'Awarded',
  expired: 'Expired',
};

export default function CertificationProgressTracker({ userId }: CertificationProgressTrackerProps) {
  const [certifications, setCertifications] = useState<CertificationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificationProgress();
  }, [userId]);

  const fetchCertificationProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/certifications/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certification progress');
      }

      const data = await response.json();
      setCertifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="text-center py-12">
        <AcademicCapIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications Yet</h3>
        <p className="text-gray-600 mb-6">
          Start your learning journey by enrolling in a certification pathway.
        </p>
        <a
          href="/learning?tab=certifications"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Explore Certification Pathways
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Certification Progress</h2>
        <a
          href="/learning?tab=certifications"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Browse All Pathways →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => {
          const StatusIcon = statusIcons[cert.status];
          const statusColor = statusColors[cert.status];
          const statusLabel = statusLabels[cert.status];

          return (
            <div
              key={cert.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Status Badge */}
              <div className={`px-4 py-2 ${statusColor} flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <StatusIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{statusLabel}</span>
                </div>
                <span className="text-xs font-semibold">Level {cert.pathway.level}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {cert.pathway.levelTitle}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{cert.pathway.name}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{cert.progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cert.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Course Stats */}
                <div className="flex justify-between text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Courses Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {cert.coursesCompleted}
                      <span className="text-lg text-gray-500">/{cert.coursesRequired}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Remaining</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {cert.coursesRequired - cert.coursesCompleted}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {cert.status === 'awarded' && cert.certificateUrl && (
                  <a
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors font-medium"
                  >
                    <TrophyIcon className="inline h-5 w-5 mr-2" />
                    View Certificate
                  </a>
                )}

                {cert.status === 'in_progress' && (
                  <a
                    href={`/courses?pathway=${cert.pathway.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continue Learning
                  </a>
                )}

                {cert.status === 'completed' && !cert.certificateUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                    <p className="text-sm text-green-700 font-medium">
                      Certificate being processed
                    </p>
                  </div>
                )}
              </div>

              {/* Certificate Number */}
              {cert.certificateNumber && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Certificate No.</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {cert.certificateNumber}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {certifications.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Pathways</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {certifications.filter(c => c.status === 'awarded').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Awarded</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {certifications.filter(c => c.status === 'in_progress').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {certifications.reduce((sum, cert) => sum + cert.coursesCompleted, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Courses Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

