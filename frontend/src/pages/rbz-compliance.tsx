import Head from 'next/head';
import Layout from '@/components/Layout';
import { useState } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellAlertIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Mock data for demonstration
const complianceStats = {
  overallCompliance: 87,
  totalEmployees: 245,
  compliantEmployees: 213,
  nonCompliantEmployees: 32,
  upcomingDeadlines: 15,
  criticalAlerts: 3,
};

const roleComplianceData = [
  { role: 'Teller', total: 85, compliant: 80, percentage: 94, status: 'good' },
  { role: 'Branch Manager', total: 22, compliant: 22, percentage: 100, status: 'excellent' },
  { role: 'Compliance Officer', total: 8, compliant: 6, percentage: 75, status: 'warning' },
  { role: 'Credit Analyst', total: 35, compliant: 30, percentage: 86, status: 'good' },
  { role: 'IT Staff', total: 28, compliant: 22, percentage: 79, status: 'warning' },
  { role: 'Executive', total: 12, compliant: 12, percentage: 100, status: 'excellent' },
];

const upcomingDeadlines = [
  {
    id: 1,
    employee: 'John Mutasa',
    role: 'Teller',
    course: 'AML and KYC Fundamentals',
    deadline: '2026-02-15',
    daysLeft: 25,
    status: 'warning',
  },
  {
    id: 2,
    employee: 'Sarah Ncube',
    role: 'Compliance Officer',
    course: 'Information Security Awareness',
    deadline: '2026-02-01',
    daysLeft: 11,
    status: 'critical',
  },
  {
    id: 3,
    employee: 'David Moyo',
    role: 'Credit Analyst',
    course: 'Credit Risk Fundamentals',
    deadline: '2026-02-20',
    daysLeft: 30,
    status: 'ok',
  },
];

const criticalAlerts = [
  {
    id: 1,
    type: 'Overdue Training',
    message: '3 employees have overdue AML/KYC training - RBZ violation risk',
    severity: 'critical',
    action: 'Assign immediately',
  },
  {
    id: 2,
    type: 'Deadline Approaching',
    message: '15 employees must complete training within 30 days',
    severity: 'warning',
    action: 'Send reminders',
  },
  {
    id: 3,
    type: 'New Hire',
    message: '5 new employees require onboarding training within 90 days',
    severity: 'info',
    action: 'Auto-assign courses',
  },
];

const recentCertifications = [
  { employee: 'Grace Chikwava', role: 'Teller', course: 'Customer Service Excellence', date: '2026-01-20', score: 92 },
  { employee: 'Peter Dube', role: 'Manager', course: 'AML and KYC Fundamentals', date: '2026-01-19', score: 88 },
  { employee: 'Linda Sibanda', role: 'IT Staff', course: 'Information Security Awareness', date: '2026-01-18', score: 95 },
];

export default function RBZComplianceDashboard() {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  const companyName = 'Chitepo School of Ideology';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <BellAlertIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <>
      <Head>
        <title>{`RBZ Compliance Dashboard | ${companyName}`}</title>
        <meta name="description" content="Real-time RBZ compliance tracking and reporting for your banking institution" />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RBZ Compliance Dashboard</h1>
            <p className="text-gray-600">Real-time tracking of mandatory training compliance across all roles</p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Compliance</p>
                  <p className="text-3xl font-bold text-gray-900">{complianceStats.overallCompliance}%</p>
                </div>
                <ShieldCheckIcon className="h-12 w-12 text-green-500" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${complianceStats.overallCompliance}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Compliant Staff</p>
                  <p className="text-3xl font-bold text-gray-900">{complianceStats.compliantEmployees}</p>
                  <p className="text-xs text-gray-500">of {complianceStats.totalEmployees} total</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming Deadlines</p>
                  <p className="text-3xl font-bold text-gray-900">{complianceStats.upcomingDeadlines}</p>
                  <p className="text-xs text-gray-500">next 30 days</p>
                </div>
                <ClockIcon className="h-12 w-12 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Critical Alerts</p>
                  <p className="text-3xl font-bold text-gray-900">{complianceStats.criticalAlerts}</p>
                  <p className="text-xs text-gray-500">requires action</p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <BellAlertIcon className="h-6 w-6 mr-2 text-red-600" />
                Critical Alerts
              </h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {getSeverityIcon(alert.severity)}
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">{alert.type}</p>
                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      </div>
                    </div>
                    <button className="text-sm bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">
                      {alert.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role-Based Compliance */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <UserGroupIcon className="h-6 w-6 mr-2 text-primary-600" />
                Compliance by Role
              </h2>
              <button className="flex items-center text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export RBZ Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleComplianceData.map((roleData) => (
                    <tr key={roleData.role} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{roleData.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{roleData.total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {roleData.compliant} / {roleData.total}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${
                                roleData.percentage >= 90
                                  ? 'bg-green-500'
                                  : roleData.percentage >= 75
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${roleData.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{roleData.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                            roleData.status
                          )}`}
                        >
                          {roleData.status === 'excellent'
                            ? '✓ Excellent'
                            : roleData.status === 'good'
                            ? '✓ Good'
                            : '⚠ Needs Attention'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/users?role=${roleData.role.toLowerCase()}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-yellow-600" />
                Upcoming Deadlines (30 Days)
              </h2>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={`p-4 rounded-lg border ${
                      deadline.status === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : deadline.status === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{deadline.employee}</p>
                        <p className="text-sm text-gray-600">{deadline.role}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          deadline.status === 'critical'
                            ? 'bg-red-200 text-red-800'
                            : deadline.status === 'warning'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-green-200 text-green-800'
                        }`}
                      >
                        {deadline.daysLeft} days left
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{deadline.course}</p>
                    <p className="text-xs text-gray-500">Deadline: {deadline.deadline}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-semibold py-2">
                View All Deadlines →
              </button>
            </div>

            {/* Recent Certifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-green-600" />
                Recent Certifications
              </h2>
              <div className="space-y-4">
                {recentCertifications.map((cert, idx) => (
                  <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{cert.employee}</p>
                        <p className="text-sm text-gray-600">{cert.role}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-green-200 text-green-800">
                        Score: {cert.score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{cert.course}</p>
                    <p className="text-xs text-gray-500">Completed: {cert.date}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-semibold py-2">
                View All Certificates →
              </button>
            </div>
          </div>

          {/* RBZ Audit Report Section */}
          <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Generate RBZ Audit Report</h2>
                <p className="text-primary-100">
                  One-click compliance report with 5-year training records, completion rates, and certificates
                </p>
              </div>
              <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}


