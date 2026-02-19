import Head from 'next/head';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface TrainingCohort {
  id: string;
  name: string;
  track: string;
  quarter: string;
  year: number;
  status: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentOpenDate: string;
  enrollmentCloseDate: string;
  maxParticipants: number;
  currentParticipants: number;
  isMandatory: boolean;
  mandatoryFor: string | null;
  isVirtual: boolean;
  meetingSchedule: string | null;
  venue: string | null;
  cost: number;
}

interface CalendarData {
  year: number;
  quarters: {
    q1: TrainingCohort[];
    q2: TrainingCohort[];
    q3: TrainingCohort[];
    q4: TrainingCohort[];
  };
  summary: {
    totalCohorts: number;
    openForEnrollment: number;
    inProgress: number;
    completed: number;
    totalParticipants: number;
    totalCapacity: number;
  };
}

const statusColors = {
  upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
  open_for_enrollment: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  upcoming: 'Upcoming',
  open_for_enrollment: 'Open for Enrollment',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const trackColors = {
  dcc_training: 'bg-purple-600',
  local_government: 'bg-blue-600',
  rural_development: 'bg-green-600',
  traditional_leadership: 'bg-orange-600',
  judicial_officers: 'bg-indigo-600',
  general_ideology: 'bg-gray-600',
  diaspora_virtual: 'bg-teal-600',
};

const trackLabels = {
  dcc_training: 'DCC Training',
  local_government: 'Local Government',
  rural_development: 'Rural Development',
  traditional_leadership: 'Traditional Leadership',
  judicial_officers: 'Judicial Officers',
  general_ideology: 'General Ideology',
  diaspora_virtual: 'Diaspora Virtual',
};

const quarterLabels = {
  q1: 'Q1 (Jan - Mar)',
  q2: 'Q2 (Apr - Jun)',
  q3: 'Q3 (Jul - Sep)',
  q4: 'Q4 (Oct - Dec)',
};

export default function TrainingCalendarPage() {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendar();
  }, [selectedYear]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cohorts/calendar/${selectedYear}`);

      if (!response.ok) {
        throw new Error('Failed to fetch calendar');
      }

      const data = await response.json();
      
      // Ensure quarters object exists with default empty arrays
      if (!data.quarters) {
        data.quarters = { q1: [], q2: [], q3: [], q4: [] };
      } else {
        data.quarters.q1 = data.quarters.q1 || [];
        data.quarters.q2 = data.quarters.q2 || [];
        data.quarters.q3 = data.quarters.q3 || [];
        data.quarters.q4 = data.quarters.q4 || [];
      }
      
      // If summary is missing, calculate it from quarters data
      if (!data.summary) {
        const allCohorts = [
          ...data.quarters.q1,
          ...data.quarters.q2,
          ...data.quarters.q3,
          ...data.quarters.q4
        ];
        
        data.summary = {
          totalCohorts: allCohorts.length,
          openForEnrollment: allCohorts.filter((c: TrainingCohort) => c.status === 'open_for_enrollment').length,
          inProgress: allCohorts.filter((c: TrainingCohort) => c.status === 'in_progress').length,
          completed: allCohorts.filter((c: TrainingCohort) => c.status === 'completed').length,
          totalParticipants: allCohorts.reduce((sum: number, c: TrainingCohort) => sum + c.currentParticipants, 0),
          totalCapacity: allCohorts.reduce((sum: number, c: TrainingCohort) => sum + c.maxParticipants, 0)
        };
      }
      
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (cohortId: string) => {
    try {
      setEnrolling(cohortId);
      const response = await fetch(`/api/cohorts/${cohortId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to enroll');
        return;
      }

      alert('Successfully enrolled! Check your email for details.');
      fetchCalendar(); // Refresh data
    } catch (err) {
      alert('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const CohortCard = ({ cohort }: { cohort: TrainingCohort }) => {
    const statusColor = statusColors[cohort.status as keyof typeof statusColors] || statusColors.upcoming;
    const statusLabel = statusLabels[cohort.status as keyof typeof statusLabels] || 'Unknown';
    const trackColor = trackColors[cohort.track as keyof typeof trackColors] || trackColors.general_ideology;
    const trackLabel = trackLabels[cohort.track as keyof typeof trackLabels] || cohort.track;
    const canEnroll = cohort.status === 'open_for_enrollment';
    const spotsLeft = cohort.maxParticipants - cohort.currentParticipants;
    const utilizationPercent = (cohort.currentParticipants / cohort.maxParticipants) * 100;

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-l-4" style={{ borderLeftColor: trackColor.replace('bg-', '') }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${trackColor} text-white`}>
                {trackLabel}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{cohort.name}</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{cohort.description}</p>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          {/* Dates */}
          <div className="flex items-start text-sm">
            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
              </p>
              {canEnroll && (
                <p className="text-xs text-gray-500 mt-1">
                  Enrollment closes: {new Date(cohort.enrollmentCloseDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Meeting Schedule */}
          {cohort.meetingSchedule && (
            <div className="flex items-start text-sm">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              <p className="text-gray-600">{cohort.meetingSchedule}</p>
            </div>
          )}

          {/* Venue */}
          <div className="flex items-start text-sm">
            <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <p className="text-gray-600">
              {cohort.isVirtual && <span className="text-green-600 font-medium">Virtual • </span>}
              {cohort.venue}
            </p>
          </div>

          {/* Participants */}
          <div className="flex items-start text-sm">
            <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-gray-600 mb-1">
                {cohort.currentParticipants}/{cohort.maxParticipants} participants
                {canEnroll && spotsLeft > 0 && (
                  <span className="ml-2 text-green-600 font-medium">({spotsLeft} spots left)</span>
                )}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${utilizationPercent >= 90 ? 'bg-red-500' : utilizationPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Cost & Mandatory */}
          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
            <div>
              {cohort.cost === 0 ? (
                <span className="text-green-600 font-semibold">Free</span>
              ) : (
                <span className="text-gray-900 font-semibold">${cohort.cost}</span>
              )}
            </div>
            {cohort.isMandatory && (
              <div className="flex items-center text-orange-600">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Mandatory</span>
              </div>
            )}
          </div>

          {cohort.mandatoryFor && (
            <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              Required for: {cohort.mandatoryFor}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {canEnroll ? (
            <button
              onClick={() => handleEnroll(cohort.id)}
              disabled={spotsLeft === 0 || enrolling === cohort.id}
              className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                spotsLeft === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {enrolling === cohort.id ? 'Enrolling...' : spotsLeft === 0 ? 'Cohort Full' : 'Enroll Now'}
            </button>
          ) : (
            <div className="text-center text-sm text-gray-500">
              {cohort.status === 'in_progress' && 'Already in progress'}
              {cohort.status === 'completed' && 'Completed'}
              {cohort.status === 'upcoming' && 'Opening soon'}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !calendarData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error || 'Failed to load calendar'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Training Calendar - Chitepo School of Ideology</title>
        <meta name="description" content="View and enroll in upcoming training cohorts" />
      </Head>

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CalendarIcon className="mx-auto h-16 w-16 text-white mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Training Calendar</h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            View all training cohorts and enroll in programs that advance your skills and career
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Year Selector */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedYear(2025)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedYear === 2025
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              2025
            </button>
            <button
              onClick={() => setSelectedYear(2026)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedYear === 2026
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              2026
            </button>
          </div>

          <Link
            href="/my-certifications"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View My Enrollments →
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{calendarData.summary.totalCohorts}</p>
            <p className="text-sm text-gray-600 mt-1">Total Cohorts</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{calendarData.summary.openForEnrollment}</p>
            <p className="text-sm text-gray-600 mt-1">Open Now</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{calendarData.summary.inProgress}</p>
            <p className="text-sm text-gray-600 mt-1">In Progress</p>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{calendarData.summary.completed}</p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{calendarData.summary.totalParticipants}</p>
            <p className="text-sm text-gray-600 mt-1">Enrolled</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {calendarData.summary.totalCapacity > 0 
                ? Math.round((calendarData.summary.totalParticipants / calendarData.summary.totalCapacity) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Utilization</p>
          </div>
        </div>

        {/* Quarters */}
        {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => {
          const cohorts = calendarData.quarters[quarter];
          if (cohorts.length === 0) return null;

          return (
            <div key={quarter} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {quarterLabels[quarter]} {selectedYear}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cohorts.map((cohort) => (
                  <CohortCard key={cohort.id} cohort={cohort} />
                ))}
              </div>
            </div>
          );
        })}

        {/* No cohorts message */}
        {calendarData.summary.totalCohorts === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cohorts for {selectedYear}</h3>
            <p className="text-gray-600">Check back later for upcoming training opportunities.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

