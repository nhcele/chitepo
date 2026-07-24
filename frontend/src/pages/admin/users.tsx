import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  adminListUsers, 
  adminChangeUserRole, 
  adminCreateUser,
  adminActivateUser,
  adminDeactivateUser,
  adminResetUserPassword,
  adminDeleteUser,
  adminUpdateUser,
  adminBulkUserAction
} from '@/lib/api/admin';
import { User, UserRole } from '@mindelta/shared';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  KeyIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: UserRole.LEARNER, password: '' });
  const [newPassword, setNewPassword] = useState('');

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return users;
    return users.filter(u => (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term));
  }, [q, users]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminListUsers();
        setUsers(res.items);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Status', 'Created'],
      ...filtered.map(u => [u.name || '', u.email || '', String(u.role || ''), u.isActive ? 'active' : 'inactive', new Date(u.createdAt as any).toISOString()]),
    ];
    const csv = rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeRole = async (id: string, role: UserRole) => {
    try {
      await adminChangeUserRole(id, role);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)));
      showToast('Role updated successfully');
    } catch (e: any) {
      showToast(e?.message || 'Failed to update role', true);
    }
  };

  const showToast = (message: string, isError = false) => {
    setToast(message);
    if (isError) setError(message);
    setTimeout(() => {
      setToast(null);
      if (isError) setError(null);
    }, 3000);
  };

  const handleCreateUser = async () => {
    try {
      await adminCreateUser(newUser);
      setShowCreateModal(false);
      setNewUser({ email: '', name: '', role: UserRole.LEARNER, password: '' });
      const res = await adminListUsers();
      setUsers(res.items);
      showToast('User created successfully');
    } catch (e: any) {
      showToast(e?.message || 'Failed to create user', true);
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await adminActivateUser(id);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, isActive: true } : u)));
      showToast('User activated successfully');
    } catch (e: any) {
      showToast(e?.message || 'Failed to activate user', true);
    }
  };

  const handleDeactivateUser = async (id: string) => {
    try {
      await adminDeactivateUser(id);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, isActive: false } : u)));
      showToast('User deactivated successfully');
    } catch (e: any) {
      showToast(e?.message || 'Failed to deactivate user', true);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    try {
      await adminResetUserPassword(selectedUser.id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
      showToast('Password reset successfully');
    } catch (e: any) {
      showToast(e?.message || 'Failed to reset password', true);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await adminDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('User deleted successfully');
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete user', true);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return;
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    try {
      await adminBulkUserAction(selectedUsers, action);
      const res = await adminListUsers();
      setUsers(res.items);
      setSelectedUsers([]);
      showToast(`Bulk ${action} completed successfully`);
    } catch (e: any) {
      showToast(e?.message || `Failed to ${action} users`, true);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filtered.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filtered.map(u => u.id));
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.INSTRUCTOR:
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>User Management - Admin Dashboard - Chitepo</title>
        <meta name="description" content="Manage users, roles, and permissions on the Chitepo platform." />
      </Head>
      <Layout>
        <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <UserGroupIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-900 mb-4">User Management</h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Manage user accounts, roles, and permissions across the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg"
              >
                {toast}
              </motion.div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create User
                </button>
                <button
                  onClick={exportCsv}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">{selectedUsers.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="ml-auto px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filtered.length && filtered.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleSelectUser(user.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role as any}
                              onChange={e => changeRole(user.id, e.target.value as any)}
                              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value={UserRole.LEARNER}>Learner</option>
                              <option value={UserRole.INSTRUCTOR}>Instructor</option>
                              <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? (
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {user.isActive ? (
                                <button
                                  onClick={() => handleDeactivateUser(user.id)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Deactivate"
                                >
                                  <XCircleIcon className="h-5 w-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateUser(user.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Activate"
                                >
                                  <CheckCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowPasswordModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Reset Password"
                              >
                                <KeyIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete User"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </RoleGuard>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Create New User</h3>
                <button onClick={() => setShowCreateModal(false)}>
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={UserRole.LEARNER}>Learner</option>
                    <option value={UserRole.INSTRUCTOR}>Instructor</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Leave empty for default password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: TempPassword@123</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create User
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Reset Password</h3>
                <button onClick={() => { setShowPasswordModal(false); setSelectedUser(null); setNewPassword(''); }}>
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Reset password for <strong>{selectedUser.name}</strong></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleResetPassword}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => { setShowPasswordModal(false); setSelectedUser(null); setNewPassword(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </Layout>
    </>
  );
}
