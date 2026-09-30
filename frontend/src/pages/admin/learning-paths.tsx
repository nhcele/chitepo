import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';

interface Course {
  id: string;
  title: string;
  category: string;
  duration: number;
}

interface LearningPathCourse {
  courseId: string;
  courseTitle: string;
  priority: number;
  deadlineDays: number;
  isRecurring: boolean;
  type: 'required' | 'recommended' | 'elective';
}

interface LearningPath {
  jobRole: string;
  roleCategory: string;
  requiredCourses: LearningPathCourse[];
  recommendedCourses: LearningPathCourse[];
  electives: LearningPathCourse[];
  timeToCompleteWeeks: number;
  certificationRequirements: {
    mandatory: string[];
    optional: string[];
  };
}

export default function LearningPathsManagement() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('teller');
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);

  const jobRoles = [
    { value: 'teller', label: 'Teller', category: 'Frontline' },
    { value: 'customer_service_rep', label: 'Customer Service Rep', category: 'Frontline' },
    { value: 'personal_banker', label: 'Personal Banker', category: 'Frontline' },
    { value: 'operations_clerk', label: 'Operations Clerk', category: 'Operations' },
    { value: 'compliance_officer', label: 'Compliance Officer', category: 'Compliance' },
    { value: 'risk_analyst', label: 'Risk Analyst', category: 'Risk' },
    { value: 'credit_analyst', label: 'Credit Analyst', category: 'Operations' },
    { value: 'it_support', label: 'IT Support', category: 'Technology' },
    { value: 'systems_administrator', label: 'Systems Administrator', category: 'Technology' },
    { value: 'cybersecurity_analyst', label: 'Cybersecurity Analyst', category: 'Technology' },
    { value: 'branch_manager', label: 'Branch Manager', category: 'Management' },
    { value: 'operations_manager', label: 'Operations Manager', category: 'Management' },
    { value: 'compliance_manager', label: 'Compliance Manager', category: 'Management' },
    { value: 'risk_manager', label: 'Risk Manager', category: 'Management' },
    { value: 'ceo', label: 'CEO', category: 'Executive' },
    { value: 'cfo', label: 'CFO', category: 'Executive' },
    { value: 'cto', label: 'CTO', category: 'Executive' },
    { value: 'cco', label: 'CCO', category: 'Executive' },
    { value: 'cro', label: 'CRO', category: 'Executive' },
  ];

  useEffect(() => {
    // Load learning path for selected role
    loadLearningPath(selectedRole);
    loadAvailableCourses();
  }, [selectedRole]);

  const loadLearningPath = async (role: string) => {
    // Mock data - replace with API call
    setLearningPath({
      jobRole: role,
      roleCategory: jobRoles.find(r => r.value === role)?.category || 'Frontline',
      requiredCourses: [
        {
          courseId: 'aml-kyc-course',
          courseTitle: 'AML and KYC Fundamentals',
          priority: 1,
          deadlineDays: 90,
          isRecurring: false,
          type: 'required',
        },
        {
          courseId: 'fraud-prevention-course',
          courseTitle: 'Fraud Prevention and Detection',
          priority: 2,
          deadlineDays: 90,
          isRecurring: false,
          type: 'required',
        },
      ],
      recommendedCourses: [
        {
          courseId: 'customer-service-course',
          courseTitle: 'Customer Service Excellence',
          priority: 3,
          deadlineDays: 0,
          isRecurring: false,
          type: 'recommended',
        },
      ],
      electives: [
        {
          courseId: 'retail-operations-course',
          courseTitle: 'Retail Banking Operations',
          priority: 4,
          deadlineDays: 0,
          isRecurring: false,
          type: 'elective',
        },
      ],
      timeToCompleteWeeks: 12,
      certificationRequirements: {
        mandatory: ['frontline-certification'],
        optional: ['customer-excellence-certification'],
      },
    });
  };

  const loadAvailableCourses = async () => {
    // Mock data - replace with API call
    setAvailableCourses([
      { id: 'aml-kyc-course', title: 'AML and KYC Fundamentals', category: 'Compliance', duration: 8 },
      { id: 'fraud-prevention-course', title: 'Fraud Prevention and Detection', category: 'Compliance', duration: 6 },
      { id: 'customer-service-course', title: 'Customer Service Excellence', category: 'Soft Skills', duration: 5 },
      { id: 'retail-operations-course', title: 'Retail Banking Operations', category: 'Banking', duration: 10 },
      { id: 'credit-risk-course', title: 'Credit Risk Fundamentals', category: 'Risk Management', duration: 12 },
      { id: 'information-security-course', title: 'Information Security Awareness', category: 'Cybersecurity', duration: 4 },
    ]);
  };

  const handleSavePath = async () => {
    // Save learning path via API
    console.log('Saving learning path:', learningPath);
    setIsEditing(false);
    // TODO: Implement API call
  };

  const handleAddCourse = (courseId: string, type: 'required' | 'recommended' | 'elective') => {
    const course = availableCourses.find(c => c.id === courseId);
    if (!course || !learningPath) return;

    const newCourse: LearningPathCourse = {
      courseId: course.id,
      courseTitle: course.title,
      priority: 0,
      deadlineDays: type === 'required' ? 90 : 0,
      isRecurring: false,
      type,
    };

    const updatedPath = { ...learningPath };
    if (type === 'required') {
      updatedPath.requiredCourses.push(newCourse);
    } else if (type === 'recommended') {
      updatedPath.recommendedCourses.push(newCourse);
    } else {
      updatedPath.electives.push(newCourse);
    }

    setLearningPath(updatedPath);
    setShowAddCourse(false);
  };

  const handleRemoveCourse = (courseId: string, type: 'required' | 'recommended' | 'elective') => {
    if (!learningPath) return;

    const updatedPath = { ...learningPath };
    if (type === 'required') {
      updatedPath.requiredCourses = updatedPath.requiredCourses.filter(c => c.courseId !== courseId);
    } else if (type === 'recommended') {
      updatedPath.recommendedCourses = updatedPath.recommendedCourses.filter(c => c.courseId !== courseId);
    } else {
      updatedPath.electives = updatedPath.electives.filter(c => c.courseId !== courseId);
    }

    setLearningPath(updatedPath);
  };

  const handleUpdateCourse = (
    courseId: string,
    type: 'required' | 'recommended' | 'elective',
    field: keyof LearningPathCourse,
    value: any
  ) => {
    if (!learningPath) return;

    const updatedPath = { ...learningPath };
    const courseList = type === 'required' ? updatedPath.requiredCourses :
                       type === 'recommended' ? updatedPath.recommendedCourses :
                       updatedPath.electives;

    const course = courseList.find(c => c.courseId === courseId);
    if (course) {
      (course as any)[field] = value;
      setLearningPath(updatedPath);
    }
  };

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <AdminLayout title="Access Denied">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-terracotta-600">Access Denied</h1>
            <p className="text-stone mt-2">You do not have permission to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Learning Paths" subtitle="Configure and manage role-based learning paths">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Learning Paths Management</h1>
            <p className="text-stone mt-2">Configure required courses and deadlines for each job role</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-border/60 rounded-md text-charcoal hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePath}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2"
              >
                <PencilIcon className="h-5 w-5" />
                Edit Path
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role Selector Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md shadow p-4">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Select Job Role</h2>
              <div className="space-y-1">
                {jobRoles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedRole === role.value
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-charcoal hover:bg-forest-100'
                    }`}
                  >
                    <div>{role.label}</div>
                    <div className="text-xs text-stone">{role.category}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Path Editor */}
          <div className="lg:col-span-3 space-y-6">
            {learningPath && (
              <>
                {/* Path Overview */}
                <div className="bg-white rounded-md shadow p-6">
                  <h2 className="text-xl font-semibold text-charcoal mb-4">
                    {jobRoles.find(r => r.value === selectedRole)?.label} Learning Path
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">
                        Role Category
                      </label>
                      <input
                        type="text"
                        value={learningPath.roleCategory}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border/60 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">
                        Time to Complete (weeks)
                      </label>
                      <input
                        type="number"
                        value={learningPath.timeToCompleteWeeks}
                        disabled={!isEditing}
                        onChange={(e) => setLearningPath({
                          ...learningPath,
                          timeToCompleteWeeks: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-border/60 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Required Courses */}
                <div className="bg-white rounded-md shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-terracotta-600" />
                      Required Courses
                    </h3>
                    {isEditing && (
                      <button
                        onClick={() => setShowAddCourse(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Course
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {learningPath.requiredCourses.map((course) => (
                      <div key={course.courseId} className="border border-border/60 rounded-md p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-charcoal">{course.courseTitle}</h4>
                            <div className="mt-2 grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs text-stone mb-1">Priority</label>
                                <input
                                  type="number"
                                  value={course.priority}
                                  disabled={!isEditing}
                                  onChange={(e) => handleUpdateCourse(course.courseId, 'required', 'priority', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-border/60 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-stone mb-1">Deadline (days)</label>
                                <input
                                  type="number"
                                  value={course.deadlineDays}
                                  disabled={!isEditing}
                                  onChange={(e) => handleUpdateCourse(course.courseId, 'required', 'deadlineDays', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-border/60 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-stone mb-1">Recurring</label>
                                <input
                                  type="checkbox"
                                  checked={course.isRecurring}
                                  disabled={!isEditing}
                                  onChange={(e) => handleUpdateCourse(course.courseId, 'required', 'isRecurring', e.target.checked)}
                                  className="mt-2 h-4 w-4 text-primary-600 rounded"
                                />
                              </div>
                            </div>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveCourse(course.courseId, 'required')}
                              className="ml-4 text-terracotta-600 hover:text-terracotta-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Courses */}
                <div className="bg-white rounded-md shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                      <AcademicCapIcon className="h-5 w-5 text-forest-600" />
                      Recommended Courses
                    </h3>
                    {isEditing && (
                      <button
                        onClick={() => setShowAddCourse(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Course
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {learningPath.recommendedCourses.map((course) => (
                      <div key={course.courseId} className="border border-border/60 rounded-md p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-charcoal">{course.courseTitle}</h4>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-stone mb-1">Priority</label>
                                <input
                                  type="number"
                                  value={course.priority}
                                  disabled={!isEditing}
                                  onChange={(e) => handleUpdateCourse(course.courseId, 'recommended', 'priority', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-border/60 rounded"
                                />
                              </div>
                            </div>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveCourse(course.courseId, 'recommended')}
                              className="ml-4 text-terracotta-600 hover:text-terracotta-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Elective Courses */}
                <div className="bg-white rounded-md shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                      <ArrowPathIcon className="h-5 w-5 text-forest-600" />
                      Elective Courses
                    </h3>
                    {isEditing && (
                      <button
                        onClick={() => setShowAddCourse(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Course
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {learningPath.electives.map((course) => (
                      <div key={course.courseId} className="border border-border/60 rounded-md p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-charcoal">{course.courseTitle}</h4>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveCourse(course.courseId, 'elective')}
                              className="ml-4 text-terracotta-600 hover:text-terracotta-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
