import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ClockIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { JobRole } from '@mindelta/shared';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';
import { roleManagementApi, RoleOverview, User, RoleAssignment, RoleStats } from '@/lib/api/role-management';
import RoleAssignmentModal from '@/components/admin/RoleAssignmentModal';
import CsvUploadModal from '@/components/admin/CsvUploadModal';
import RoleStatsCard from '@/components/admin/RoleStatsCard';

export default function RoleManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assignments' | 'stats' | 'learning'>('overview');
  const [loading, setLoading] = useState(true);
  const [roleOverview, setRoleOverview] = useState<RoleOverview[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleUsers, setRoleUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<RoleAssignment[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<string>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>([]);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
      loadRoleData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRole) {
      loadRoleUsers();
    }
  }, [selectedRole, usersPage]);

  useEffect(() => {
    if (searchQuery) {
      searchUsers();
    }
  }, [searchQuery, searchPage]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignmentHistory();
    }
  }, [activeTab, historyPage]);

  const loadRoleData = async () => {
    setLoading(true);
    try {
      const [overviewData, statsData] = await Promise.all([
        roleManagementApi.getRoleOverview(),
        roleManagementApi.getRoleStats(),
      ]);
      setRoleOverview(overviewData);
      setRoleStats(statsData);
    } catch (error) {
      console.error('Failed to load role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleUsers = async () => {
    if (!selectedRole) return;
    
    try {
      const response = await roleManagementApi.getUsersByRole(selectedRole, usersPage);
      setRoleUsers(response.data);
    } catch (error) {
      console.error('Failed to load role users:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await roleManagementApi.searchUsers(searchQuery, undefined, searchPage);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const loadAssignmentHistory = async () => {
    try {
      const response = await roleManagementApi.getRoleAssignmentHistory(undefined, historyPage);
      setAssignmentHistory(response.data);
    } catch (error) {
      console.error('Failed to load assignment history:', error);
    }
  };

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName);
    setActiveTab('users');
    setUsersPage(1);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowAssignmentModal(true);
  };

  const handleExport = async (format: 'csv' | 'xlsx' = 'csv') => {
    try {
      const exportResult = await roleManagementApi.exportRoleData(format, selectedRole || undefined);
      await roleManagementApi.downloadExport(exportResult);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleCsvUpload = async (csvData: string, notifyUsers: boolean) => {
    try {
      const result = await roleManagementApi.uploadRoleAssignmentCsv(csvData, notifyUsers);
      alert(`CSV processed successfully! ${result.bulkResult.success} assignments completed, ${result.bulkResult.errors.length} errors.`);
      setShowCsvModal(false);
      loadRoleData(); // Refresh data
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      alert('Failed to process CSV. Please check the format and try again.');
    }
  };

  const handleRoleAssignment = async (userId: string, newRole: string, notifyUser: boolean) => {
    try {
      await roleManagementApi.updateUserRole(userId, newRole, notifyUser);
      alert('Role assigned successfully!');
      setShowAssignmentModal(false);
      loadRoleData(); // Refresh data
      if (selectedRole) loadRoleUsers();
      if (searchQuery) searchUsers();
    } catch (error) {
      console.error('Failed to assign role:', error);
      alert('Failed to assign role. Please try again.');
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      alert('Please enter a role name');
      return;
    }
    const formattedRoleName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    setCustomRoles([...customRoles, formattedRoleName]);
    setShowCreateRoleModal(false);
    setNewRoleName('');
    setNewRoleDescription('');
    alert(`Role "${formattedRoleName}" created successfully!`);
  };

  const handleEditRole = () => {
    if (!newRoleName.trim()) {
      alert('Please enter a role name');
      return;
    }
    const formattedRoleName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    const updatedRoles = customRoles.map(r => r === selectedRoleForEdit ? formattedRoleName : r);
    setCustomRoles(updatedRoles);
    setShowEditRoleModal(false);
    setSelectedRoleForEdit('');
    setNewRoleName('');
    setNewRoleDescription('');
    alert(`Role updated successfully!`);
  };

  const handleDeleteRole = () => {
    const updatedRoles = customRoles.filter(r => r !== selectedRoleForEdit);
    setCustomRoles(updatedRoles);
    setShowDeleteRoleModal(false);
    setSelectedRoleForEdit('');
    alert('Role deleted successfully!');
  };

  const openEditRoleModal = (roleName: string) => {
    setSelectedRoleForEdit(roleName);
    setNewRoleName(roleName);
    setShowEditRoleModal(true);
  };

  const openDeleteRoleModal = (roleName: string) => {
    setSelectedRoleForEdit(roleName);
    setShowDeleteRoleModal(true);
  };

  const allRoles = [...Object.values(JobRole), ...customRoles];

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
    <AdminLayout>
      <Head>
        <title>Roles & Learning - Mindelta Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Roles & Learning</h1>
          <p className="text-gray-600 mt-2">Manage job roles, assign users, configure learning paths, and track compliance</p>
        </div>

        {/* Quick Stats */}
        {roleStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <RoleStatsCard
              title="Total Users"
              value={roleStats.totalUsers}
              icon={UserGroupIcon}
              color="blue"
            />
            <RoleStatsCard
              title="Users with Roles"
              value={roleStats.usersWithRoles}
              icon={ShieldCheckIcon}
              color="green"
            />
            <RoleStatsCard
              title="Assignment Rate"
              value={`${roleStats.roleAssignmentRate}%`}
              icon={ChartBarIcon}
              color="purple"
            />
            <RoleStatsCard
              title="Recent Assignments"
              value={roleStats.recentAssignments}
              icon={ClockIcon}
              color="orange"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Role Overview', icon: UserGroupIcon },
              { id: 'users', name: 'User Management', icon: UserIcon },
              { id: 'learning', name: 'Role Learning', icon: AcademicCapIcon },
              { id: 'assignments', name: 'Assignment History', icon: ClockIcon },
              { id: 'stats', name: 'Statistics', icon: ChartBarIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Role Distribution</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCreateRoleModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Role
                </button>
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                  Upload CSV
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(roleOverview || []).map((role) => (
                  <div
                    key={role.roleName}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 
                        onClick={() => handleRoleSelect(role.roleName)}
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
                      >
                        {role.roleName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditRoleModal(role.roleName); }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit role"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteRoleModal(role.roleName); }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete role"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Users:</span>
                        <span className="font-medium">{role.totalUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active:</span>
                        <span className="text-green-600 font-medium">{role.activeUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Recent Assignments:</span>
                        <span className="text-blue-600 font-medium">{role.recentAssignments}</span>
                      </div>
                      {role.complianceRate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Compliance:</span>
                          <span className={`font-medium ${
                            role.complianceRate >= 90 ? 'text-green-600' :
                            role.complianceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {role.complianceRate}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Click to view users</span>
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, role.totalUsers))].map((_, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white"
                            />
                          ))}
                          {role.totalUsers > 3 && (
                            <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-white">+{role.totalUsers - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                {selectedRole && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Filter:</span>
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                      {selectedRole}
                    </span>
                    <button
                      onClick={() => setSelectedRole('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(searchQuery ? (searchResults || []) : (roleUsers || [])).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.jobRole ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {user.jobRole}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleUserSelect(user)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Assign Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Assignment History</h2>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(assignmentHistory || []).map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {assignment.previousRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {assignment.newRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignedByName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Role-Based Learning Paths</h2>
              <p className="text-gray-600 mb-6">
                Configure mandatory and recommended learning paths for each job role. Assign courses, set compliance deadlines, and track completion rates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Learning Path Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Learning Paths</h3>
                    <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700">
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Add Path
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Teller Onboarding</p>
                          <p className="text-xs text-gray-500">5 courses • 12 hours</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Compliance Officer Track</p>
                          <p className="text-xs text-gray-500">8 courses • 24 hours</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Branch Manager Development</p>
                          <p className="text-xs text-gray-500">10 courses • 30 hours</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Draft</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Tracking */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Compliance Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Teller</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Compliance Officer</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Branch Manager</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Risk Analyst</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                    Configure Learning Paths
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                    Set Compliance Deadlines
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                    View Detailed Reports
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                    Export Learning Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && roleStats && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
                <div className="space-y-3">
                  {(roleStats?.roleDistribution || [])
                    .filter(role => role.totalUsers > 0)
                    .sort((a, b) => b.totalUsers - a.totalUsers)
                    .map((role) => (
                      <div key={role.roleName} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{role.roleName}</span>
                            <span className="text-sm text-gray-500">{role.totalUsers} users</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${(role.totalUsers / roleStats.totalUsers) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Role</h3>
                <div className="space-y-3">
                  {(roleStats?.roleDistribution || [])
                    .filter(role => role.totalUsers > 0 && role.complianceRate)
                    .sort((a, b) => (b.complianceRate || 0) - (a.complianceRate || 0))
                    .map((role) => (
                      <div key={role.roleName} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{role.roleName}</span>
                            <span className={`text-sm font-medium ${
                              (role.complianceRate || 0) >= 90 ? 'text-green-600' :
                              (role.complianceRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {role.complianceRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (role.complianceRate || 0) >= 90 ? 'bg-green-500' :
                                (role.complianceRate || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${role.complianceRate || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignmentModal && selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedUser(null);
          }}
          onAssign={handleRoleAssignment}
        />
      )}

      {showCsvModal && (
        <CsvUploadModal
          onClose={() => setShowCsvModal(false)}
          onUpload={handleCsvUpload}
        />
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Role</h3>
              <button onClick={() => { setShowCreateRoleModal(false); setNewRoleName(''); setNewRoleDescription(''); }}>
                <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Senior Analyst"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Will be formatted as SENIOR_ANALYST</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of the role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateRole}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create Role
              </button>
              <button
                onClick={() => { setShowCreateRoleModal(false); setNewRoleName(''); setNewRoleDescription(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Role</h3>
              <button onClick={() => { setShowEditRoleModal(false); setSelectedRoleForEdit(''); setNewRoleName(''); setNewRoleDescription(''); }}>
                <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                <p className="text-gray-900 font-medium">{selectedRoleForEdit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Senior Analyst"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of the role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Role
              </button>
              <button
                onClick={() => { setShowEditRoleModal(false); setSelectedRoleForEdit(''); setNewRoleName(''); setNewRoleDescription(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Modal */}
      {showDeleteRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-600">Delete Role</h3>
              <button onClick={() => { setShowDeleteRoleModal(false); setSelectedRoleForEdit(''); }}>
                <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete the role <span className="font-bold">{selectedRoleForEdit}</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Warning: This action cannot be undone. Users with this role will need to be reassigned.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteRole}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Role
              </button>
              <button
                onClick={() => { setShowDeleteRoleModal(false); setSelectedRoleForEdit(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
