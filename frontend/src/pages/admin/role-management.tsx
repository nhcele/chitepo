import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
      toast('Failed to export data. Please try again.');
    }
  };

  const handleCsvUpload = async (csvData: string, notifyUsers: boolean) => {
    try {
      const result = await roleManagementApi.uploadRoleAssignmentCsv(csvData, notifyUsers);
      toast(`CSV processed successfully! ${result.bulkResult.success} assignments completed, ${result.bulkResult.errors.length} errors.`);
      setShowCsvModal(false);
      loadRoleData(); // Refresh data
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      toast('Failed to process CSV. Please check the format and try again.');
    }
  };

  const handleRoleAssignment = async (userId: string, newRole: string, notifyUser: boolean) => {
    try {
      await roleManagementApi.updateUserRole(userId, newRole, notifyUser);
      toast('Role assigned successfully!');
      setShowAssignmentModal(false);
      loadRoleData(); // Refresh data
      if (selectedRole) loadRoleUsers();
      if (searchQuery) searchUsers();
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast('Failed to assign role. Please try again.');
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast('Please enter a role name');
      return;
    }
    const formattedRoleName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    setCustomRoles([...customRoles, formattedRoleName]);
    setShowCreateRoleModal(false);
    setNewRoleName('');
    setNewRoleDescription('');
    toast(`Role "${formattedRoleName}" created successfully!`);
  };

  const handleEditRole = () => {
    if (!newRoleName.trim()) {
      toast('Please enter a role name');
      return;
    }
    const formattedRoleName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    const updatedRoles = customRoles.map(r => r === selectedRoleForEdit ? formattedRoleName : r);
    setCustomRoles(updatedRoles);
    setShowEditRoleModal(false);
    setSelectedRoleForEdit('');
    setNewRoleName('');
    setNewRoleDescription('');
    toast(`Role updated successfully!`);
  };

  const handleDeleteRole = () => {
    const updatedRoles = customRoles.filter(r => r !== selectedRoleForEdit);
    setCustomRoles(updatedRoles);
    setShowDeleteRoleModal(false);
    setSelectedRoleForEdit('');
    toast('Role deleted successfully!');
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
            <h1 className="text-2xl font-bold text-terracotta-600">Access Denied</h1>
            <p className="text-stone mt-2">You do not have permission to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Roles & Learning - Chitepo Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">Roles & Learning</h1>
          <p className="text-stone mt-2">Manage job roles, assign users, configure learning paths, and track compliance</p>
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
        <div className="border-b border-border/60 mb-8">
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
                    : 'border-transparent text-stone hover:text-charcoal hover:border-border/60'
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
              <h2 className="text-lg font-semibold text-charcoal">Role Distribution</h2>
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
                  className="px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700 flex items-center"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                  Upload CSV
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-stone text-white rounded-md hover:bg-ink-800 flex items-center"
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
                    className="bg-white rounded-md shadow p-6 hover:shadow-sm transition-shadow border border-border/60"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 
                        onClick={() => handleRoleSelect(role.roleName)}
                        className="text-lg font-semibold text-charcoal cursor-pointer hover:text-primary-600"
                      >
                        {role.roleName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditRoleModal(role.roleName); }}
                          className="p-1 text-pewter hover:text-forest-600"
                          title="Edit role"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteRoleModal(role.roleName); }}
                          className="p-1 text-pewter hover:text-terracotta-600"
                          title="Delete role"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone">Total Users:</span>
                        <span className="font-medium">{role.totalUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone">Active:</span>
                        <span className="text-forest-600 font-medium">{role.activeUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone">Recent Assignments:</span>
                        <span className="text-forest-600 font-medium">{role.recentAssignments}</span>
                      </div>
                      {role.complianceRate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone">Compliance:</span>
                          <span className={`font-medium ${
                            role.complianceRate >= 90 ? 'text-forest-600' :
                            role.complianceRate >= 70 ? 'text-ochre-600' : 'text-terracotta-600'
                          }`}>
                            {role.complianceRate}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone">Click to view users</span>
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, role.totalUsers))].map((_, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 bg-stone rounded-full border-2 border-white"
                            />
                          ))}
                          {role.totalUsers > 3 && (
                            <div className="w-6 h-6 bg-stone rounded-full border-2 border-white flex items-center justify-center">
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
              <h2 className="text-lg font-semibold text-charcoal">User Management</h2>
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
                    className="pl-10 pr-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-pewter" />
                </div>
                {selectedRole && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-stone">Filter:</span>
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                      {selectedRole}
                    </span>
                    <button
                      onClick={() => setSelectedRole('')}
                      className="text-pewter hover:text-stone"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-md shadow overflow-hidden">
              <table className="min-w-full divide-y divide-border/60">
                <thead className="bg-paper">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border/60">
                  {(searchQuery ? (searchResults || []) : (roleUsers || [])).map((user) => (
                    <tr key={user.id} className="hover:bg-paper">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-stone" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-charcoal">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.jobRole ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-forest-100 text-forest-800">
                            {user.jobRole}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-forest-100 text-charcoal">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="flex items-center text-forest-600">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-terracotta-600">
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
              <h2 className="text-lg font-semibold text-charcoal">Assignment History</h2>
            </div>

            <div className="bg-white rounded-md shadow overflow-hidden">
              <table className="min-w-full divide-y divide-border/60">
                <thead className="bg-paper">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Previous Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      New Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Assigned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border/60">
                  {(assignmentHistory || []).map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-paper">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-charcoal">
                            {assignment.userName}
                          </div>
                          <div className="text-sm text-stone">
                            {assignment.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-forest-100 text-charcoal">
                          {assignment.previousRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-forest-100 text-forest-800">
                          {assignment.newRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                        {assignment.assignedByName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
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
            <div className="bg-white rounded-md shadow p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Role-Based Learning Paths</h2>
              <p className="text-stone mb-6">
                Configure mandatory and recommended learning paths for each job role. Assign courses, set compliance deadlines, and track completion rates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Learning Path Configuration */}
                <div className="border border-border/60 rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-charcoal">Learning Paths</h3>
                    <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700">
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Add Path
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-paper rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Teller Onboarding</p>
                          <p className="text-xs text-stone">5 courses • 12 hours</p>
                        </div>
                        <span className="px-2 py-1 bg-forest-100 text-forest-800 text-xs rounded-full">Active</span>
                      </div>
                    </div>
                    <div className="p-3 bg-paper rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Compliance Officer Track</p>
                          <p className="text-xs text-stone">8 courses • 24 hours</p>
                        </div>
                        <span className="px-2 py-1 bg-forest-100 text-forest-800 text-xs rounded-full">Active</span>
                      </div>
                    </div>
                    <div className="p-3 bg-paper rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Branch Manager Development</p>
                          <p className="text-xs text-stone">10 courses • 30 hours</p>
                        </div>
                        <span className="px-2 py-1 bg-ochre-100 text-ochre-800 text-xs rounded-full">Draft</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Tracking */}
                <div className="border border-border/60 rounded-md p-4">
                  <h3 className="font-semibold text-charcoal mb-4">Compliance Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone">Teller</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-forest-100 rounded-full h-2">
                        <div className="bg-forest-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone">Compliance Officer</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-forest-100 rounded-full h-2">
                        <div className="bg-forest-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone">Branch Manager</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <div className="w-full bg-forest-100 rounded-full h-2">
                        <div className="bg-ochre-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone">Risk Analyst</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="w-full bg-forest-100 rounded-full h-2">
                        <div className="bg-ochre-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-border/60">
                <h3 className="font-semibold text-charcoal mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-white border border-border/60 text-charcoal rounded-md hover:bg-paper text-sm">
                    Configure Learning Paths
                  </button>
                  <button className="px-4 py-2 bg-white border border-border/60 text-charcoal rounded-md hover:bg-paper text-sm">
                    Set Compliance Deadlines
                  </button>
                  <button className="px-4 py-2 bg-white border border-border/60 text-charcoal rounded-md hover:bg-paper text-sm">
                    View Detailed Reports
                  </button>
                  <button className="px-4 py-2 bg-white border border-border/60 text-charcoal rounded-md hover:bg-paper text-sm">
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
              <div className="bg-white rounded-md shadow p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Role Distribution</h3>
                <div className="space-y-3">
                  {(roleStats?.roleDistribution || [])
                    .filter(role => role.totalUsers > 0)
                    .sort((a, b) => b.totalUsers - a.totalUsers)
                    .map((role) => (
                      <div key={role.roleName} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-charcoal">{role.roleName}</span>
                            <span className="text-sm text-stone">{role.totalUsers} users</span>
                          </div>
                          <div className="w-full bg-forest-100 rounded-full h-2">
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

              <div className="bg-white rounded-md shadow p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Compliance by Role</h3>
                <div className="space-y-3">
                  {(roleStats?.roleDistribution || [])
                    .filter(role => role.totalUsers > 0 && role.complianceRate)
                    .sort((a, b) => (b.complianceRate || 0) - (a.complianceRate || 0))
                    .map((role) => (
                      <div key={role.roleName} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-charcoal">{role.roleName}</span>
                            <span className={`text-sm font-medium ${
                              (role.complianceRate || 0) >= 90 ? 'text-forest-600' :
                              (role.complianceRate || 0) >= 70 ? 'text-ochre-600' : 'text-terracotta-600'
                            }`}>
                              {role.complianceRate}%
                            </span>
                          </div>
                          <div className="w-full bg-forest-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (role.complianceRate || 0) >= 90 ? 'bg-forest-500' :
                                (role.complianceRate || 0) >= 70 ? 'bg-ochre-500' : 'bg-terracotta-500'
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
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Role</h3>
              <button onClick={() => { setShowCreateRoleModal(false); setNewRoleName(''); setNewRoleDescription(''); }}>
                <XCircleIcon className="h-6 w-6 text-pewter hover:text-stone" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Senior Analyst"
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-stone mt-1">Will be formatted as SENIOR_ANALYST</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Description (Optional)</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of the role"
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateRole}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Create Role
              </button>
              <button
                onClick={() => { setShowCreateRoleModal(false); setNewRoleName(''); setNewRoleDescription(''); }}
                className="flex-1 px-4 py-2 bg-forest-100 text-charcoal rounded-md hover:bg-stone"
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
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Role</h3>
              <button onClick={() => { setShowEditRoleModal(false); setSelectedRoleForEdit(''); setNewRoleName(''); setNewRoleDescription(''); }}>
                <XCircleIcon className="h-6 w-6 text-pewter hover:text-stone" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Current Role</label>
                <p className="text-charcoal font-medium">{selectedRoleForEdit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">New Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Senior Analyst"
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Description (Optional)</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of the role"
                  className="w-full px-3 py-2 border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditRole}
                className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700"
              >
                Update Role
              </button>
              <button
                onClick={() => { setShowEditRoleModal(false); setSelectedRoleForEdit(''); setNewRoleName(''); setNewRoleDescription(''); }}
                className="flex-1 px-4 py-2 bg-forest-100 text-charcoal rounded-md hover:bg-stone"
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
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-terracotta-600">Delete Role</h3>
              <button onClick={() => { setShowDeleteRoleModal(false); setSelectedRoleForEdit(''); }}>
                <XCircleIcon className="h-6 w-6 text-pewter hover:text-stone" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-charcoal">
                Are you sure you want to delete the role <span className="font-bold">{selectedRoleForEdit}</span>?
              </p>
              <p className="text-sm text-terracotta-600 mt-2">
                Warning: This action cannot be undone. Users with this role will need to be reassigned.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteRole}
                className="flex-1 px-4 py-2 bg-terracotta-600 text-white rounded-md hover:bg-terracotta-700"
              >
                Delete Role
              </button>
              <button
                onClick={() => { setShowDeleteRoleModal(false); setSelectedRoleForEdit(''); }}
                className="flex-1 px-4 py-2 bg-forest-100 text-charcoal rounded-md hover:bg-stone"
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
