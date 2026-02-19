import Head from 'next/head';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OfficialPosition {
  id: string;
  position: string;
  positionTitle: string;
  regionProvince: string;
  complianceStatus: string;
  startDate: string;
  complianceDeadline: string;
  gracePeriodEnd: string;
  requiredCertifications: string[];
  completedCertifications: string[];
}

interface ComplianceCheck {
  position: {
    id: string;
    positionType: string;
    positionTitle: string;
    regionProvince: string;
  };
  complianceStatus: string;
  isCompliant: boolean;
  requiredCertifications: number;
  completedCertifications: number;
  missingCertifications: number;
  complianceDeadline: string;
  gracePeriodEnd: string;
  daysUntilDeadline: number;
}

interface Alert {
  id: string;
  alertType: string;
  message: string;
  severity: string;
  dueDate: string;
  isRead: boolean;
  createdAt: string;
}

const statusColors = {
  compliant: 'bg-green-100 text-green-800 border-green-300',
  non_compliant: 'bg-red-100 text-red-800 border-red-300',
  grace_period: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  exempted: 'bg-blue-100 text-blue-800 border-blue-300',
  pending_verification: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusIcons = {
  compliant: CheckCircleIcon,
  non_compliant: XCircleIcon,
  grace_period: ClockIcon,
  exempted: ShieldCheckIcon,
  pending_verification: ExclamationTriangleIcon,
};

const statusLabels = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  grace_period: 'Grace Period',
  exempted: 'Exempted',
  pending_verification: 'Pending Verification',
};

const severityColors = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

export default function ComplianceDashboardPage() {
  const [positions, setPositions] = useState<OfficialPosition[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<Record<string, ComplianceCheck>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);

      // Fetch positions
      const positionsRes = await fetch('/api/compliance/positions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        setPositions(positionsData);

        // Fetch compliance check for each position
        const checks: Record<string, ComplianceCheck> = {};
        for (const position of positionsData) {
          const checkRes = await fetch(`/api/compliance/positions/${position.id}/check`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            checks[position.id] = checkData;
          }
        }
        setComplianceChecks(checks);
      }

      // Fetch alerts
      const alertsRes = await fetch('/api/compliance/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/compliance/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
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

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (positions.length === 0) {
    return (
      <Layout>
        <Head>
          <title>Compliance Dashboard - Chitepo School of Ideology</title>
        </Head>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Official Positions Registered</h3>
            <p className="text-gray-600 mb-6">
              You don't have any official positions requiring mandatory training.
            </p>
            <Link
              href="/government-officials"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Learn About Government Training
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate overall compliance
  const totalPositions = positions.length;
  const compliantPositions = positions.filter(p => p.complianceStatus === 'compliant').length;
  const nonCompliantPositions = positions.filter(p => p.complianceStatus === 'non_compliant').length;
  const gracePeriodPositions = positions.filter(p => p.complianceStatus === 'grace_period').length;

  return (
    <Layout>
      <Head>
        <title>Compliance Dashboard - Chitepo School of Ideology</title>
        <meta name="description" content="Track your mandatory training compliance status" />
      </Head>

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Compliance Dashboard</h1>
              <p className="text-xl text-purple-100">Mandatory Training Status</p>
            </div>
            <ShieldCheckIcon className="h-20 w-20 text-white/30" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Positions</p>
            <p className="text-3xl font-bold text-gray-900">{totalPositions}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Compliant</p>
            <p className="text-3xl font-bold text-green-600">{compliantPositions}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Grace Period</p>
            <p className="text-3xl font-bold text-yellow-600">{gracePeriodPositions}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Non-Compliant</p>
            <p className="text-3xl font-bold text-red-600">{nonCompliantPositions}</p>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <BellAlertIcon className="h-7 w-7 mr-2 text-orange-500" />
              Active Alerts ({alerts.filter(a => !a.isRead).length} unread)
            </h2>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${severityColors[alert.severity as keyof typeof severityColors]} ${alert.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{alert.message}</p>
                      <p className="text-sm">
                        {alert.dueDate && (
                          <span>Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                        )}
                        <span className="ml-4 text-xs opacity-75">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    {!alert.isRead && (
                      <button
                        onClick={() => markAlertAsRead(alert.id)}
                        className="ml-4 text-sm font-medium hover:underline"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positions List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Official Positions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {positions.map((position) => {
              const check = complianceChecks[position.id];
              if (!check) return null;

              const StatusIcon = statusIcons[check.complianceStatus as keyof typeof statusIcons] || ExclamationTriangleIcon;
              const statusColor = statusColors[check.complianceStatus as keyof typeof statusColors] || statusColors.pending_verification;
              const statusLabel = statusLabels[check.complianceStatus as keyof typeof statusLabels] || 'Unknown';

              return (
                <div key={position.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{position.positionTitle}</h3>
                        <p className="text-sm text-gray-600">{position.regionProvince}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Training Progress</span>
                          <span className="font-medium">
                            {check.completedCertifications}/{check.requiredCertifications}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${check.isCompliant ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${(check.completedCertifications / check.requiredCertifications) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Deadline */}
                      {check.daysUntilDeadline !== null && (
                        <div className="flex items-center text-sm">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-600">
                            {check.daysUntilDeadline > 0 ? (
                              <span>
                                <span className="font-medium">{check.daysUntilDeadline} days</span> until deadline
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">Deadline passed</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Missing Certifications */}
                      {check.missingCertifications > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-3">
                          <p className="text-sm text-orange-800">
                            <span className="font-medium">{check.missingCertifications} certification(s)</span> required to achieve compliance
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                      <Link
                        href="/my-certifications"
                        className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                      >
                        View Required Training
                      </Link>
                      <Link
                        href="/training-calendar"
                        className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                      >
                        Enroll in Cohort
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help with Compliance?</h3>
          <p className="text-gray-700 mb-4">
            Contact your regional training coordinator or visit our help center for guidance on completing your mandatory training requirements.
          </p>
          <div className="flex gap-4">
            <Link
              href="/government-officials"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Training Requirements →
            </Link>
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

