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
        return 'bg-forest-100 text-forest-800 border-forest-300';
      case 'good':
        return 'bg-forest-100 text-forest-800 border-forest-300';
      case 'warning':
        return 'bg-ochre-100 text-ochre-800 border-ochre-300';
      case 'critical':
        return 'bg-terracotta-100 text-terracotta-800 border-terracotta-300';
      default:
        return 'bg-forest-100 text-charcoal border-border/60';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-terracotta-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-ochre-600" />;
      default:
        return <BellAlertIcon className="h-5 w-5 text-forest-600" />;
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
            <h1 className="text-3xl font-bold text-charcoal mb-2">RBZ Compliance Dashboard</h1>
            <p className="text-stone">Real-time tracking of mandatory training compliance across all roles</p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-forest-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Overall Compliance</p>
                  <p className="text-3xl font-bold text-charcoal">{complianceStats.overallCompliance}%</p>
                </div>
                <ShieldCheckIcon className="h-12 w-12 text-forest-500" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-forest-100 rounded-full h-2">
                  <div
                    className="bg-forest-500 h-2 rounded-full"
                    style={{ width: `${complianceStats.overallCompliance}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-forest-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Compliant Staff</p>
                  <p className="text-3xl font-bold text-charcoal">{complianceStats.compliantEmployees}</p>
                  <p className="text-xs text-stone">of {complianceStats.totalEmployees} total</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-forest-500" />
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-ochre-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Upcoming Deadlines</p>
                  <p className="text-3xl font-bold text-charcoal">{complianceStats.upcomingDeadlines}</p>
                  <p className="text-xs text-stone">next 30 days</p>
                </div>
                <ClockIcon className="h-12 w-12 text-ochre-500" />
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-terracotta-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone mb-1">Critical Alerts</p>
                  <p className="text-3xl font-bold text-charcoal">{complianceStats.criticalAlerts}</p>
                  <p className="text-xs text-stone">requires action</p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-terracotta-500" />
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-charcoal flex items-center">
                <BellAlertIcon className="h-6 w-6 mr-2 text-terracotta-600" />
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
                  className={`p-4 rounded-md border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-terracotta-50 border-terracotta-500'
                      : alert.severity === 'warning'
                      ? 'bg-ochre-50 border-ochre-500'
                      : 'bg-forest-50 border-forest-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {getSeverityIcon(alert.severity)}
                      <div className="ml-3">
                        <p className="font-semibold text-charcoal">{alert.type}</p>
                        <p className="text-sm text-charcoal mt-1">{alert.message}</p>
                      </div>
                    </div>
                    <button className="text-sm bg-white px-4 py-2 rounded-md border border-border/60 hover:bg-paper font-medium">
                      {alert.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role-Based Compliance */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal flex items-center">
                <UserGroupIcon className="h-6 w-6 mr-2 text-primary-600" />
                Compliance by Role
              </h2>
              <button className="flex items-center text-sm bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-semibold">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export RBZ Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60">
                <thead className="bg-paper">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Total Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Compliant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Compliance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border/60">
                  {roleComplianceData.map((roleData) => (
                    <tr key={roleData.role} className="hover:bg-paper">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-charcoal">{roleData.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-charcoal">{roleData.total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-charcoal">
                          {roleData.compliant} / {roleData.total}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-forest-100 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${
                                roleData.percentage >= 90
                                  ? 'bg-forest-500'
                                  : roleData.percentage >= 75
                                  ? 'bg-forest-500'
                                  : 'bg-ochre-500'
                              }`}
                              style={{ width: `${roleData.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-charcoal">{roleData.percentage}%</span>
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
            <div className="bg-white rounded-md shadow-sm p-6">
              <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-ochre-600" />
                Upcoming Deadlines (30 Days)
              </h2>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={`p-4 rounded-md border ${
                      deadline.status === 'critical'
                        ? 'bg-terracotta-50 border-terracotta-200'
                        : deadline.status === 'warning'
                        ? 'bg-ochre-50 border-ochre-200'
                        : 'bg-forest-50 border-forest-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-charcoal">{deadline.employee}</p>
                        <p className="text-sm text-stone">{deadline.role}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          deadline.status === 'critical'
                            ? 'bg-terracotta-200 text-terracotta-800'
                            : deadline.status === 'warning'
                            ? 'bg-ochre-200 text-ochre-800'
                            : 'bg-forest-200 text-forest-800'
                        }`}
                      >
                        {deadline.daysLeft} days left
                      </span>
                    </div>
                    <p className="text-sm text-charcoal mb-2">{deadline.course}</p>
                    <p className="text-xs text-stone">Deadline: {deadline.deadline}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-semibold py-2">
                View All Deadlines →
              </button>
            </div>

            {/* Recent Certifications */}
            <div className="bg-white rounded-md shadow-sm p-6">
              <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-forest-600" />
                Recent Certifications
              </h2>
              <div className="space-y-4">
                {recentCertifications.map((cert, idx) => (
                  <div key={idx} className="p-4 bg-forest-50 rounded-md border border-forest-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-charcoal">{cert.employee}</p>
                        <p className="text-sm text-stone">{cert.role}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-forest-200 text-forest-800">
                        Score: {cert.score}%
                      </span>
                    </div>
                    <p className="text-sm text-charcoal mb-1">{cert.course}</p>
                    <p className="text-xs text-stone">Completed: {cert.date}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-semibold py-2">
                View All Certificates →
              </button>
            </div>
          </div>

          {/* RBZ Audit Report Section */}
          <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-md shadow-sm p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Generate RBZ Audit Report</h2>
                <p className="text-primary-100">
                  One-click compliance report with 5-year training records, completion rates, and certificates
                </p>
              </div>
              <button className="bg-white text-primary-600 px-6 py-3 rounded-md font-semibold hover:bg-forest-100 transition-colors flex items-center">
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


