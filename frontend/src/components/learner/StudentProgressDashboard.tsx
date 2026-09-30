import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChartBarIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  TrophyIcon,
  BookOpenIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { listMyEnrollments } from '@/lib/api/enrollments';
import { recommendationsApi, CourseRecommendation } from '@/lib/api/recommendations';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface EnrollmentProgress {
  id: string;
  courseId: string;
  progressPercent: number;
  enrolledAt: Date;
  completedAt?: Date;
  lastLessonSeenAt?: Date;
  course?: {
    id: string;
    title: string;
    instructor?: {
      name: string;
    };
  };
}

export default function StudentProgressDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentProgress[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, recommendationsData] = await Promise.all([
        listMyEnrollments(),
        recommendationsApi.getPersonalized(5).catch(() => []),
      ]);
      setEnrollments(enrollmentsData as any);
      setRecommendations(recommendationsData);
    } catch (error: any) {
      toast.error('Failed to load progress data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const completedCourses = enrollments.filter((e) => e.completedAt);
  const inProgressCourses = enrollments.filter((e) => !e.completedAt);
  const totalProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total courses', value: enrollments.length, icon: BookOpenIcon },
          { label: 'Completed', value: completedCourses.length, icon: CheckCircleIcon },
          { label: 'Avg progress', value: `${Math.round(totalProgress)}%`, icon: ChartBarIcon },
          { label: 'In progress', value: inProgressCourses.length, icon: TrophyIcon },
        ].map((stat) => (
          <div key={stat.label} className="bg-paper border border-border/60 rounded-md p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-forest-100 rounded-md">
                <stat.icon className="h-5 w-5 text-forest-600" />
              </div>
              <div>
                <p className="text-xs text-stone">{stat.label}</p>
                <p className="text-2xl font-serif font-semibold text-charcoal">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Courses Progress */}
        <div className="bg-paper border border-border/60 rounded-md overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="font-serif text-xl font-semibold text-charcoal">My courses</h2>
          </div>
          <div className="p-6 space-y-5">
            {enrollments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-stone mb-4">No enrolled courses yet</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                >
                  Browse courses
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border-b border-border/60 last:border-0 pb-5 last:pb-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/courses/${enrollment.courseId}/learn`}
                        className="font-semibold text-charcoal hover:text-forest-600 transition-colors"
                      >
                        {(enrollment.course as any)?.title || 'Course'}
                      </Link>
                      <p className="text-sm text-stone mt-0.5">
                        {(enrollment.course as any)?.instructor?.name || 'Instructor'}
                      </p>
                    </div>
                    {enrollment.completedAt && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-forest-100 text-forest-700 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-stone mb-1.5">
                      <span>Progress</span>
                      <span className="font-semibold text-charcoal">{Math.round(enrollment.progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-forest-100 rounded-full h-2">
                      <div
                        className="bg-forest-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {enrollment.lastLessonSeenAt && (
                    <p className="text-xs text-pewter mt-2">
                      Last accessed: {new Date(enrollment.lastLessonSeenAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-paper border border-border/60 rounded-md overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="font-serif text-xl font-semibold text-charcoal">Recommended for you</h2>
            <p className="text-sm text-stone mt-0.5">Based on your progress and performance</p>
          </div>
          <div className="p-6 space-y-4">
            {recommendations.length === 0 ? (
              <p className="text-stone text-center py-10">No recommendations available</p>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.courseId} className="border border-border/60 rounded-md p-4 hover:border-forest-400 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal">{rec.title}</h3>
                      <p className="text-sm text-stone mt-1 line-clamp-2">{rec.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 bg-forest-100 text-forest-700 rounded">
                          {rec.difficulty}
                        </span>
                        <span className="text-xs text-stone">
                          {Math.round(rec.estimatedDuration)} min
                        </span>
                        <span className="text-xs text-ochre-600 font-semibold">
                          {Math.round(rec.matchScore)}% match
                        </span>
                      </div>
                      <p className="text-xs text-stone mt-2 italic">{rec.reason}</p>
                    </div>
                  </div>
                  <Link
                    href={`/courses/${rec.courseId}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                  >
                    View course
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
