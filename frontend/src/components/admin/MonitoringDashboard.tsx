import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
    memory: { status: string; usage: any };
    disk: { status: string; usage: any };
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  slowestRequests: any[];
  mostFrequentErrors: any[];
}

interface ErrorStats {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  topErrors: any[];
  resolutionRate: number;
}

interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: string;
}

interface PlatformOverview {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalRevenue: number;
  monthlyGrowthRate: number;
  completionRate: number;
}

interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  coursesPerUser: number;
  lessonsPerSession: number;
  completionRate: number;
  retentionRate: number;
}

export default function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'health' | 'performance' | 'errors' | 'analytics'>('overview');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [healthRes, performanceRes, errorStatsRes, alertsRes, overviewRes, engagementRes] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/performance'),
        fetch('/api/monitoring/errors/statistics'),
        fetch('/api/monitoring/alerts?limit=10'),
        fetch('/api/analytics/business-intelligence'),
        fetch('/api/analytics/platform/engagement-metrics'),
      ]);

      const [healthData, performanceData, errorStatsData, alertsData, overviewData, engagementData] = await Promise.all([
        healthRes.json(),
        performanceRes.json(),
        errorStatsRes.json(),
        alertsRes.json(),
        overviewRes.json(),
        engagementRes.json(),
      ]);

      setHealth(healthData);
      setPerformance(performanceData);
      setErrorStats(errorStatsData);
      setAlerts(alertsData.alerts || []);
      setOverview(overviewData.overview);
      setEngagement(engagementData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5" />;
      case 'unhealthy': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'degraded': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <MinusIcon className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-primary-100 text-primary-800 border-primary-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | number) => {
    if (typeof trend === 'number') {
      return trend > 0 ? <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" /> : 
             trend < 0 ? <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" /> :
             <MinusIcon className="h-4 w-4 text-gray-600" />;
    }
    return trend === 'up' ? <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" /> :
           trend === 'down' ? <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" /> :
           <MinusIcon className="h-4 w-4 text-gray-600" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Dashboard</h1>
          <p className="text-gray-600">Real-time system monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          {health && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(health.status)}`}>
              {getStatusIcon(health.status)}
              <span className="text-sm font-medium capitalize">{health.status}</span>
            </div>
          )}
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'health', name: 'Health Checks', icon: ServerIcon },
            { id: 'performance', name: 'Performance', icon: ClockIcon },
            { id: 'errors', name: 'Errors & Alerts', icon: ExclamationTriangleIcon },
            { id: 'analytics', name: 'Analytics', icon: AcademicCapIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
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

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overview && (
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.totalUsers.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon(overview.monthlyGrowthRate)}
                        <span className="text-sm text-gray-600 ml-1">{overview.monthlyGrowthRate}% growth</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                      <AcademicCapIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.completionRate.toFixed(1)}%</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon('up')}
                        <span className="text-sm text-gray-600 ml-1">On track</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                      <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${overview.totalRevenue.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon('up')}
                        <span className="text-sm text-gray-600 ml-1">Growing</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                      <ServerIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">System Status</p>
                      <p className="text-2xl font-bold text-gray-900 capitalize">{health?.status || 'Unknown'}</p>
                      <div className="flex items-center mt-1">
                        {health && getStatusIcon(health.status)}
                        <span className="text-sm text-gray-600 ml-1">{health?.summary.failedChecks || 0} issues</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm opacity-75">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'health' && health && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">System Health</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Overall Status</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(health.status)}`}>
                    {getStatusIcon(health.status)}
                    <span className="text-sm font-medium capitalize">{health.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Uptime</span>
                  <span className="text-sm text-gray-900">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Environment</span>
                  <span className="text-sm text-gray-900">{health.environment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Version</span>
                  <span className="text-sm text-gray-900">{health.version}</span>
                </div>
              </div>
            </div>

            {/* Service Checks */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Service Checks</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.database.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-600">Database</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.database.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                      {health.checks.database.status}
                    </span>
                    <p className="text-xs text-gray-500">{health.checks.database.responseTime}ms</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.redis.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-600">Redis</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.redis.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                      {health.checks.redis.status}
                    </span>
                    <p className="text-xs text-gray-500">{health.checks.redis.responseTime}ms</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.memory.status === 'healthy' ? 'bg-green-500' : health.checks.memory.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-600">Memory</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.memory.status === 'healthy' ? 'text-green-600' : health.checks.memory.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {health.checks.memory.status}
                    </span>
                    <p className="text-xs text-gray-500">
                      {Math.round((health.checks.memory.usage.heapUsed / health.checks.memory.usage.heapTotal) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.disk.status === 'healthy' ? 'bg-green-500' : health.checks.disk.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-600">Disk</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.disk.status === 'healthy' ? 'text-green-600' : health.checks.disk.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {health.checks.disk.status}
                    </span>
                    <p className="text-xs text-gray-500">{health.checks.disk.usage.percentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'performance' && performance && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Metrics</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.totalRequests.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.averageResponseTime.toFixed(0)}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requests/Minute</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.requestsPerMinute.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold text-red-600">{performance.errorRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Slowest Requests</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {performance.slowestRequests.slice(0, 10).map((request, index) => (
                      <tr key={index}>
                        <td className="text-sm text-gray-900">{request.url}</td>
                        <td className="text-sm text-gray-900">{request.method}</td>
                        <td className="text-sm font-medium text-red-600">{request.responseTime}ms</td>
                        <td className="text-sm text-gray-500">{new Date(request.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'errors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errorStats && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Error Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Errors</p>
                    <p className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                    <p className="text-2xl font-bold text-green-600">{errorStats.resolutionRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Errors by Level</p>
                    <div className="space-y-2">
                      {Object.entries(errorStats.errorsByLevel).map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{level}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Errors</h3>
              <div className="space-y-3">
                {errorStats?.topErrors.slice(0, 10).map((error, index) => (
                  <div key={error.id} className="border-l-4 border-red-500 pl-4">
                    <p className="text-sm font-medium text-gray-900">{error.message}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500 capitalize">{error.level}</span>
                      <span className="text-xs text-gray-500">{error.occurrences} occurrences</span>
                      <span className="text-xs text-gray-500">{new Date(error.lastSeen).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Alerts</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm opacity-75">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-white bg-opacity-75">
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && engagement && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Engagement</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Daily Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{engagement.dailyActiveUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Weekly Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{engagement.weeklyActiveUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{engagement.monthlyActiveUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{engagement.averageSessionDuration}m</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Metrics</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Courses per User</p>
                  <p className="text-2xl font-bold text-gray-900">{engagement.coursesPerUser}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Lessons per Session</p>
                  <p className="text-2xl font-bold text-gray-900">{engagement.lessonsPerSession}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{engagement.completionRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                  <p className="text-2xl font-bold text-primary-600">{engagement.retentionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
