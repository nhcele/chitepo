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
      case 'healthy': return 'text-forest-600 bg-forest-100';
      case 'unhealthy': return 'text-terracotta-600 bg-terracotta-100';
      case 'degraded': return 'text-ochre-600 bg-ochre-100';
      default: return 'text-stone bg-forest-100';
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
      case 'critical': return 'bg-terracotta-100 text-terracotta-800 border-terracotta-200';
      case 'high': return 'bg-ochre-100 text-ochre-800 border-ochre-200';
      case 'medium': return 'bg-ochre-100 text-ochre-800 border-ochre-200';
      case 'low': return 'bg-primary-100 text-primary-800 border-primary-200';
      default: return 'bg-forest-100 text-charcoal border-border/60';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | number) => {
    if (typeof trend === 'number') {
      return trend > 0 ? <ArrowTrendingUpIcon className="h-4 w-4 text-forest-600" /> : 
             trend < 0 ? <ArrowTrendingDownIcon className="h-4 w-4 text-terracotta-600" /> :
             <MinusIcon className="h-4 w-4 text-stone" />;
    }
    return trend === 'up' ? <ArrowTrendingUpIcon className="h-4 w-4 text-forest-600" /> :
           trend === 'down' ? <ArrowTrendingDownIcon className="h-4 w-4 text-terracotta-600" /> :
           <MinusIcon className="h-4 w-4 text-stone" />;
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
          <h1 className="text-2xl font-bold text-charcoal">Monitoring Dashboard</h1>
          <p className="text-stone">Real-time system monitoring and analytics</p>
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
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border/60">
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
                  : 'border-transparent text-stone hover:text-charcoal hover:border-border/60'
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
                <div className="bg-white p-6 rounded-md shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-stone">Total Users</p>
                      <p className="text-2xl font-bold text-charcoal">{overview.totalUsers.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon(overview.monthlyGrowthRate)}
                        <span className="text-sm text-stone ml-1">{overview.monthlyGrowthRate}% growth</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-forest-100 rounded-md p-3">
                      <AcademicCapIcon className="h-6 w-6 text-forest-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-stone">Completion Rate</p>
                      <p className="text-2xl font-bold text-charcoal">{overview.completionRate.toFixed(1)}%</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon('up')}
                        <span className="text-sm text-stone ml-1">On track</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-ochre-100 rounded-md p-3">
                      <CurrencyDollarIcon className="h-6 w-6 text-ochre-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-stone">Total Revenue</p>
                      <p className="text-2xl font-bold text-charcoal">${overview.totalRevenue.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon('up')}
                        <span className="text-sm text-stone ml-1">Growing</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-terracotta-100 rounded-md p-3">
                      <ServerIcon className="h-6 w-6 text-terracotta-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-stone">System Status</p>
                      <p className="text-2xl font-bold text-charcoal capitalize">{health?.status || 'Unknown'}</p>
                      <div className="flex items-center mt-1">
                        {health && getStatusIcon(health.status)}
                        <span className="text-sm text-stone ml-1">{health?.summary.failedChecks || 0} issues</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-md shadow">
              <div className="px-6 py-4 border-b border-border/60">
                <h3 className="text-lg font-medium text-charcoal">Recent Alerts</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-md border ${getSeverityColor(alert.severity)}`}>
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
            <div className="bg-white rounded-md shadow">
              <div className="px-6 py-4 border-b border-border/60">
                <h3 className="text-lg font-medium text-charcoal">System Health</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone">Overall Status</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(health.status)}`}>
                    {getStatusIcon(health.status)}
                    <span className="text-sm font-medium capitalize">{health.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone">Uptime</span>
                  <span className="text-sm text-charcoal">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone">Environment</span>
                  <span className="text-sm text-charcoal">{health.environment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone">Version</span>
                  <span className="text-sm text-charcoal">{health.version}</span>
                </div>
              </div>
            </div>

            {/* Service Checks */}
            <div className="bg-white rounded-md shadow">
              <div className="px-6 py-4 border-b border-border/60">
                <h3 className="text-lg font-medium text-charcoal">Service Checks</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.database.status === 'healthy' ? 'bg-forest-500' : 'bg-terracotta-500'}`}></div>
                    <span className="text-sm font-medium text-stone">Database</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.database.status === 'healthy' ? 'text-forest-600' : 'text-terracotta-600'}`}>
                      {health.checks.database.status}
                    </span>
                    <p className="text-xs text-stone">{health.checks.database.responseTime}ms</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.redis.status === 'healthy' ? 'bg-forest-500' : 'bg-terracotta-500'}`}></div>
                    <span className="text-sm font-medium text-stone">Redis</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.redis.status === 'healthy' ? 'text-forest-600' : 'text-terracotta-600'}`}>
                      {health.checks.redis.status}
                    </span>
                    <p className="text-xs text-stone">{health.checks.redis.responseTime}ms</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.memory.status === 'healthy' ? 'bg-forest-500' : health.checks.memory.status === 'degraded' ? 'bg-ochre-500' : 'bg-terracotta-500'}`}></div>
                    <span className="text-sm font-medium text-stone">Memory</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.memory.status === 'healthy' ? 'text-forest-600' : health.checks.memory.status === 'degraded' ? 'text-ochre-600' : 'text-terracotta-600'}`}>
                      {health.checks.memory.status}
                    </span>
                    <p className="text-xs text-stone">
                      {Math.round((health.checks.memory.usage.heapUsed / health.checks.memory.usage.heapTotal) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${health.checks.disk.status === 'healthy' ? 'bg-forest-500' : health.checks.disk.status === 'degraded' ? 'bg-ochre-500' : 'bg-terracotta-500'}`}></div>
                    <span className="text-sm font-medium text-stone">Disk</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${health.checks.disk.status === 'healthy' ? 'text-forest-600' : health.checks.disk.status === 'degraded' ? 'text-ochre-600' : 'text-terracotta-600'}`}>
                      {health.checks.disk.status}
                    </span>
                    <p className="text-xs text-stone">{health.checks.disk.usage.percentage}%</p>
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
            <div className="bg-white p-6 rounded-md shadow">
              <h3 className="text-lg font-medium text-charcoal mb-4">Request Metrics</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-stone">Total Requests</p>
                  <p className="text-2xl font-bold text-charcoal">{performance.totalRequests.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Avg Response Time</p>
                  <p className="text-2xl font-bold text-charcoal">{performance.averageResponseTime.toFixed(0)}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Requests/Minute</p>
                  <p className="text-2xl font-bold text-charcoal">{performance.requestsPerMinute.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Error Rate</p>
                  <p className="text-2xl font-bold text-terracotta-600">{performance.errorRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-md shadow lg:col-span-2">
              <h3 className="text-lg font-medium text-charcoal mb-4">Slowest Requests</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-stone uppercase tracking-wider">Endpoint</th>
                      <th className="text-left text-xs font-medium text-stone uppercase tracking-wider">Method</th>
                      <th className="text-left text-xs font-medium text-stone uppercase tracking-wider">Response Time</th>
                      <th className="text-left text-xs font-medium text-stone uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {performance.slowestRequests.slice(0, 10).map((request, index) => (
                      <tr key={index}>
                        <td className="text-sm text-charcoal">{request.url}</td>
                        <td className="text-sm text-charcoal">{request.method}</td>
                        <td className="text-sm font-medium text-terracotta-600">{request.responseTime}ms</td>
                        <td className="text-sm text-stone">{new Date(request.timestamp).toLocaleTimeString()}</td>
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
              <div className="bg-white p-6 rounded-md shadow">
                <h3 className="text-lg font-medium text-charcoal mb-4">Error Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-stone">Total Errors</p>
                    <p className="text-2xl font-bold text-terracotta-600">{errorStats.totalErrors}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone">Resolution Rate</p>
                    <p className="text-2xl font-bold text-forest-600">{errorStats.resolutionRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone mb-2">Errors by Level</p>
                    <div className="space-y-2">
                      {Object.entries(errorStats.errorsByLevel).map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <span className="text-sm text-stone capitalize">{level}</span>
                          <span className="text-sm font-medium text-charcoal">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-md shadow">
              <h3 className="text-lg font-medium text-charcoal mb-4">Top Errors</h3>
              <div className="space-y-3">
                {errorStats?.topErrors.slice(0, 10).map((error, index) => (
                  <div key={error.id} className="border-l-4 border-terracotta-500 pl-4">
                    <p className="text-sm font-medium text-charcoal">{error.message}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-stone capitalize">{error.level}</span>
                      <span className="text-xs text-stone">{error.occurrences} occurrences</span>
                      <span className="text-xs text-stone">{new Date(error.lastSeen).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Alerts */}
          <div className="bg-white rounded-md shadow">
            <div className="px-6 py-4 border-b border-border/60">
              <h3 className="text-lg font-medium text-charcoal">All Alerts</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-center justify-between p-4 rounded-md border ${getSeverityColor(alert.severity)}`}>
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
            <div className="bg-white p-6 rounded-md shadow">
              <h3 className="text-lg font-medium text-charcoal mb-4">User Engagement</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-stone">Daily Active Users</p>
                  <p className="text-2xl font-bold text-charcoal">{engagement.dailyActiveUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Weekly Active Users</p>
                  <p className="text-2xl font-bold text-charcoal">{engagement.weeklyActiveUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Monthly Active Users</p>
                  <p className="text-2xl font-bold text-charcoal">{engagement.monthlyActiveUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Avg Session Duration</p>
                  <p className="text-2xl font-bold text-charcoal">{engagement.averageSessionDuration}m</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-md shadow">
              <h3 className="text-lg font-medium text-charcoal mb-4">Learning Metrics</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-stone">Courses per User</p>
                  <p className="text-2xl font-bold text-charcoal">{engagement.coursesPerUser}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Lessons per Session</p>
                  <p className="text-2xl font-bold text-charcoal">{engagement.lessonsPerSession}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Completion Rate</p>
                  <p className="text-2xl font-bold text-forest-600">{engagement.completionRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone">Retention Rate</p>
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
