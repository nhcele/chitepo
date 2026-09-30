import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Settings, 
  TrendingUp, 
  CreditCard, 
  Mail, 
  Calendar,
  Search,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { adminTeamsApi, Team } from '@/lib/api/teams';

interface AdminTeamAnalytics {
  overview: {
    totalTeams: number;
    activeTeams: number;
    totalMembers: number;
    totalLicenses: number;
    totalRevenue: number;
  };
  teams: Team[];
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [analytics, setAnalytics] = useState<AdminTeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
    loadAnalytics();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await adminTeamsApi.getAllTeams();
      setTeams(response.teams || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await adminTeamsApi.getGlobalTeamAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || team.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      small: 'Small (1-10)',
      medium: 'Medium (11-50)',
      large: 'Large (51-200)',
      enterprise: 'Enterprise (200+)'
    };
    return labels[size] || size;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-forest-100 text-forest-800',
      inactive: 'bg-forest-100 text-charcoal',
      suspended: 'bg-terracotta-100 text-terracotta-800'
    };
    return colors[status] || 'bg-forest-100 text-charcoal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Team Management</h1>
          <p className="text-stone">Manage enterprise teams and their licenses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </motion.button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-md shadow-sm p-6 border border-border/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone">Total Teams</p>
                <p className="text-2xl font-bold text-charcoal">{analytics.overview.totalTeams}</p>
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
                <p className="text-sm text-stone">Active Teams</p>
                <p className="text-2xl font-bold text-charcoal">{analytics.overview.activeTeams}</p>
              </div>
              <div className="p-3 bg-forest-100 rounded-md">
                <TrendingUp className="w-6 h-6 text-forest-600" />
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
                <p className="text-sm text-stone">Total Members</p>
                <p className="text-2xl font-bold text-charcoal">{analytics.overview.totalMembers}</p>
              </div>
              <div className="p-3 bg-terracotta-100 rounded-md">
                <Users className="w-6 h-6 text-terracotta-600" />
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
                <p className="text-sm text-stone">Total Licenses</p>
                <p className="text-2xl font-bold text-charcoal">{analytics.overview.totalLicenses}</p>
              </div>
              <div className="p-3 bg-ochre-100 rounded-md">
                <CreditCard className="w-6 h-6 text-ochre-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-md shadow-sm p-6 border border-border/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone">Total Revenue</p>
                <p className="text-2xl font-bold text-charcoal">${analytics.overview.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-forest-100 rounded-md">
                <TrendingUp className="w-6 h-6 text-forest-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-md shadow-sm p-6 border border-border/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pewter w-4 h-4" />
            <input
              type="text"
              placeholder="Search teams or owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
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

      {/* Teams Table */}
      <div className="bg-white rounded-md shadow-sm border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-paper border-b border-border/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Licenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Revenue
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
              {filteredTeams.map((team, index) => (
                <motion.tr
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-paper"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-charcoal">{team.name}</div>
                      <div className="text-sm text-stone">{team.industry}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-stone">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-charcoal">{team.name}</div>
                        <div className="text-sm text-stone">ID: {team.ownerId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                    {getSizeLabel(team.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                    {team.memberCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                    {team.licenseCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                    $0.00
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(team.status)}`}>
                      {team.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedTeam(team)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <Settings className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-stone hover:text-charcoal"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTeam(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-md shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/60">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-charcoal">{selectedTeam.name}</h2>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-pewter hover:text-stone"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-stone mb-2">Team Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Industry:</span> {selectedTeam.industry}</p>
                    <p className="text-sm"><span className="font-medium">Size:</span> {getSizeLabel(selectedTeam.size)}</p>
                    <p className="text-sm"><span className="font-medium">Status:</span> {selectedTeam.status}</p>
                    <p className="text-sm"><span className="font-medium">Created:</span> {new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone mb-2">Owner Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Owner ID:</span> {selectedTeam.ownerId}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-primary-50 rounded-md p-4">
                  <p className="text-sm text-primary-600 font-medium">Members</p>
                  <p className="text-2xl font-bold text-primary-900">{selectedTeam.memberCount}</p>
                </div>
                <div className="bg-forest-50 rounded-md p-4">
                  <p className="text-sm text-forest-600 font-medium">Licenses</p>
                  <p className="text-2xl font-bold text-forest-900">{selectedTeam.licenseCount}</p>
                </div>
                <div className="bg-terracotta-50 rounded-md p-4">
                  <p className="text-sm text-terracotta-600 font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-terracotta-900">$0.00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
