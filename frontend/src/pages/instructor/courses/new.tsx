import React, { useState } from 'react';
import Head from 'next/head';
import RoleGuard from '@/components/RoleGuard';
import Layout from '@/components/Layout';
import { UserRole } from '@mindelta/shared';
import { instructorCreateCourse } from '@/lib/api/instructor';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  SparklesIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  
  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !loading;

  const steps = [
    { title: 'Basic Info', description: 'Course title and description' },
    { title: 'Details', description: 'Category, level, and duration' },
    { title: 'Review', description: 'Review and create course' }
  ];

  const categories = [
    { id: 'programming', name: 'Programming & Development', icon: '💻' },
    { id: 'design', name: 'Design & Creative', icon: '🎨' },
    { id: 'business', name: 'Business & Management', icon: '💼' },
    { id: 'marketing', name: 'Marketing & Sales', icon: '📈' },
    { id: 'data-science', name: 'Data Science & AI', icon: '🤖' },
    { id: 'health', name: 'Health & Wellness', icon: '🏥' },
    { id: 'language', name: 'Language Learning', icon: '🗣️' },
    { id: 'other', name: 'Other', icon: '📚' }
  ];

  const levels = [
    { id: 'beginner', name: 'Beginner', description: 'No prior experience needed' },
    { id: 'intermediate', name: 'Intermediate', description: 'Some experience recommended' },
    { id: 'advanced', name: 'Advanced', description: 'Extensive experience required' }
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setLoading(true);
    try {
      const course = await instructorCreateCourse({ 
        title, 
        description
      });
      toast.success('Course created successfully!');
      // Navigate to the course detail/editor page
      await router.push(`/instructor/course/${course.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const StepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete React Development Course"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a clear, descriptive title that tells students what they&apos;ll learn
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Description *
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what students will learn, the skills they'll gain, and who this course is for..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="mt-1 flex justify-between">
                <p className="text-sm text-gray-500">
                  Write a compelling description that attracts your target audience
                </p>
                <span className="text-sm text-gray-400">{description.length}/500</span>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <SparklesIcon className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-primary-900">Pro Tip</h4>
                  <p className="text-sm text-primary-700 mt-1">
                    Great course descriptions include: learning outcomes, target audience, 
                    and what makes your course unique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Course Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={category === cat.id}
                      onChange={(e) => setCategory(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="border-2 rounded-lg p-3 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition-colors">
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Difficulty Level
              </label>
              <div className="space-y-3">
                {levels.map((lvl) => (
                  <label key={lvl.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      value={lvl.id}
                      checked={level === lvl.id}
                      onChange={(e) => setLevel(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="border-2 rounded-lg p-4 peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{lvl.name}</div>
                          <div className="text-sm text-gray-500">{lvl.description}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 peer-checked:border-primary-500 peer-checked:bg-primary-500`}>
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-3 w-3 text-white hidden peer-checked:block" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (hours)
              </label>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  max="100"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="text-gray-500">hours</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Help students plan their learning time
              </p>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Preview</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{title || 'Untitled Course'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900">{description || 'No description provided'}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {categories.find(c => c.id === category)?.name || 'Not set'}
                    </div>
                    <div className="text-sm text-gray-500">Category</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {levels.find(l => l.id === level)?.name || 'Not set'}
                    </div>
                    <div className="text-sm text-gray-500">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {estimatedDuration ? `${estimatedDuration}h` : 'Not set'}
                    </div>
                    <div className="text-sm text-gray-500">Duration</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Ready to Create</h4>
                  <p className="text-sm text-green-700 mt-1">
                    After creating your course, you can add modules, lessons, and publish when ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Create New Course - Mindelta</title>
        <meta name="description" content="Create a new course and share your expertise with learners worldwide." />
      </Head>
      
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full mb-4"
                >
                  <AcademicCapIcon className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Create a New Course</h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Share your expertise and start teaching. Set up the basics and add content later.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((stepItem, index) => (
                  <div key={stepItem.title} className="flex items-center">
                    <div className={`flex items-center space-x-3 ${
                      step === index ? 'text-primary-600' : step > index ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        step === index 
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : step > index 
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300'
                      }`}>
                        {step > index ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{stepItem.title}</div>
                        <div className="text-xs">{stepItem.description}</div>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        step > index ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-8"
                >
                  <form onSubmit={onSubmit}>
                    {StepContent()}
                    
                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {step < steps.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setStep(step + 1)}
                          disabled={(step === 0 && !title.trim()) || (step === 1 && !category)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!canSubmit}
                          className={`inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg text-white transition-colors ${
                            canSubmit 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {loading ? 'Creating...' : 'Create Course'}
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Tips */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <UsersIcon className="h-5 w-5 text-primary-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Know Your Audience</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Define who your course is for and what they&apos;ll achieve
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <VideoCameraIcon className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Quality Content</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Mix video, text, and interactive elements for engagement
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CurrencyDollarIcon className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Pricing Strategy</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Research market rates and value you&apos;re providing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What's Next */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Next?</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-5 w-5 flex-none rounded-full bg-primary-600 text-white text-xs leading-5 text-center">1</span>
                      <div>
                        <div className="font-medium">Add Modules</div>
                        <div className="text-xs text-gray-500">Structure your course into sections</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-5 w-5 flex-none rounded-full bg-primary-600 text-white text-xs leading-5 text-center">2</span>
                      <div>
                        <div className="font-medium">Create Lessons</div>
                        <div className="text-xs text-gray-500">Add videos, texts, and quizzes</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-5 w-5 flex-none rounded-full bg-primary-600 text-white text-xs leading-5 text-center">3</span>
                      <div>
                        <div className="font-medium">Set Pricing</div>
                        <div className="text-xs text-gray-500">Choose your course price</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-5 w-5 flex-none rounded-full bg-primary-600 text-white text-xs leading-5 text-center">4</span>
                      <div>
                        <div className="font-medium">Publish</div>
                        <div className="text-xs text-gray-500">Launch your course to students</div>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </RoleGuard>
    </>
  );
}
