import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { recommendationsApi, CourseRecommendation, LearningPathRecommendation } from '../../lib/api/recommendations';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RecommendationsDisplay() {
  const [personalized, setPersonalized] = useState<CourseRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPathRecommendation[]>([]);
  const [struggling, setStruggling] = useState<CourseRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'personalized' | 'path' | 'struggling'>('personalized');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const [personalizedData, pathData, strugglingData] = await Promise.all([
        recommendationsApi.getPersonalized(10).catch(() => []),
        recommendationsApi.getLearningPath().catch(() => []),
        recommendationsApi.getStrugglingStudentRecommendations().catch(() => []),
      ]);
      setPersonalized(personalizedData);
      setLearningPath(pathData);
      setStruggling(strugglingData);
    } catch (error: any) {
      toast.error('Failed to load recommendations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-yellow-500" />
              Personalized Recommendations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Courses tailored to your learning style and progress
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('personalized')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personalized'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recommended Courses ({personalized.length})
          </button>
          <button
            onClick={() => setActiveTab('path')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'path'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Learning Path ({learningPath.length})
          </button>
          {struggling.length > 0 && (
            <button
              onClick={() => setActiveTab('struggling')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'struggling'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Need Help? ({struggling.length})
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Personalized Recommendations */}
        {activeTab === 'personalized' && (
          <div className="space-y-4">
            {personalized.length === 0 ? (
              <div className="text-center py-12">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recommendations available yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Complete some courses to get personalized recommendations
                </p>
              </div>
            ) : (
              personalized.map((rec) => (
                <div
                  key={rec.courseId}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getMatchColor(rec.matchScore)}`}>
                          {Math.round(rec.matchScore)}% match
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(rec.difficulty)}`}>
                          {rec.difficulty}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {Math.round(rec.estimatedDuration)} min
                        </span>
                        {rec.category && (
                          <span className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1" />
                            {rec.category}
                          </span>
                        )}
                      </div>
                      {rec.skills && rec.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rec.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg">
                        <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-900 italic">{rec.reason}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/courses/${rec.courseId}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Course
                      <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Learning Path */}
        {activeTab === 'path' && (
          <div className="space-y-4">
            {learningPath.length === 0 ? (
              <div className="text-center py-12">
                <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No learning path available yet</p>
              </div>
            ) : (
              <div className="relative">
                {learningPath.map((item, idx) => (
                  <div key={item.courseId} className="relative pb-8 last:pb-0">
                    {idx < learningPath.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300" />
                    )}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {item.order}
                      </div>
                      <div className="ml-4 flex-1 border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 italic">{item.reason}</p>
                            {item.prerequisites && item.prerequisites.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Prerequisites: {item.prerequisites.length} course(s)
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/courses/${item.courseId}`}
                          className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          View Course
                          <ArrowRightIcon className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Struggling Student Recommendations */}
        {activeTab === 'struggling' && (
          <div className="space-y-4">
            {struggling.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">You're doing great! No remedial courses needed.</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Need help?</strong> These foundational courses can help strengthen your understanding.
                </p>
              </div>
            )}
            {struggling.map((rec) => (
              <div
                key={rec.courseId}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                    <p className="text-gray-600 mt-2">{rec.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(rec.difficulty)}`}>
                        {rec.difficulty}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {Math.round(rec.estimatedDuration)} min
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 italic">{rec.reason}</p>
                  </div>
                </div>
                <Link
                  href={`/courses/${rec.courseId}`}
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Course
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

