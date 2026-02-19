import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

interface NotificationFormData {
  // Email Notifications
  emailNewEnrollment: boolean;
  emailCourseReview: boolean;
  emailStudentMessage: boolean;
  emailPayoutUpdate: boolean;
  emailWeeklyDigest: boolean;
  emailPlatformUpdates: boolean;
  
  // In-App Notifications
  inAppNewEnrollment: boolean;
  inAppCourseReview: boolean;
  inAppStudentMessage: boolean;
  inAppPayoutUpdate: boolean;
  inAppCourseMilestone: boolean;
  
  // Push Notifications
  pushNewEnrollment: boolean;
  pushStudentMessage: boolean;
  pushCourseMilestone: boolean;
  
  // Notification Frequency
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  digestDay: 'monday' | 'wednesday' | 'friday';
  digestTime: string;
}

interface NotificationSettingsProps {
  initialData?: Partial<NotificationFormData>;
  onSave: (data: NotificationFormData) => Promise<void>;
  loading?: boolean;
}

export default function NotificationSettings({ 
  initialData, 
  onSave, 
  loading = false 
}: NotificationSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<NotificationFormData>({
    defaultValues: {
      emailNewEnrollment: initialData?.emailNewEnrollment ?? true,
      emailCourseReview: initialData?.emailCourseReview ?? true,
      emailStudentMessage: initialData?.emailStudentMessage ?? true,
      emailPayoutUpdate: initialData?.emailPayoutUpdate ?? true,
      emailWeeklyDigest: initialData?.emailWeeklyDigest ?? true,
      emailPlatformUpdates: initialData?.emailPlatformUpdates ?? false,
      
      inAppNewEnrollment: initialData?.inAppNewEnrollment ?? true,
      inAppCourseReview: initialData?.inAppCourseReview ?? true,
      inAppStudentMessage: initialData?.inAppStudentMessage ?? true,
      inAppPayoutUpdate: initialData?.inAppPayoutUpdate ?? true,
      inAppCourseMilestone: initialData?.inAppCourseMilestone ?? true,
      
      pushNewEnrollment: initialData?.pushNewEnrollment ?? false,
      pushStudentMessage: initialData?.pushStudentMessage ?? false,
      pushCourseMilestone: initialData?.pushCourseMilestone ?? false,
      
      emailFrequency: initialData?.emailFrequency ?? 'daily',
      digestDay: initialData?.digestDay ?? 'friday',
      digestTime: initialData?.digestTime ?? '09:00'
    }
  });

  const watchEmailFrequency = watch('emailFrequency');

  const handleSave = async (data: NotificationFormData) => {
    try {
      await onSave(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const handleCancel = () => {
    reset(initialData);
    setIsEditing(false);
  };

  const notificationCategories = [
    {
      title: 'Email Notifications',
      icon: EnvelopeIcon,
      description: 'Receive updates via email',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      fields: [
        { key: 'emailNewEnrollment', label: 'New student enrollment', description: 'When someone enrolls in your course' },
        { key: 'emailCourseReview', label: 'Course reviews', description: 'When students leave reviews' },
        { key: 'emailStudentMessage', label: 'Student messages', description: 'When students send you messages' },
        { key: 'emailPayoutUpdate', label: 'Payout updates', description: 'Payment and revenue notifications' },
        { key: 'emailWeeklyDigest', label: 'Weekly digest', description: 'Summary of your weekly activity' },
        { key: 'emailPlatformUpdates', label: 'Platform updates', description: 'New features and announcements' }
      ]
    },
    {
      title: 'In-App Notifications',
      icon: ChatBubbleLeftRightIcon,
      description: 'Show notifications in your dashboard',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      fields: [
        { key: 'inAppNewEnrollment', label: 'New student enrollment', description: 'Real-time enrollment alerts' },
        { key: 'inAppCourseReview', label: 'Course reviews', description: 'New review notifications' },
        { key: 'inAppStudentMessage', label: 'Student messages', description: 'Message notifications' },
        { key: 'inAppPayoutUpdate', label: 'Payout updates', description: 'Revenue and payment alerts' },
        { key: 'inAppCourseMilestone', label: 'Course milestones', description: 'Achievement notifications' }
      ]
    },
    {
      title: 'Push Notifications',
      icon: DevicePhoneMobileIcon,
      description: 'Mobile push notifications',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      fields: [
        { key: 'pushNewEnrollment', label: 'New student enrollment', description: 'Instant enrollment alerts' },
        { key: 'pushStudentMessage', label: 'Student messages', description: 'Urgent message notifications' },
        { key: 'pushCourseMilestone', label: 'Course milestones', description: 'Achievement celebrations' }
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BellIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              <p className="text-sm text-gray-500">Manage how you receive updates</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              Configure
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSubmit(handleSave)}
                disabled={loading || !isDirty}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-1" />
                )}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
          {notificationCategories.map((category) => (
            <div key={category.title} className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${category.bgColor} rounded-lg`}>
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{category.title}</h4>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>

              <div className="ml-8 space-y-3">
                {category.fields.map((field) => (
                  <div key={field.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={field.key}
                      {...register(field.key as keyof NotificationFormData)}
                      disabled={!isEditing}
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={field.key}
                        className={`text-sm font-medium ${isEditing ? 'text-gray-900' : 'text-gray-700'}`}
                      >
                        {field.label}
                      </label>
                      <p className="text-xs text-gray-500">{field.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Email Frequency Settings */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ComputerDesktopIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">Email Frequency</h4>
                <p className="text-sm text-gray-500">How often you receive email notifications</p>
              </div>
            </div>

            <div className="ml-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digest Frequency
                </label>
                <select
                  {...register('emailFrequency')}
                  disabled={!isEditing}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>

              {watchEmailFrequency !== 'immediate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {watchEmailFrequency === 'daily' ? 'Delivery Time' : 'Delivery Day'}
                    </label>
                    {watchEmailFrequency === 'weekly' ? (
                      <select
                        {...register('digestDay')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="monday">Monday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="friday">Friday</option>
                      </select>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      {...register('digestTime')}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {isEditing ? (
                  <span>Review your changes before saving</span>
                ) : (
                  <span>Notification settings are currently active</span>
                )}
              </div>
              
              {isEditing && (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to defaults
                      reset({
                        emailNewEnrollment: true,
                        emailCourseReview: true,
                        emailStudentMessage: true,
                        emailPayoutUpdate: true,
                        emailWeeklyDigest: true,
                        emailPlatformUpdates: false,
                        
                        inAppNewEnrollment: true,
                        inAppCourseReview: true,
                        inAppStudentMessage: true,
                        inAppPayoutUpdate: true,
                        inAppCourseMilestone: true,
                        
                        pushNewEnrollment: false,
                        pushStudentMessage: false,
                        pushCourseMilestone: false,
                        
                        emailFrequency: 'daily',
                        digestDay: 'friday',
                        digestTime: '09:00'
                      });
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset to defaults
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
