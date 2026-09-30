import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getAuthHeaders } from '@/lib/auth';

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
  not_started: 'bg-stone/10 text-stone',
  in_progress: 'bg-ochre-100 text-ochre-600',
  completed: 'bg-forest-100 text-forest-700',
  awarded: 'bg-ochre-400 text-ink-950',
  expired: 'bg-terracotta-100 text-terracotta-600',
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
        headers: getAuthHeaders(),
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
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-terracotta-100 border border-terracotta-400/40 rounded-md p-4">
        <p className="text-terracotta-700">{error}</p>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <AcademicCapIcon className="h-8 w-8 text-forest-600" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">No certifications yet</h3>
        <p className="text-stone mb-6">
          Start your learning journey by enrolling in a certification pathway.
        </p>
        <Link
          href="/courses?tab=certifications"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
        >
          Explore certification pathways
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold text-charcoal">Certification progress</h2>
        <Link
          href="/courses?tab=certifications"
          className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
        >
          Browse all pathways →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => {
          const StatusIcon = statusIcons[cert.status];
          const statusColor = statusColors[cert.status];
          const statusLabel = statusLabels[cert.status];

          return (
            <div
              key={cert.id}
              className="bg-paper border border-border/60 rounded-md overflow-hidden hover:border-forest-400 transition-colors"
            >
              {/* Status Badge */}
              <div className={`px-4 py-2.5 ${statusColor} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{statusLabel}</span>
                </div>
                <span className="text-xs font-semibold">Level {cert.pathway.level}</span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-serif text-lg font-semibold text-charcoal mb-1">
                  {cert.pathway.levelTitle}
                </h3>
                <p className="text-sm text-stone mb-4">{cert.pathway.name}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-stone mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-charcoal">{cert.progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-forest-100 rounded-full h-2">
                    <div
                      className="bg-forest-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cert.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Course Stats */}
                <div className="flex justify-between text-sm mb-5">
                  <div>
                    <p className="text-xs text-stone mb-0.5">Courses completed</p>
                    <p className="text-2xl font-serif font-semibold text-charcoal">
                      {cert.coursesCompleted}
                      <span className="text-base text-stone font-normal">/{cert.coursesRequired}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone mb-0.5">Remaining</p>
                    <p className="text-2xl font-serif font-semibold text-charcoal">
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
                    className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                  >
                    <TrophyIcon className="inline h-4 w-4 mr-2 -mt-0.5" />
                    View certificate
                  </a>
                )}

                {cert.status === 'in_progress' && (
                  <Link
                    href={`/courses?pathway=${cert.pathway.id}`}
                    className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                  >
                    Continue learning
                  </Link>
                )}

                {cert.status === 'completed' && !cert.certificateUrl && (
                  <div className="bg-forest-100 border border-forest-400/40 rounded-md p-3 text-center">
                    <p className="text-sm text-forest-700 font-medium">
                      Certificate being processed
                    </p>
                  </div>
                )}
              </div>

              {/* Certificate Number */}
              {cert.certificateNumber && (
                <div className="px-5 py-3 bg-cream border-t border-border/60">
                  <p className="text-xs text-pewter">Certificate no.</p>
                  <p className="text-sm font-mono font-medium text-charcoal">
                    {cert.certificateNumber}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Stats */}
      <div className="bg-forest-700 rounded-md p-6 lg:p-8">
        <h3 className="font-serif text-lg font-semibold text-cream mb-5">Your statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-serif font-semibold text-ochre-400">
              {certifications.length}
            </p>
            <p className="text-sm text-cream/70 mt-1">Active pathways</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-semibold text-ochre-400">
              {certifications.filter(c => c.status === 'awarded').length}
            </p>
            <p className="text-sm text-cream/70 mt-1">Awarded</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-semibold text-ochre-400">
              {certifications.filter(c => c.status === 'in_progress').length}
            </p>
            <p className="text-sm text-cream/70 mt-1">In progress</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-semibold text-ochre-400">
              {certifications.reduce((sum, cert) => sum + cert.coursesCompleted, 0)}
            </p>
            <p className="text-sm text-cream/70 mt-1">Courses completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
