import Head from 'next/head';
import Layout from '@/components/Layout';
import CertificationProgressTracker from '@/components/certifications/CertificationProgressTracker';
import { useState, useEffect } from 'react';
import { AcademicCapIcon, LightBulbIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface RecommendedPathway {
  pathway: {
    id: string;
    name: string;
    type: string;
    level: number;
    levelTitle: string;
    cost: number;
    estimatedDurationWeeks: number;
  };
  progressPercentage: number;
  coursesCompleted: number;
  coursesRequired: number;
  recommended: boolean;
}

export default function MyCertificationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedPathway[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/certifications/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Only show recommended pathways
        setRecommendations(data.filter((rec: RecommendedPathway) => rec.recommended));
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>My Certifications - Chitepo School of Ideology</title>
        <meta name="description" content="Track your certification progress and achievements at the Chitepo School of Ideology" />
      </Head>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AcademicCapIcon className="mx-auto h-16 w-16 text-white mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              My Certifications
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Track your progress, view achievements, and explore recommended pathways
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Progress Tracker */}
        <div className="mb-12">
          <CertificationProgressTracker />
        </div>

        {/* Recommended Pathways */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div className="flex items-center mb-6">
              <LightBulbIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                <p className="text-gray-600">Based on your completed courses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div
                  key={rec.pathway.id}
                  className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Level {rec.pathway.level}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {rec.progressPercentage.toFixed(0)}% Ready
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {rec.pathway.levelTitle}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4">{rec.pathway.name}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">{rec.pathway.estimatedDurationWeeks} weeks</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cost</p>
                      <p className="font-medium text-gray-900">
                        ${rec.pathway.cost === 0 ? 'Free' : rec.pathway.cost}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Your Progress</span>
                      <span>{rec.coursesCompleted}/{rec.coursesRequired} courses</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${rec.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/learning?tab=certifications#${rec.pathway.type}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Pathway Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <RocketLaunchIcon className="mx-auto h-16 w-16 text-white mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start a New Pathway?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Explore our comprehensive certification pathways designed to advance your ideological knowledge and leadership skills.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/learning?tab=certifications"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-purple-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Browse All Pathways
              </Link>
              <Link
                href="/learning"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-white hover:text-purple-600 transition-colors"
              >
                Explore Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Official Recognition</h3>
            <p className="text-gray-600">
              Earn nationally recognized certifications that advance your career and political engagement.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <LightBulbIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Learning</h3>
            <p className="text-gray-600">
              Follow progressive pathways designed to build comprehensive ideological and leadership competence.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <RocketLaunchIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Advancement</h3>
            <p className="text-gray-600">
              Certifications open doors to leadership positions and mandated opportunities in party and government.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

