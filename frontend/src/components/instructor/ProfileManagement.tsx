import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  PhotoIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkIcon as TwitterIcon,
  BuildingOfficeIcon as LinkedinIcon,
  CodeBracketIcon as GithubIcon,
  PlayIcon as YoutubeIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

interface ProfileFormData {
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

interface ProfileManagementProps {
  initialData?: Partial<ProfileFormData>;
  onSave: (data: ProfileFormData) => Promise<void>;
  loading?: boolean;
}

export default function ProfileManagement({ 
  initialData, 
  onSave, 
  loading = false 
}: ProfileManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [expertiseInput, setExpertiseInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      headline: initialData?.headline || '',
      bio: initialData?.bio || '',
      expertise: initialData?.expertise || [],
      experience: initialData?.experience || '',
      location: initialData?.location || '',
      website: initialData?.website || '',
      twitter: initialData?.twitter || '',
      linkedin: initialData?.linkedin || '',
      github: initialData?.github || '',
      youtube: initialData?.youtube || ''
    }
  });

  const watchedExpertise = watch('expertise');

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !watchedExpertise.includes(expertiseInput.trim())) {
      setValue('expertise', [...watchedExpertise, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };

  const removeExpertise = (index: number) => {
    const newExpertise = watchedExpertise.filter((_, i) => i !== index);
    setValue('expertise', newExpertise);
  };

  const handleSave = async (data: ProfileFormData) => {
    try {
      await onSave(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancel = () => {
    reset(initialData);
    setIsEditing(false);
    setAvatarPreview(null);
  };

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
            <div className="p-2 bg-primary-50 rounded-lg">
              <AcademicCapIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Management</h3>
              <p className="text-sm text-gray-500">Manage your public instructor profile</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit Profile
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
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
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
        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-medium text-gray-600">
                    {(watch('firstName') || 'I')[0]}{(watch('lastName') || 'nstructor')[0]}
                  </span>
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                >
                  <PhotoIcon className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Headline
            </label>
            <input
              type="text"
              {...register('headline')}
              placeholder="e.g., Senior Software Engineer & Course Instructor"
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="Tell students about yourself, your teaching philosophy, and what they can expect from your courses..."
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas of Expertise
            </label>
            <div className="space-y-2">
              {isEditing && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                    placeholder="Add an expertise area..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addExpertise}
                    className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {watchedExpertise.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 rounded-full"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeExpertise(index)}
                        className="ml-2 text-primary-500 hover:text-primary-700"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience
            </label>
            <textarea
              {...register('experience')}
              rows={3}
              placeholder="Describe your professional experience and background..."
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              {...register('location')}
              placeholder="City, Country"
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Social Links</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                  Website
                </label>
                <input
                  type="url"
                  {...register('website')}
                  placeholder="https://yourwebsite.com"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    <TwitterIcon className="h-4 w-4 inline mr-1" />
                    Twitter
                  </label>
                  <input
                    type="text"
                    {...register('twitter')}
                    placeholder="@username"
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    <LinkedinIcon className="h-4 w-4 inline mr-1" />
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    {...register('linkedin')}
                    placeholder="linkedin.com/in/username"
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    <GithubIcon className="h-4 w-4 inline mr-1" />
                    GitHub
                  </label>
                  <input
                    type="text"
                    {...register('github')}
                    placeholder="github.com/username"
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <YoutubeIcon className="h-4 w-4 inline mr-1" />
                  YouTube
                </label>
                <input
                  type="text"
                  {...register('youtube')}
                  placeholder="youtube.com/channel/username"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
