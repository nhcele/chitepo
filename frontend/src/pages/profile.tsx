import Head from 'next/head';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { updateMe } from '@/lib/api/users';
import {
  UserIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setJobTitle(user.jobTitle || '');
      setAvatar(user.avatar || '');
      setSkills((user.skillInterests || []).join(', '));
    }
  }, [user]);

  

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateMe({
        name,
        jobTitle,
        avatar,
        skillInterests: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      updateUser(updated);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || '');
      setJobTitle(user.jobTitle || '');
      setAvatar(user.avatar || '');
      setSkills((user.skillInterests || []).join(', '));
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Profile - Chitepo</title>
        <meta name="description" content="Manage your profile, update personal information, and customize your learning experience." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <UserIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Profile</h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Manage your account settings and personalize your learning experience.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}
          
          {!isLoading && !isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in required</h3>
              <p className="text-gray-600">Please sign in to view and edit your profile.</p>
            </motion.div>
          )}

          {!isLoading && isAuthenticated && user && (
            <div className="space-y-8">
              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-32"></div>
                <div className="relative px-6 pb-6">
                  <div className="flex items-end space-x-5 -mt-12">
                    <div className="relative">
                      <Image
                        src={user.avatar || '/default-avatar.png'}
                        alt={`${user.name}`}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700">
                          <CameraIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{user.name || 'Anonymous User'}</h2>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {user.role?.replace('_', ' ').toUpperCase()}
                            </span>
                            {jobTitle && (
                              <span className="ml-2 text-sm text-gray-600">{jobTitle}</span>
                            )}
                          </div>
                        </div>
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit Profile
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCancel}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              form="profile-form"
                              disabled={saving}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Profile Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    {error}
                  </motion.div>
                )}
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {success}
                  </motion.div>
                )}

                <form id="profile-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                          !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="Your full name"
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                          !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="e.g., Senior Quality Manager"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="https://example.com/avatar.jpg"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills & Interests</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="e.g., HACCP, BRC, Food Safety, Quality Management"
                      disabled={!isEditing}
                    />
                    <p className="mt-1 text-sm text-gray-500">Separate multiple skills with commas</p>
                  </div>

                  {skills && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {skills.split(',').map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
