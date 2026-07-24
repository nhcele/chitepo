import { withBasePath } from '@/lib/basePath';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, JobRole } from '@mindelta/shared';
import ChatModal from '@/components/admin/ChatModal';
import { messagingApi } from '@/lib/api/messaging';

interface RoleComplianceData {
  jobRole: string;
  totalUsers: number;
  compliant: number;
  inProgress: number;
  overdue: number;
  complianceRate: number;
}

export default function RoleLearningManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'paths' | 'compliance'>('overview');
  const [roleData, setRoleData] = useState<RoleComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    id: '',
    name: '',
    role: '',
    course: '',
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    setRoleData([
      { jobRole: 'Teller', totalUsers: 45, compliant: 38, inProgress: 5, overdue: 2, complianceRate: 84 },
      { jobRole: 'Customer Service Rep', totalUsers: 32, compliant: 28, inProgress: 3, overdue: 1, complianceRate: 88 },
      { jobRole: 'Compliance Officer', totalUsers: 8, compliant: 7, inProgress: 1, overdue: 0, complianceRate: 88 },
      { jobRole: 'Credit Analyst', totalUsers: 12, compliant: 10, inProgress: 2, overdue: 0, complianceRate: 83 },
      { jobRole: 'Branch Manager', totalUsers: 15, compliant: 13, inProgress: 1, overdue: 1, complianceRate: 87 },
    ]);
    setLoading(false);
  }, []);

  // Chat modal handlers
  const openChatModal = (userName: string, userRole: string, course: string, isCompliance: boolean) => {
    setSelectedUser({
      id: `user-${userName.toLowerCase().replace(/\s+/g, '-')}`,
      name: userName,
      role: userRole,
      course,
    });
    setChatModalOpen(true);
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setSelectedUser({ id: '', name: '', role: '', course: '' });
  };

  // Send bulk reminders
  const handleSendBulkReminders = async () => {
    try {
      const overdueUsers = [
        { userId: 'user-john-smith', courseName: 'AML/KYC Training', daysOverdue: 5 },
        { userId: 'user-sarah-johnson', courseName: 'Fraud Prevention', daysOverdue: 3 },
        { userId: 'user-michael-brown', courseName: 'Information Security', daysOverdue: 2 },
        { userId: 'user-emily-davis', courseName: 'Credit Risk Management', daysOverdue: 1 },
      ];
      
      const dueSoonUsers = [
        { userId: 'user-robert-wilson', courseName: 'Customer Service Skills', daysUntilDue: 2 },
        { userId: 'user-lisa-anderson', courseName: 'Regulatory Updates', daysUntilDue: 3 },
        { userId: 'user-david-martinez', courseName: 'Network Security', daysUntilDue: 4 },
        { userId: 'user-jennifer-taylor', courseName: 'Operational Risk', daysUntilDue: 5 },
        { userId: 'user-christopher-lee', courseName: 'Market Risk Analysis', daysUntilDue: 6 },
        { userId: 'user-amanda-white', courseName: 'System Administration', daysUntilDue: 7 },
      ];

      await messagingApi.sendBulkComplianceReminders({ overdueUsers, dueSoonUsers });
      toast('Bulk compliance reminders sent successfully!');
    } catch (error) {
      console.error('Failed to send bulk reminders:', error);
      toast('Failed to send reminders. Please try again.');
    }
  };

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <AdminLayout title="Access Denied">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600 mt-2">You do not have permission to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Role Learning" subtitle="Configure learning paths and compliance for job roles">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Role-Based Learning Management</h1>
          <p className="text-gray-600 mt-2">Manage learning paths, compliance, and user assignments</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'users', name: 'User Management', icon: UserGroupIcon },
              { id: 'paths', name: 'Learning Paths', icon: AcademicCapIcon },
              { id: 'compliance', name: 'Compliance Tracking', icon: ClockIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">112</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Compliant</p>
                    <p className="text-2xl font-bold text-gray-900">96</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900">4</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Compliance Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Compliance by Role</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compliant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overdue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compliance Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleData.map((role) => (
                      <tr key={role.jobRole} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {role.jobRole}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {role.totalUsers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {role.compliant}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {role.inProgress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {role.overdue}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  role.complianceRate >= 90 ? 'bg-green-500' :
                                  role.complianceRate >= 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${role.complianceRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {role.complianceRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Role Assignment</h2>
            <p className="text-gray-600 mb-4">
              Assign job roles to users to automatically provide them with role-specific learning paths.
            </p>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Bulk Role Assignment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file to assign roles to multiple users at once.
                </p>
                <button 
                  onClick={() => window.location.href = withBasePath('/admin/role-management')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Go to Role Management
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Individual Assignment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Search for a user and assign their job role manually.
                </p>
                <button 
                  onClick={() => window.location.href = withBasePath('/admin/role-management')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Go to Role Management
                </button>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Pro Tip:</strong> For comprehensive role management features including bulk assignment, 
                role analytics, and assignment history, visit the dedicated 
                <a href={withBasePath('/admin/role-management')} className="text-blue-600 hover:underline ml-1">Role Management page</a>.
              </p>
            </div>
          </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Learning Path Configuration</h2>
              <p className="text-gray-600">
                Configure required courses, deadlines, and progression paths for each job role.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-4">
                Select a job role from the list below to configure its learning path:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  'Teller', 'Customer Service Rep', 'Personal Banker', 'Operations Clerk',
                  'Compliance Officer', 'Risk Analyst', 'Credit Analyst', 'IT Support',
                  'Systems Administrator', 'Cybersecurity Analyst', 'Branch Manager',
                  'Operations Manager', 'Compliance Manager', 'Risk Manager',
                  'CEO', 'CFO', 'CTO', 'CCO', 'CRO'
                ].map((role) => (
                  <a
                    key={role}
                    href={`/admin/learning-paths?role=${role.toLowerCase().replace(/\s+/g, '_')}`}
                    className="block px-4 py-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                  >
                    <span className="text-sm font-medium text-gray-900">{role}</span>
                  </a>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href="/admin/learning-paths"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Open Full Learning Paths Editor
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tracking Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Tracking</h2>
              <p className="text-gray-600 mb-4">
                Monitor compliance deadlines and send reminders to users who are falling behind.
              </p>
              
              {/* Overdue Users */}
              <div className="mb-6">
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-red-900">⚠️ Overdue Users (4)</h3>
                    <button 
                      onClick={() => handleSendBulkReminders()}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Send Reminders
                    </button>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    These users have missed their compliance deadlines.
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: 'John Smith', role: 'Teller', course: 'AML/KYC Training', daysOverdue: 5 },
                      { name: 'Sarah Johnson', role: 'Customer Service Rep', course: 'Fraud Prevention', daysOverdue: 3 },
                      { name: 'Michael Brown', role: 'Branch Manager', course: 'Information Security', daysOverdue: 2 },
                      { name: 'Emily Davis', role: 'Credit Analyst', course: 'Credit Risk Management', daysOverdue: 1 },
                    ].map((user, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-3 rounded border border-red-200">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.role} • {user.course}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">{user.daysOverdue} days overdue</p>
                          <button 
                            onClick={() => openChatModal(user.name, user.role, user.course, true)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Contact User
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due Soon Users */}
              <div>
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-yellow-900">⏰ Due Soon (12)</h3>
                    <button 
                      onClick={() => handleSendBulkReminders()}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                    >
                      Send Reminders
                    </button>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    These users have deadlines approaching within 7 days.
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: 'Robert Wilson', role: 'Teller', course: 'Customer Service Skills', daysUntilDue: 2 },
                      { name: 'Lisa Anderson', role: 'Compliance Officer', course: 'Regulatory Updates', daysUntilDue: 3 },
                      { name: 'David Martinez', role: 'IT Support', course: 'Network Security', daysUntilDue: 4 },
                      { name: 'Jennifer Taylor', role: 'Operations Clerk', course: 'Operational Risk', daysUntilDue: 5 },
                      { name: 'Christopher Lee', role: 'Risk Analyst', course: 'Market Risk Analysis', daysUntilDue: 6 },
                      { name: 'Amanda White', role: 'Systems Administrator', course: 'System Administration', daysUntilDue: 7 },
                    ].map((user, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-3 rounded border border-yellow-200">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.role} • {user.course}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-yellow-600">{user.daysUntilDue} days until due</p>
                          <button 
                            onClick={() => openChatModal(user.name, user.role, user.course, true)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Contact User
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => toast('Generating comprehensive compliance report...')}
                  className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Generate Report
                </button>
                <button 
                  onClick={handleSendBulkReminders}
                  className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Send Bulk Reminders
                </button>
                <button 
                  onClick={() => toast('Exporting compliance data to CSV...')}
                  className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={closeChatModal}
        userId={selectedUser.id}
        userName={selectedUser.name}
        userRole={selectedUser.role}
        courseName={selectedUser.course}
        isCompliance={true}
      />
    </AdminLayout>
  );
}
