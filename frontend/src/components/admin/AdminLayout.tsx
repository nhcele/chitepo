import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../Header';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon },
  { name: 'Analytics & Reports', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Course Management', href: '/admin/courses', icon: AcademicCapIcon },
  { name: 'Cohort Mentoring', href: '/admin/cohort-mentoring', icon: UserGroupIcon },
  { name: 'Onboarding Flows', href: '/admin/onboarding', icon: ClipboardDocumentListIcon },
  { name: 'Instructor Management', href: '/admin/instructor-applications', icon: UserGroupIcon },
  { name: 'Approval Queue', href: '/admin/approval-queue', icon: ShieldCheckIcon },
  { name: 'Compliance Monitoring', href: '/admin/compliance-monitoring', icon: ClipboardDocumentListIcon },
  { name: 'Document Library', href: '/admin/document-library', icon: DocumentTextIcon },
  { name: 'Team Management', href: '/admin/team-management', icon: UsersIcon },
  { name: 'Success Metrics', href: '/admin/success-metrics', icon: ArrowTrendingUpIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const isDashboard = router.pathname === '/admin/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header */}
      <Header />
      
      {/* Admin Breadcrumb/Title Bar */}
      {!isDashboard && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
                {title && (
                  <div className="border-l border-gray-300 h-6"></div>
                )}
                <div>
                  {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
                  {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/exports"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Export Data
                </Link>
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hamburger button - always visible */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-20 left-4 z-50 p-2 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <Bars3Icon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          {sidebarOpen && (
            <>
              {/* Mobile overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
                onClick={() => setSidebarOpen(false)}
              />
              {/* Sidebar content */}
              <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg p-4 overflow-y-auto z-50 lg:relative lg:w-64 lg:flex-shrink-0 lg:shadow-none lg:rounded-lg transition-transform duration-300 ease-in-out">
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              </div>
            </>
          )}

          {/* Main Content */}
          <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : 'ml-0'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


