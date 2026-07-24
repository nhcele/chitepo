import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MapPinIcon,
  TrophyIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface EnrollmentByTrack {
  track: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  period: {
    start: string;
    end: string;
  };
}

interface CompletionRateByCourse {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropOffRate: number;
}

interface CertificationMetrics {
  pathwayType: string;
  pathwayName: string;
  totalEnrolled: number;
  totalAwarded: number;
  achievementRate: number;
  averageTimeToAward: number;
}

interface GeographicDistribution {
  country?: string;
  region?: string;
  province?: string;
  totalUsers: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalCertifications: number;
}

interface CourseRatingMetrics {
  courseId: string;
  courseTitle: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

interface AssessmentPassRate {
  courseId: string;
  courseTitle: string;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  averageScore: number;
  averageAttempts: number;
}

interface TimeToCompletion {
  courseId: string;
  courseTitle: string;
  averageDaysToComplete: number;
  medianDaysToComplete: number;
  fastestCompletion: number;
  slowestCompletion: number;
  percentile25: number;
  percentile75: number;
}

interface ImpactMetrics {
  voterRegistrationNumbers: number;
  officialsTrained: number;
  diasporaInvestmentFacilitated: number;
  communityProjects: number;
  period: {
    start: string;
    end: string;
  };
}

export default function SuccessMetricsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'enrollment' | 'quality' | 'impact'>('enrollment');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y' | 'all'>('30d');
  
  // Enrollment metrics
  const [enrollmentByTrack, setEnrollmentByTrack] = useState<EnrollmentByTrack[]>([]);
  const [completionRates, setCompletionRates] = useState<CompletionRateByCourse[]>([]);
  const [certificationMetrics, setCertificationMetrics] = useState<CertificationMetrics[]>([]);
  const [geographicDistribution, setGeographicDistribution] = useState<GeographicDistribution[]>([]);
  
  // Quality metrics
  const [courseRatings, setCourseRatings] = useState<CourseRatingMetrics[]>([]);
  const [assessmentPassRates, setAssessmentPassRates] = useState<AssessmentPassRate[]>([]);
  const [learnerSatisfaction, setLearnerSatisfaction] = useState<any>(null);
  const [timeToCompletion, setTimeToCompletion] = useState<TimeToCompletion[]>([]);
  
  // Impact metrics
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);

  const getDateParams = () => {
    const now = new Date();
    let start: Date;
    
    switch (dateRange) {
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(0);
    }
    
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  };

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const params = getDateParams();
      const queryString = new URLSearchParams(params).toString();

      // Load all metrics in parallel
      const [
        enrollmentRes,
        completionRes,
        certificationRes,
        geographicRes,
        ratingsRes,
        passRateRes,
        satisfactionRes,
        timeToCompleteRes,
        impactRes,
      ] = await Promise.all([
        fetch(`/api/success-metrics/enrollment-by-track?${queryString}`),
        fetch(`/api/success-metrics/completion-rates-by-course?${queryString}`),
        fetch(`/api/success-metrics/certification-achievement?${queryString}`),
        fetch(`/api/success-metrics/geographic-distribution?${queryString}`),
        fetch(`/api/success-metrics/course-ratings`),
        fetch(`/api/success-metrics/assessment-pass-rates?${queryString}`),
        fetch(`/api/success-metrics/learner-satisfaction?${queryString}`),
        fetch(`/api/success-metrics/time-to-completion`),
        fetch(`/api/success-metrics/impact?${queryString}`),
      ]);

      setEnrollmentByTrack(await enrollmentRes.json());
      setCompletionRates(await completionRes.json());
      setCertificationMetrics(await certificationRes.json());
      setGeographicDistribution(await geographicRes.json());
      setCourseRatings(await ratingsRes.json());
      setAssessmentPassRates(await passRateRes.json());
      setLearnerSatisfaction(await satisfactionRes.json());
      setTimeToCompletion(await timeToCompleteRes.json());
      setImpactMetrics(await impactRes.json());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <Head>
          <title>Success Metrics Dashboard - Chitepo School</title>
        </Head>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Success Metrics Dashboard</h1>
            <p className="text-gray-600">Track enrollment, quality, and impact metrics across all programs</p>
          </div>

          {/* Date Range Selector */}
          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <div className="flex gap-2">
              {(['30d', '90d', '1y', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === '1y' ? '1 Year' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-8">
              {[
                { id: 'enrollment', label: 'Enrollment Metrics', icon: UserGroupIcon },
                { id: 'quality', label: 'Quality Metrics', icon: StarIcon },
                { id: 'impact', label: 'Impact Metrics', icon: ArrowTrendingUpIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Enrollment Metrics Tab */}
              {activeTab === 'enrollment' && (
                <div className="space-y-6">
                  {/* Enrollment by Track */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <ChartBarIcon className="h-6 w-6 text-blue-600" />
                      Enrollment by Track
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Track</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Enrollments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {enrollmentByTrack.map((track, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap font-medium">{track.track}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{track.totalEnrollments}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{track.activeEnrollments}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{track.completedEnrollments}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${track.completionRate}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{track.completionRate.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Completion Rates by Course */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                      Completion Rates by Course
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Time (days)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drop-off Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completionRates.slice(0, 10).map((course) => (
                            <tr key={course.courseId}>
                              <td className="px-6 py-4">{course.courseTitle}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{course.totalEnrollments}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{course.completedEnrollments}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium">{course.completionRate.toFixed(1)}%</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{course.averageTimeToComplete.toFixed(1)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm ${course.dropOffRate > 50 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {course.dropOffRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Certification Achievement */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrophyIcon className="h-6 w-6 text-yellow-600" />
                      Certification Achievement Rates
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {certificationMetrics.map((cert, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold mb-2">{cert.pathwayName}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Enrolled:</span>
                              <span className="font-medium">{cert.totalEnrolled}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Awarded:</span>
                              <span className="font-medium">{cert.totalAwarded}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Achievement Rate:</span>
                              <span className="font-medium">{cert.achievementRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg. Time:</span>
                              <span className="font-medium">{cert.averageTimeToAward.toFixed(0)} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Geographic Distribution */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <MapPinIcon className="h-6 w-6 text-green-600" />
                      Geographic Distribution
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certifications</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {geographicDistribution.slice(0, 15).map((geo, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4">
                                {[geo.country, geo.region, geo.province].filter(Boolean).join(', ') || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{geo.totalUsers}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{geo.totalEnrollments}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{geo.totalCompletions}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{geo.totalCertifications}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Metrics Tab */}
              {activeTab === 'quality' && (
                <div className="space-y-6">
                  {/* Course Ratings */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <StarIcon className="h-6 w-6 text-yellow-500" />
                      Course Ratings
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ratings</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating Distribution</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {courseRatings.slice(0, 15).map((rating) => (
                            <tr key={rating.courseId}>
                              <td className="px-6 py-4">{rating.courseTitle}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{rating.averageRating.toFixed(1)}</span>
                                  <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{rating.totalRatings}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-green-600">5★:{rating.ratingDistribution.five}</span>
                                  <span className="text-blue-600">4★:{rating.ratingDistribution.four}</span>
                                  <span className="text-gray-600">3★:{rating.ratingDistribution.three}</span>
                                  <span className="text-orange-600">2★:{rating.ratingDistribution.two}</span>
                                  <span className="text-red-600">1★:{rating.ratingDistribution.one}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Assessment Pass Rates */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                      Assessment Pass Rates
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Attempts</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Attempts</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assessmentPassRates.slice(0, 15).map((rate) => (
                            <tr key={rate.courseId}>
                              <td className="px-6 py-4">{rate.courseTitle}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{rate.totalAttempts}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{rate.passedAttempts}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`font-medium ${rate.passRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {rate.passRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{rate.averageScore.toFixed(1)}%</td>
                              <td className="px-6 py-4 whitespace-nowrap">{rate.averageAttempts.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Time to Completion */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <ClockIcon className="h-6 w-6 text-blue-600" />
                      Time to Completion
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Median</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fastest</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slowest</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timeToCompletion.slice(0, 15).map((time) => (
                            <tr key={time.courseId}>
                              <td className="px-6 py-4">{time.courseTitle}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{time.averageDaysToComplete.toFixed(1)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{time.medianDaysToComplete.toFixed(1)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-green-600">{time.fastestCompletion}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-red-600">{time.slowestCompletion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Learner Satisfaction */}
                  {learnerSatisfaction && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <StarIcon className="h-6 w-6 text-purple-600" />
                        Learner Satisfaction
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Overall Satisfaction</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold">{learnerSatisfaction.averageRating?.toFixed(1) || '0.0'}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-6 w-6 ${
                                    i <= Math.round(learnerSatisfaction.averageRating || 0)
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Based on {learnerSatisfaction.totalResponses || 0} responses
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Impact Metrics Tab */}
              {activeTab === 'impact' && impactMetrics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">Voter Registrations</h3>
                      <p className="text-3xl font-bold text-gray-900">{formatNumber(impactMetrics.voterRegistrationNumbers)}</p>
                      <p className="text-xs text-gray-500 mt-2">Facilitated through platform</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">Officials Trained</h3>
                      <p className="text-3xl font-bold text-gray-900">{formatNumber(impactMetrics.officialsTrained)}</p>
                      <p className="text-xs text-gray-500 mt-2">Completed mandatory training</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">Diaspora Investment</h3>
                      <p className="text-3xl font-bold text-gray-900">{formatCurrency(impactMetrics.diasporaInvestmentFacilitated)}</p>
                      <p className="text-xs text-gray-500 mt-2">USD facilitated</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">Community Projects</h3>
                      <p className="text-3xl font-bold text-gray-900">{formatNumber(impactMetrics.communityProjects)}</p>
                      <p className="text-xs text-gray-500 mt-2">Initiated by learners</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Impact Period</h2>
                    <p className="text-gray-600">
                      {new Date(impactMetrics.period.start).toLocaleDateString()} -{' '}
                      {new Date(impactMetrics.period.end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </RoleGuard>
  );
}

