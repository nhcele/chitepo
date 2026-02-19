import React, { useState, useEffect } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';
import ProfileManagement from '@/components/instructor/ProfileManagement';
import NotificationSettings from '@/components/instructor/NotificationSettings';

interface ProfileData {
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  expertise: string[];
  experience: string;
  location: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
  youtube: string;
}

interface NotificationData {
  emailNewEnrollment: boolean;
  emailCourseReview: boolean;
  emailStudentMessage: boolean;
  emailPayoutUpdate: boolean;
  emailWeeklyDigest: boolean;
  emailPlatformUpdates: boolean;
  inAppNewEnrollment: boolean;
  inAppCourseReview: boolean;
  inAppStudentMessage: boolean;
  inAppPayoutUpdate: boolean;
  inAppCourseMilestone: boolean;
  pushNewEnrollment: boolean;
  pushStudentMessage: boolean;
  pushCourseMilestone: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  digestDay: 'monday' | 'wednesday' | 'friday';
  digestTime: string;
}

export default function InstructorSettings() {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    setProfileData({
      firstName: 'Tafadzwa',
      lastName: 'Mhembere',
      headline: 'Senior Software Engineer & Full-Stack Developer',
      bio: 'Passionate educator with 12+ years of experience in software development and teaching. Former lead developer at Econet Wireless. I love helping Zimbabwean students master modern web development through practical, hands-on learning.',
      expertise: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
      experience: '12+ years in software development, specializing in full-stack web applications and enterprise systems for Zimbabwean businesses.',
      location: 'Harare, Zimbabwe',
      website: 'https://tafadzwa.dev',
      twitter: '@tafadzwa_dev',
      linkedin: 'linkedin.com/in/tafadzwa-mhembere',
      github: 'github.com/tafadzwa',
      youtube: 'youtube.com/@tafadzwatech'
    });

    setNotificationData({
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
  }, []);

  const handleProfileSave = async (data: ProfileData) => {
    setLoading(true);
    try {
      // API call to save profile
      console.log('Saving profile data:', data);
      setProfileData(data);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async (data: NotificationData) => {
    setLoading(true);
    try {
      // API call to save notification settings
      console.log('Saving notification data:', data);
      setNotificationData(data);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <Layout>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-pink-50 pointer-events-none" />
          <div className="relative px-6 pt-8 pb-4">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Instructor Settings
              </h1>
              <p className="mt-2 text-sm text-gray-500">Manage your public profile, payout info, and notifications.</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Profile Management */}
            {profileData && (
              <ProfileManagement
                initialData={profileData}
                onSave={handleProfileSave}
                loading={loading}
              />
            )}

            {/* Notification Settings */}
            {notificationData && (
              <NotificationSettings
                initialData={notificationData}
                onSave={handleNotificationSave}
                loading={loading}
              />
            )}

            {/* Payout Settings - TODO for future implementation */}
            <div className="bg-white/70 backdrop-blur rounded-xl border shadow-sm p-6 space-y-2">
              <div className="text-lg font-semibold">Payout & Tax</div>
              <div className="text-sm text-gray-600">PayPal/ACH details and tax form</div>
              <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                Coming soon: Configure your payment methods and tax information
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
}
