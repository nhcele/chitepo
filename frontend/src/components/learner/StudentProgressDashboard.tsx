import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChartBarIcon,
  ClockIcon,
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const completedCourses = enrollments.filter((e) => e.completedAt);
  const inProgressCourses = enrollments.filter((e) => !e.completedAt);
  const totalProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalProgress)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCourses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses Progress */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
          </div>
          <div className="p-6 space-y-4">
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No enrolled courses yet</p>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/courses/${enrollment.courseId}/learn`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {(enrollment.course as any)?.title || 'Course'}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {(enrollment.course as any)?.instructor?.name || 'Instructor'}
                      </p>
                    </div>
                    {enrollment.completedAt && (
                      <span className="ml-4 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{Math.round(enrollment.progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {enrollment.lastLessonSeenAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last accessed: {new Date(enrollment.lastLessonSeenAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
            <p className="text-sm text-gray-500 mt-1">Based on your progress and performance</p>
          </div>
          <div className="p-6 space-y-4">
            {recommendations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recommendations available</p>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.courseId} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{rec.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rec.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {rec.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(rec.estimatedDuration)} min
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(rec.matchScore)}% match
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 italic">{rec.reason}</p>
                    </div>
                  </div>
                  <Link
                    href={`/courses/${rec.courseId}`}
                    className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Course
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
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

