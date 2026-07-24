import Head from 'next/head';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface Statistics {
  overall: {
    totalOfficials: number;
    compliant: number;
    nonCompliant: number;
    gracePeriod: number;
    exempted: number;
    complianceRate: number;
  };
  byPositionType: Record<string, {
    total: number;
    compliant: number;
    nonCompliant: number;
    complianceRate: number;
  }>;
  byRegion: Record<string, {
    total: number;
    compliant: number;
    nonCompliant: number;
  }>;
}

interface NonCompliantOfficial {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  position: string;
  positionTitle: string;
  regionProvince: string;
  complianceStatus: string;
  complianceDeadline: string;
  requiredCertifications: number;
  completedCertifications: number;
  daysOverdue: number;
}

const positionLabels: Record<string, string> = {
  councillor: 'Councillor',
  mayor: 'Mayor',
  council_chairperson: 'Council Chairperson',
  dcc_member: 'DCC Member',
  parliamentary_candidate: 'Parliamentary Candidate',
  senate_candidate: 'Senate Candidate',
  minister: 'Minister',
  deputy_minister: 'Deputy Minister',
  traditional_leader: 'Traditional Leader',
  judicial_officer: 'Judicial Officer',
  party_official: 'Party Official',
  rdc_official: 'RDC Official',
};

export default function ComplianceMonitoringPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [nonCompliantOfficials, setNonCompliantOfficials] = useState<NonCompliantOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsRes = await fetch('/api/compliance/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }

      // Fetch non-compliant officials
      const nonCompliantRes = await fetch('/api/compliance/admin/non-compliant', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (nonCompliantRes.ok) {
        const nonCompliantData = await nonCompliantRes.json();
        setNonCompliantOfficials(nonCompliantData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const runComplianceCheck = async () => {
    try {
      await fetch('/api/compliance/admin/run-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      toast('Compliance check completed successfully');
      fetchComplianceData(); // Refresh data
    } catch (err) {
      toast('Failed to run compliance check');
    }
  };

  const exportToCSV = () => {
    if (!nonCompliantOfficials.length) return;

    const headers = ['Name', 'Email', 'Position', 'Region', 'Status', 'Deadline', 'Days Overdue', 'Progress'];
    const rows = nonCompliantOfficials.map(official => [
      official.userName,
      official.userEmail,
      positionLabels[official.position] || official.position,
      official.regionProvince,
      official.complianceStatus,
      new Date(official.complianceDeadline).toLocaleDateString(),
      official.daysOverdue,
      `${official.completedCertifications}/${official.requiredCertifications}`,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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

  if (error || !statistics) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load data'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredOfficials = filter === 'all'
    ? nonCompliantOfficials
    : nonCompliantOfficials.filter(o => o.complianceStatus === filter);

  return (
    <Layout>
      <Head>
        <title>Compliance Monitoring - Admin Dashboard</title>
        <meta name="description" content="Monitor mandatory training compliance across all officials" />
      </Head>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Compliance Monitoring</h1>
              <p className="text-xl text-indigo-100">Administrator Dashboard</p>
            </div>
            <button
              onClick={runComplianceCheck}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              Run Compliance Check
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overall Statistics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <ChartBarIcon className="h-7 w-7 mr-2 text-blue-600" />
            Overall Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <UserGroupIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{statistics.overall.totalOfficials}</p>
              <p className="text-sm text-gray-600 mt-1">Total Officials</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6 border-2 border-green-200">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-3xl font-bold text-green-600">{statistics.overall.compliant}</p>
              <p className="text-sm text-gray-600 mt-1">Compliant</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                {statistics.overall.complianceRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-6 border-2 border-yellow-200">
              <ClockIcon className="h-8 w-8 text-yellow-600 mb-2" />
              <p className="text-3xl font-bold text-yellow-600">{statistics.overall.gracePeriod}</p>
              <p className="text-sm text-gray-600 mt-1">Grace Period</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-6 border-2 border-red-200">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-3xl font-bold text-red-600">{statistics.overall.nonCompliant}</p>
              <p className="text-sm text-gray-600 mt-1">Non-Compliant</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-200">
              <CheckCircleIcon className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-blue-600">{statistics.overall.exempted}</p>
              <p className="text-sm text-gray-600 mt-1">Exempted</p>
            </div>
          </div>
        </div>

        {/* By Position Type */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance by Position Type</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Non-Compliant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(statistics.byPositionType)
                  .filter(([_, data]) => data.total > 0)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([type, data]) => (
                    <tr key={type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {positionLabels[type] || type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{data.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{data.compliant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{data.nonCompliant}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${data.complianceRate >= 80 ? 'bg-green-500' : data.complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${data.complianceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{data.complianceRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Non-Compliant Officials */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-7 w-7 mr-2 text-red-600" />
              Non-Compliant Officials ({filteredOfficials.length})
            </h2>
            <div className="flex gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="grace_period">Grace Period</option>
                <option value="non_compliant">Non-Compliant</option>
              </select>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Official
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOfficials.map((official) => (
                  <tr key={official.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{official.userName}</p>
                        <p className="text-xs text-gray-500">{official.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {positionLabels[official.position] || official.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {official.regionProvince}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-gray-900 font-medium">
                        {official.completedCertifications}/{official.requiredCertifications}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <p className="text-gray-900">{new Date(official.complianceDeadline).toLocaleDateString()}</p>
                      {official.daysOverdue > 0 && (
                        <p className="text-xs text-red-600 font-medium">{official.daysOverdue} days overdue</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        official.complianceStatus === 'grace_period'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {official.complianceStatus === 'grace_period' ? 'Grace Period' : 'Non-Compliant'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

