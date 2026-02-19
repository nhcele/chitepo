import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  uptime: string;
  responseTime: string;
}

const services: ServiceStatus[] = [
  {
    name: 'Platform Website',
    status: 'operational',
    uptime: '99.98%',
    responseTime: '245ms',
  },
  {
    name: 'Video Streaming',
    status: 'operational',
    uptime: '99.95%',
    responseTime: '180ms',
  },
  {
    name: 'API Services',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '120ms',
  },
  {
    name: 'Mobile App',
    status: 'operational',
    uptime: '99.97%',
    responseTime: '200ms',
  },
  {
    name: 'Payment Gateway',
    status: 'operational',
    uptime: '99.96%',
    responseTime: '350ms',
  },
  {
    name: 'AI Companion',
    status: 'operational',
    uptime: '99.92%',
    responseTime: '450ms',
  },
];

const incidents = [
  {
    date: 'January 15, 2025',
    title: 'Scheduled Maintenance',
    description: 'Database optimization and security updates completed successfully.',
    status: 'resolved',
    duration: '2 hours',
  },
  {
    date: 'January 8, 2025',
    title: 'Video Streaming Degradation',
    description: 'Some users experienced slower video loading times. Issue resolved by scaling infrastructure.',
    status: 'resolved',
    duration: '45 minutes',
  },
];

const upcomingMaintenance = [
  {
    date: 'February 1, 2025',
    time: '02:00 AM - 04:00 AM CAT',
    title: 'Platform Upgrade',
    description: 'We will be upgrading our infrastructure to improve performance and reliability.',
  },
];

export default function Status() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'outage':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'outage':
        return 'Service Outage';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'outage':
        return 'text-red-600';
      case 'maintenance':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const allOperational = services.every(service => service.status === 'operational');

  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              System Status
            </h1>
            <p className="text-xl text-gray-600">
              Current status of all Chitepo platform services
            </p>
          </div>

          <div className={`rounded-lg p-8 mb-12 ${
            allOperational ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
            <div className="flex items-center justify-center">
              {allOperational ? (
                <>
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      All Systems Operational
                    </h2>
                    <p className="text-gray-600">
                      All services are running smoothly
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Some Services Affected
                    </h2>
                    <p className="text-gray-600">
                      We're working to resolve the issues
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Service Status
              </h2>
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center flex-1">
                    {getStatusIcon(service.status)}
                    <span className="ml-3 font-semibold text-gray-900">
                      {service.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Uptime</div>
                      <div className="font-semibold text-gray-900">{service.uptime}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Response Time</div>
                      <div className="font-semibold text-gray-900">{service.responseTime}</div>
                    </div>
                    <div className={`font-semibold ${getStatusColor(service.status)} min-w-[140px] text-right`}>
                      {getStatusText(service.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {upcomingMaintenance.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Scheduled Maintenance
              </h2>
              <div className="space-y-4">
                {upcomingMaintenance.map((maintenance, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-start">
                      <ClockIcon className="h-6 w-6 text-blue-500 mr-3 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {maintenance.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {maintenance.date} • {maintenance.time}
                        </p>
                        <p className="text-gray-700">
                          {maintenance.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Incidents
            </h2>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident, index) => (
                  <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                    <div className="flex items-center mb-2">
                      <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                        {incident.status}
                      </span>
                      <span className="text-sm text-gray-500">{incident.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {incident.title}
                    </h3>
                    <p className="text-gray-600 mb-1">
                      {incident.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {incident.duration}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No recent incidents to report.</p>
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Subscribe to status updates
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Email Notifications
              </button>
              <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                SMS Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
