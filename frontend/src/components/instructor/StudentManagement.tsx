import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { studentProgressApi, CourseStudentsResponse, StudentProgressDetails } from '../../lib/api/student-progress';
import { messagingApi } from '../../lib/api/messaging';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface StudentManagementProps {
  courseId: string;
}

export default function StudentManagement({ courseId }: StudentManagementProps) {
  const [students, setStudents] = useState<CourseStudentsResponse | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgressDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMessaging, setShowMessaging] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [courseId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentProgressApi.getCourseStudents(courseId);
      setStudents(data);
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (studentId: string) => {
    try {
      const details = await studentProgressApi.getStudentProgress(courseId, studentId);
      setSelectedStudent(details);
    } catch (error: any) {
      toast.error('Failed to load student details');
      console.error(error);
    }
  };

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 60) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredStudents = students?.students.filter((student) =>
    student.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedStudent(null)}
          className="text-blue-600 hover:text-blue-700 flex items-center"
        >
          <ArrowRightIcon className="h-4 w-4 mr-1 rotate-180" />
          Back to Students List
        </button>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Student Progress Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedStudent.student.name} ({selectedStudent.student.email})
            </p>
          </div>

          <div className="p-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(selectedStudent.enrollment.progressPercentage)}%
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Completed Lessons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedStudent.statistics.completedLessons}/{selectedStudent.statistics.totalLessons}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Watch Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedStudent.statistics.totalWatchTimeFormatted}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedStudent.statistics.averageScore > 0
                    ? Math.round(selectedStudent.statistics.averageScore)
                    : 'N/A'}%
                </p>
              </div>
            </div>

            {/* Lesson Progress */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Progress</h3>
              <div className="space-y-2">
                {selectedStudent.lessonProgress.map((lesson) => (
                  <div
                    key={lesson.lessonId}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{lesson.lessonTitle}</h4>
                          {lesson.completed && (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{lesson.moduleTitle}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          {lesson.score !== null && (
                            <span>Score: {Math.round(lesson.score)}%</span>
                          )}
                          {lesson.watchTime > 0 && (
                            <span>Watch Time: {formatWatchTime(lesson.watchTime)}</span>
                          )}
                          {lesson.attempts > 0 && <span>Attempts: {lesson.attempts}</span>}
                        </div>
                        {lesson.lastAccessed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last accessed: {new Date(lesson.lastAccessed).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowMessaging(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600 mt-1">{students?.courseTitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students?.totalStudents || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Watch Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.student.name}</div>
                        <div className="text-sm text-gray-500">{student.student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${student.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{Math.round(student.progressPercentage)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatWatchTime(student.totalWatchTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.completedAt ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.averageScore > 0 ? Math.round(student.averageScore) : 'N/A'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => loadStudentDetails(student.studentId)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

