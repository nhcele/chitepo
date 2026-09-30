import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { listCourses } from '@/lib/api/courses';
import { getRoleLearningPath, getComplianceStatus } from '@/lib/api/role-learning';

interface RoleLearningPath {
  user: {
    id: string;
    name: string;
    jobRole: string;
    roleCategory: string;
    roleLevel: string;
    department: string;
  };
  learningPath: {
    requiredCourses: any[];
    recommendedCourses: any[];
    electives: any[];
    progress: number;
    nextRecommendedCourse: any;
    complianceDeadlines: any[];
    timeToComplete: number;
  };
}

export default function RoleBasedLearningDashboard() {
  const { user } = useAuth();
  const [learningPath, setLearningPath] = useState<RoleLearningPath | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'path' | 'compliance' | 'progress'>('path');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Use "my" endpoints which use the JWT token to identify the user
        const [pathData, complianceData] = await Promise.all([
          getRoleLearningPath(), // Don't pass userId, use "my-path" endpoint
          getComplianceStatus(), // Don't pass userId, use "my-compliance" endpoint
        ]);
        
        setLearningPath(pathData);
        setComplianceStatus(complianceData);
      } catch (error) {
        console.error('Failed to load role learning data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="text-center py-12">
        <AcademicCapIcon className="h-16 w-16 text-pewter mx-auto mb-4" />
        <h3 className="text-lg font-medium text-charcoal mb-2">No Learning Path Available</h3>
        <p className="text-stone">Please contact your administrator to set up your job role.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-forest-600 bg-forest-100';
      case 'in_progress': return 'text-forest-600 bg-forest-100';
      case 'not_started': return 'text-stone bg-forest-100';
      case 'overdue': return 'text-terracotta-600 bg-terracotta-100';
      default: return 'text-stone bg-forest-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'in_progress': return PlayIcon;
      case 'not_started': return ClockIcon;
      case 'overdue': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {learningPath.user.name}'s Learning Journey
              </h1>
              <p className="text-primary-100 mb-4">
                {learningPath.user.jobRole?.replace('_', ' ').toUpperCase()} • {learningPath.user.department}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  <span className="font-medium">{learningPath.learningPath.progress}% Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  <span className="font-medium">{learningPath.learningPath.timeToComplete} weeks estimated</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                complianceStatus?.status === 'compliant' ? 'bg-forest-100 text-forest-800' :
                complianceStatus?.status === 'in_progress' ? 'bg-ochre-100 text-ochre-800' :
                'bg-terracotta-100 text-terracotta-800'
              }`}>
                {complianceStatus?.status === 'compliant' ? '✓ Compliant' :
                 complianceStatus?.status === 'in_progress' ? '⏳ In Progress' :
                 '⚠️ Non-Compliant'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border/60 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'path', name: 'Learning Path', icon: AcademicCapIcon },
            { id: 'compliance', name: 'Compliance Status', icon: ExclamationTriangleIcon },
            { id: 'progress', name: 'Progress Analytics', icon: ChartBarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-stone hover:text-charcoal hover:border-border/60'
              }`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Learning Path Tab */}
      {activeTab === 'path' && (
        <div className="space-y-8">
          {/* Next Recommended Course */}
          {learningPath.learningPath.nextRecommendedCourse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-forest-50 border-l-4 border-forest-400 p-6 rounded-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-forest-900 mb-2">Next Recommended Course</h3>
                  <p className="text-forest-800 font-medium">{learningPath.learningPath.nextRecommendedCourse.title}</p>
                  <p className="text-forest-600 text-sm mt-1">
                    Priority: {learningPath.learningPath.nextRecommendedCourse.priority}
                  </p>
                </div>
                <button className="bg-forest-600 text-white px-4 py-2 rounded-md hover:bg-forest-700 transition-colors">
                  Start Learning
                </button>
              </div>
            </motion.div>
          )}

          {/* Required Courses */}
          <div>
            <h3 className="text-xl font-bold text-charcoal mb-4">Required Courses</h3>
            <div className="grid gap-4">
              {learningPath.learningPath.requiredCourses.map((course, index) => {
                const StatusIcon = getStatusIcon(course.status);
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-border/60 rounded-md p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-6 w-6 ${getStatusColor(course.status).split(' ')[0]}`} />
                        <div>
                          <h4 className="font-semibold text-charcoal">{course.title}</h4>
                          <p className="text-sm text-stone">
                            {course.status === 'completed' ? `Completed on ${new Date(course.completedAt).toLocaleDateString()}` :
                             course.status === 'in_progress' ? `Started on ${new Date(course.enrollmentDate).toLocaleDateString()}` :
                             'Not started'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.deadlineDays && (
                          <span className="text-sm text-stone">
                            Due: {course.deadlineDays} days after hire
                          </span>
                        )}
                        <button className="px-3 py-1 text-sm border border-border/60 rounded-md hover:bg-paper">
                          {course.status === 'completed' ? 'Review' : 
                           course.status === 'in_progress' ? 'Continue' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recommended Courses */}
          {learningPath.learningPath.recommendedCourses.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-charcoal mb-4">Recommended Courses</h3>
              <div className="grid gap-4">
                {learningPath.learningPath.recommendedCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="bg-paper border border-border/60 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-charcoal">{course.title}</h4>
                        <p className="text-sm text-stone">Recommended for your career development</p>
                      </div>
                      <button className="px-3 py-1 text-sm border border-border/60 rounded-md hover:bg-forest-100">
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compliance Status Tab */}
      {activeTab === 'compliance' && complianceStatus && (
        <div className="space-y-6">
          {/* Compliance Summary */}
          <div className="bg-white border border-border/60 rounded-md p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Compliance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  complianceStatus.complianceScore >= 90 ? 'text-forest-600' :
                  complianceStatus.complianceScore >= 70 ? 'text-ochre-600' :
                  'text-terracotta-600'
                }`}>
                  {complianceStatus.complianceScore}%
                </div>
                <div className="text-sm text-stone">Compliance Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-forest-600">
                  {complianceStatus.summary.completed}
                </div>
                <div className="text-sm text-stone">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-ochre-600">
                  {complianceStatus.summary.pending}
                </div>
                <div className="text-sm text-stone">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-terracotta-600">
                  {complianceStatus.summary.overdue}
                </div>
                <div className="text-sm text-stone">Overdue</div>
              </div>
            </div>
          </div>

          {/* Compliance Items */}
          <div>
            <h3 className="text-lg font-semibold text-charcoal mb-4">Compliance Requirements</h3>
            <div className="space-y-3">
              {complianceStatus.complianceItems.map((item: any, index: number) => (
                <motion.div
                  key={item.courseId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-md p-4 ${
                    item.isOverdue ? 'border-terracotta-200 bg-terracotta-50' :
                    item.isCompleted ? 'border-forest-200 bg-forest-50' :
                    'border-border/60 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-charcoal">{item.courseTitle}</h4>
                      <p className="text-sm text-stone">
                        Due: {item.dueDate.toLocaleDateString()} ({item.daysUntilDue} days remaining)
                      </p>
                      {item.isRecurring && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-forest-100 text-forest-800 mt-1">
                          Recurring Requirement
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isCompleted ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-forest-100 text-forest-800">
                          ✓ Completed
                        </span>
                      ) : item.isOverdue ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-terracotta-100 text-terracotta-800">
                          ⚠️ Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-ochre-100 text-ochre-800">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress Analytics Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white border border-border/60 rounded-md p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Progress Analytics</h3>
            <div className="text-center py-8">
              <ChartBarIcon className="h-16 w-16 text-pewter mx-auto mb-4" />
              <p className="text-stone">Detailed analytics coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
