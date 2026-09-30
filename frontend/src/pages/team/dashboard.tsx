import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  TrendingUp, 
  CreditCard, 
  BookOpen, 
  Award,
  Calendar,
  Mail,
  Settings,
  Download,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { teamsApi, TeamAnalytics as ApiTeamAnalytics, TeamMember, TeamLicense } from '@/lib/api/teams';

export default function TeamDashboard() {
  const [analytics, setAnalytics] = useState<ApiTeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'licenses' | 'reports'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const getDateFromRange = (range: string): string => {
    const now = new Date();
    const from = new Date();
    
    switch (range) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      case '1y':
        from.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return from.toISOString();
  };

  const loadTeamAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Get actual team ID from context/auth
      const teamId = 'current-team';
      const response = await teamsApi.getTeamAnalytics(teamId, {
        from: getDateFromRange(selectedTimeRange),
        to: new Date().toISOString()
      });
      setAnalytics(response);
    } catch (error) {
      console.error('Failed to load team analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    loadTeamAnalytics();
  }, [loadTeamAnalytics]);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-terracotta-100 text-terracotta-800',
      admin: 'bg-primary-100 text-primary-800',
      manager: 'bg-forest-100 text-forest-800',
      member: 'bg-forest-100 text-charcoal'
    };
    return colors[role] || 'bg-forest-100 text-charcoal';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-forest-100 text-forest-800',
      inactive: 'bg-forest-100 text-charcoal',
      pending: 'bg-ochre-100 text-ochre-800'
    };
    return colors[status] || 'bg-forest-100 text-charcoal';
  };

  const getLicenseTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      course: 'bg-primary-100 text-primary-800',
      learning_path: 'bg-terracotta-100 text-terracotta-800',
      subscription: 'bg-forest-100 text-forest-800'
    };
    return colors[type] || 'bg-forest-100 text-charcoal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-stone">Unable to load team analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Team Dashboard</h1>
          <p className="text-stone">Manage your team and track learning progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Members</span>
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-md shadow-sm border border-border/60">
        <div className="flex space-x-8 px-6 pt-6">
          {['overview', 'members', 'licenses', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-stone hover:text-charcoal hover:border-border/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-md shadow-sm p-6 border border-border/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone">Team Members</p>
                      <p className="text-2xl font-bold text-charcoal">{analytics.overview.totalMembers}</p>
                      <p className="text-xs text-forest-600 mt-1">
                        {analytics.overview.activeMembers} active
                      </p>
                    </div>
                    <div className="p-3 bg-primary-100 rounded-md">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-md shadow-sm p-6 border border-border/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone">License Utilization</p>
                      <p className="text-2xl font-bold text-charcoal">
                        {analytics.overview.totalLicenses > 0 
                          ? ((analytics.overview.activeLicenses / analytics.overview.totalLicenses) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-stone mt-1">
                        {analytics.overview.activeLicenses} of {analytics.overview.totalLicenses}
                      </p>
                    </div>
                    <div className="p-3 bg-forest-100 rounded-md">
                      <Target className="w-6 h-6 text-forest-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-md shadow-sm p-6 border border-border/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone">Courses Completed</p>
                      <p className="text-2xl font-bold text-charcoal">{analytics.learning.coursesCompleted}</p>
                      <p className="text-xs text-stone mt-1">
                        Avg. Score: {analytics.overview.averageScore.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-terracotta-100 rounded-md">
                      <BookOpen className="w-6 h-6 text-terracotta-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-md shadow-sm p-6 border border-border/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone">Learning Hours</p>
                      <p className="text-2xl font-bold text-charcoal">{analytics.overview.totalLearningHours}</p>
                      <p className="text-xs text-stone mt-1">
                        {analytics.overview.averageHoursPerMember.toFixed(1)} per member
                      </p>
                    </div>
                    <div className="p-3 bg-ochre-100 rounded-md">
                      <Clock className="w-6 h-6 text-ochre-600" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {analytics.members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-stone">
                            {member.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-charcoal">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-stone">
                            Last active {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-charcoal">
                          {member.completedCourses} courses
                        </p>
                        <p className="text-xs text-stone">
                          {member.totalLearningHours}h total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-charcoal">Team Members</h3>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 border border-border/60 rounded-md hover:bg-paper"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Invite Members</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 border border-border/60 rounded-md hover:bg-paper"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </motion.button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-paper border-b border-border/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Learning Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border/60">
                    {analytics.members.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-paper"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-stone">
                                {member.firstName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-charcoal">{member.firstName} {member.lastName}</div>
                              <div className="text-sm text-stone">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-charcoal">
                            {member.completedCourses}/{member.completedCourses + member.inProgressCourses}
                          </div>
                          <div className="w-full bg-forest-100 rounded-full h-2 mt-1">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{
                                width: `${member.completedCourses + member.inProgressCourses > 0 ? (member.completedCourses / (member.completedCourses + member.inProgressCourses)) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                          {member.totalLearningHours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                          {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <Settings className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Licenses Tab */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-charcoal">Team Licenses</h3>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Purchase Licenses</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.licenses.map((license, index) => (
                  <motion.div
                    key={license.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-md shadow-sm p-6 border border-border/60"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLicenseTypeColor(license.type)}`}>
                        {license.type.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        license.status === 'active' ? 'bg-forest-100 text-forest-800' :
                        license.status === 'expired' ? 'bg-terracotta-100 text-terracotta-800' :
                        'bg-forest-100 text-charcoal'
                      }`}>
                        {license.status}
                      </span>
                    </div>
                    
                    {license.courses && license.courses.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-charcoal truncate">{license.courses.length} course(s)</h4>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone">Usage</span>
                        <span className="font-medium">{license.used}/{license.quantity}</span>
                      </div>
                      <div className="w-full bg-forest-100 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(license.used / license.quantity) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone">Total Cost</span>
                        <span className="font-medium">{license.currency} {license.cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone">Expires</span>
                        <span className="font-medium">{new Date(license.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-3 py-2 text-sm border border-border/60 rounded-md hover:bg-paper"
                      >
                        Manage License
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-charcoal">Team Reports</h3>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 border border-border/60 rounded-md hover:bg-paper"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learning Progress Chart */}
                <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
                  <h4 className="text-lg font-semibold text-charcoal mb-4">Learning Progress</h4>
                  <div className="h-64 flex items-center justify-center text-stone">
                    <BarChart3 className="w-12 h-12" />
                  </div>
                </div>

                {/* License Utilization Chart */}
                <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
                  <h4 className="text-lg font-semibold text-charcoal mb-4">License Utilization</h4>
                  <div className="h-64 flex items-center justify-center text-stone">
                    <TrendingUp className="w-12 h-12" />
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
                  <h4 className="text-lg font-semibold text-charcoal mb-4">Top Performers</h4>
                  <div className="space-y-3">
                    {analytics.members
                      .sort((a, b) => b.completedCourses - a.completedCourses)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-ochre-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-ochre-800">{index + 1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-charcoal">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-stone">{member.completedCourses} courses</p>
                            </div>
                          </div>
                          <Award className="w-4 h-4 text-ochre-500" />
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
                  <h4 className="text-lg font-semibold text-charcoal mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    {analytics.members
                      .filter(m => m.lastActiveAt)
                      .sort((a, b) => new Date(b.lastActiveAt!).getTime() - new Date(a.lastActiveAt!).getTime())
                      .slice(0, 5)
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-pewter" />
                            <div>
                              <p className="text-sm font-medium text-charcoal">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-stone">
                                Active {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'N/A'}
                              </p>
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
      </div>
    </div>
  );
}
