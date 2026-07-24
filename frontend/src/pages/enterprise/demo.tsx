import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  VideoCameraIcon,
  PresentationChartBarIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';

interface DemoForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  employeeCount: string;
  useCase: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  additionalInfo: string;
}

const employeeCountOptions = [
  '1-50 employees',
  '51-200 employees', 
  '201-1,000 employees',
  '1,001-5,000 employees',
  '5,000+ employees'
];

const useCaseOptions = [
  'Employee Training & Development',
  'Customer Education',
  'Partner Training',
  'Compliance Training',
  'Sales Enablement',
  'Technical Certification',
  'Leadership Development',
  'Other'
];

const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM'
];

const timezones = [
  'UTC-8 (PST)',
  'UTC-5 (EST)',
  'UTC+0 (GMT)',
  'UTC+1 (CET)',
  'UTC+2 (CAT)',
  'UTC+8 (CST)',
  'UTC+9 (JST)'
];

const demoFeatures = [
  {
    icon: VideoCameraIcon,
    title: 'Cinematic Course Experience',
    description: 'See our Hollywood-quality video production and immersive learning environment in action.'
  },
  {
    icon: AcademicCapIcon,
    title: 'AI-Driven Micro-Pacing',
    description: 'Experience personalized learning paths that adapt to individual progress and learning styles.'
  },
  {
    icon: PresentationChartBarIcon,
    title: 'Advanced Analytics Dashboard',
    description: 'Explore comprehensive learning analytics and ROI tracking for enterprise decision-makers.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Blockchain Credentials',
    description: 'Discover tamper-proof certification system with instant verification capabilities.'
  }
];

export default function EnterpriseDemo() {
  const [form, setForm] = useState<DemoForm>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    employeeCount: '',
    useCase: '',
    preferredDate: '',
    preferredTime: '',
    timezone: 'UTC+2 (CAT)',
    additionalInfo: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<DemoForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<DemoForm> = {};
    
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.company.trim()) newErrors.company = 'Company name is required';
    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!form.employeeCount) newErrors.employeeCount = 'Please select company size';
    if (!form.useCase) newErrors.useCase = 'Please select primary use case';
    if (!form.preferredDate) newErrors.preferredDate = 'Please select preferred date';
    if (!form.preferredTime) newErrors.preferredTime = 'Please select preferred time';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the form data to your backend
      console.log('Enterprise demo request submitted:', form);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting demo request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof DemoForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (isSubmitted) {
    return (
      <Layout>
        <Head>
          <title>Demo Scheduled - Enterprise Demo | Chitepo</title>
          <meta name="description" content="Your Chitepo enterprise demo has been scheduled. We'll be in touch soon." />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Demo Scheduled Successfully!
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Thank you for scheduling a demo with Chitepo. We&apos;ve received your request and will send you a calendar invitation shortly.
              </p>
              
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-900 mb-4">What to expect in your demo:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Platform Walkthrough (15 min)</div>
                      <div className="text-sm text-gray-600">Live demonstration of key features and capabilities</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Use Case Discussion (10 min)</div>
                      <div className="text-sm text-gray-600">Tailored discussion based on your specific requirements</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Q&A and Next Steps (5 min)</div>
                      <div className="text-sm text-gray-600">Address questions and outline implementation options</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/enterprise" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Enterprise
                </Link>
                
                <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Return to Home
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Schedule Enterprise Demo | Chitepo</title>
        <meta name="description" content="Schedule a personalized demo of Chitepo's enterprise learning platform. See our AI-driven micro-pacing and blockchain credentials in action." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        {/* Header */}
        <div className="relative overflow-hidden bg-white border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-pink-50" />
          <div className="relative max-w-7xl mx-auto px-4 py-16">
            <div className="text-center">
              <Link href="/enterprise" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Enterprise
              </Link>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <PlayIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  Schedule Your Demo
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                See Chitepo&apos;s enterprise learning platform in action. Get a personalized 30-minute demo 
                tailored to your organization&apos;s specific needs and use cases.
              </p>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  30 minutes
                </div>
                <div className="flex items-center gap-2">
                  <VideoCameraIcon className="w-4 h-4" />
                  Video call
                </div>
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  1-on-1 or team
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Demo Features */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What You&apos;ll See</h2>
                
                <div className="space-y-6">
                  {demoFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">{feature.title}</div>
                        <div className="text-sm text-gray-600">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
                  <div className="text-sm font-semibold text-indigo-900 mb-2">Demo Benefits</div>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Personalized to your use case</li>
                    <li>• Live Q&A with product experts</li>
                    <li>• Custom implementation roadmap</li>
                    <li>• ROI calculator and pricing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo Scheduling Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Demo</h2>
                <p className="text-gray-600 mb-8">
                  Fill out this form and we&apos;ll send you a calendar invitation for your personalized demo.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full rounded-lg border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        placeholder="John"
                      />
                      {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full rounded-lg border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        placeholder="Smith"
                      />
                      {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        placeholder="john.smith@company.com"
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                        placeholder="+263 (0) 242 48 331"
                      />
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className={`w-full rounded-lg border ${errors.company ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        placeholder="Acme Corporation"
                      />
                      {errors.company && <p className="text-red-600 text-sm mt-1">{errors.company}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        value={form.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        className={`w-full rounded-lg border ${errors.jobTitle ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        placeholder="Head of Learning & Development"
                      />
                      {errors.jobTitle && <p className="text-red-600 text-sm mt-1">{errors.jobTitle}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size *
                      </label>
                      <select
                        value={form.employeeCount}
                        onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                        className={`w-full rounded-lg border ${errors.employeeCount ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                      >
                        <option value="">Select company size</option>
                        {employeeCountOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors.employeeCount && <p className="text-red-600 text-sm mt-1">{errors.employeeCount}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Use Case *
                      </label>
                      <select
                        value={form.useCase}
                        onChange={(e) => handleInputChange('useCase', e.target.value)}
                        className={`w-full rounded-lg border ${errors.useCase ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                      >
                        <option value="">Select primary use case</option>
                        {useCaseOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors.useCase && <p className="text-red-600 text-sm mt-1">{errors.useCase}</p>}
                    </div>
                  </div>

                  {/* Scheduling Preferences */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Preferences</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Date *
                        </label>
                        <input
                          type="date"
                          value={form.preferredDate}
                          onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                          min={minDate}
                          className={`w-full rounded-lg border ${errors.preferredDate ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        />
                        {errors.preferredDate && <p className="text-red-600 text-sm mt-1">{errors.preferredDate}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Time *
                        </label>
                        <select
                          value={form.preferredTime}
                          onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                          className={`w-full rounded-lg border ${errors.preferredTime ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                        >
                          <option value="">Select time</option>
                          {timeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        {errors.preferredTime && <p className="text-red-600 text-sm mt-1">{errors.preferredTime}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={form.timezone}
                          onChange={(e) => handleInputChange('timezone', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                        >
                          {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      value={form.additionalInfo}
                      onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                      placeholder="Any specific features you'd like to see or questions you have..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <div className="text-sm text-gray-500">
                      * Required fields
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <CalendarDaysIcon className="w-4 h-4" />
                      {isSubmitting ? 'Scheduling...' : 'Schedule Demo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
