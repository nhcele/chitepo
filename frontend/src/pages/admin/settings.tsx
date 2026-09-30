import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import { UserRole } from '@mindelta/shared';
import { apiClient } from '@/lib/api/client';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';

type SettingsResponse = { settings: Record<string, any> };

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({
    'feature.aiCompanionEnabled': true,
    'feature.assessmentsEnabled': true,
    'feature.analyticsEnabled': true,
    'feature.preDownloadEnabled': false,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<SettingsResponse>('/admin/settings');
        setSettings(res.settings || {});
      } catch (e: any) {
        setError(e?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setFlag = (key: string, value: boolean) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiClient.patch('/admin/settings', { settings });
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const featureFlags = [
    {
      key: 'feature.aiCompanionEnabled',
      label: 'AI Companion',
      description: 'Enable AI-powered learning companion for personalized assistance',
      icon: SparklesIcon,
      color: 'text-terracotta-600'
    },
    {
      key: 'feature.assessmentsEnabled',
      label: 'Assessments',
      description: 'Allow instructors to create quizzes and assessments',
      icon: DocumentCheckIcon,
      color: 'text-primary-600'
    },
    {
      key: 'feature.analyticsEnabled',
      label: 'Analytics',
      description: 'Track user engagement and course performance metrics',
      icon: ChartBarIcon,
      color: 'text-forest-600'
    },
    {
      key: 'feature.preDownloadEnabled',
      label: 'Pre-download Lessons',
      description: 'Allow users to download lessons for offline viewing',
      icon: CloudArrowDownIcon,
      color: 'text-forest-600'
    }
  ];

  return (
    <>
      <Head>
        <title>Settings - Admin Dashboard - Chitepo</title>
        <meta name="description" content="Configure platform settings, feature flags, and system preferences." />
      </Head>
      <Layout>
        <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-forest-100 to-forest-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <Cog6ToothIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-charcoal mb-4">Platform Settings</h1>
                <p className="text-xl text-stone mb-8 max-w-2xl mx-auto">
                  Configure feature flags, system preferences, and platform behavior.
                </p>
                <div className="flex items-center justify-center gap-4">
                  {saved && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center text-forest-600"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Settings Saved
                    </motion.div>
                  )}
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors ${
                      saving
                        ? 'bg-stone text-stone cursor-not-allowed'
                        : 'text-white bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-terracotta-100 border border-terracotta-400 text-terracotta-700 rounded-md flex items-center"
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                {error}
              </motion.div>
            )}

            {loading && (
              <div className="mb-6 p-4 bg-primary-100 border border-forest-400 text-primary-700 rounded-md">
                Loading settings...
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Feature Flags */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-md shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-charcoal mb-6">Feature Flags</h2>
                  <div className="space-y-4">
                    {featureFlags.map((flag, index) => (
                      <motion.div
                        key={flag.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-4 p-4 border border-border/60 rounded-md hover:border-border/60 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <flag.icon className={`h-6 w-6 ${flag.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-charcoal">{flag.label}</h3>
                              <p className="text-sm text-stone mt-1">{flag.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!settings[flag.key]}
                                onChange={e => setFlag(flag.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-forest-100 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-md">
                    <p className="text-sm text-primary-800">
                      <strong>Note:</strong> Feature flag changes apply immediately for new user sessions. 
                      Existing sessions may need to refresh to see changes.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* General Settings */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-md shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-charcoal mb-4">General Settings</h2>
                  <div className="space-y-4">
                    <div className="p-4 border border-border/60 rounded-md">
                      <h3 className="text-sm font-medium text-charcoal mb-2">Email Configuration</h3>
                      <p className="text-sm text-stone">SMTP settings and email templates</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ochre-100 text-ochre-800 mt-2">
                        Coming Soon
                      </span>
                    </div>
                    <div className="p-4 border border-border/60 rounded-md">
                      <h3 className="text-sm font-medium text-charcoal mb-2">Usage Quotas</h3>
                      <p className="text-sm text-stone">Set limits for courses, users, and storage</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ochre-100 text-ochre-800 mt-2">
                        Coming Soon
                      </span>
                    </div>
                    <div className="p-4 border border-border/60 rounded-md">
                      <h3 className="text-sm font-medium text-charcoal mb-2">Certificate Templates</h3>
                      <p className="text-sm text-stone">Customize completion certificates</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ochre-100 text-ochre-800 mt-2">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </RoleGuard>
      </Layout>
    </>
  );
}
