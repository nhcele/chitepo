import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  employeeCount: string;
  useCase: string;
  message: string;
  budget: string;
  timeline: string;
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

const budgetOptions = [
  'Under $10K annually',
  '$10K - $50K annually',
  '$50K - $100K annually',
  '$100K - $500K annually',
  '$500K+ annually',
  'Not sure yet'
];

const timelineOptions = [
  'Immediate (within 1 month)',
  'Short-term (1-3 months)',
  'Medium-term (3-6 months)',
  'Long-term (6+ months)',
  'Just exploring options'
];

export default function EnterpriseContact() {
  const [form, setForm] = useState<ContactForm>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    employeeCount: '',
    useCase: '',
    message: '',
    budget: '',
    timeline: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.company.trim()) newErrors.company = 'Company name is required';
    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!form.employeeCount) newErrors.employeeCount = 'Please select company size';
    if (!form.useCase) newErrors.useCase = 'Please select primary use case';
    if (!form.timeline) newErrors.timeline = 'Please select timeline';
    
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
      console.log('Enterprise contact form submitted:', form);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <Head>
          <title>Thank You - Enterprise Contact | Mindelta</title>
          <meta name="description" content="Thank you for contacting Mindelta Enterprise. We'll be in touch soon." />
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
                Thank You for Your Interest!
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                We&apos;ve received your enterprise inquiry and our team will review your requirements. 
                A Mindelta enterprise specialist will contact you within 24 hours.
              </p>
              
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Initial Review</div>
                      <div className="text-sm text-gray-600">Our team reviews your requirements and prepares a customized approach</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Discovery Call</div>
                      <div className="text-sm text-gray-600">30-minute consultation to understand your specific needs and goals</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Custom Proposal</div>
                      <div className="text-sm text-gray-600">Detailed proposal with pricing, implementation timeline, and ROI projections</div>
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
        <title>Enterprise Contact | Mindelta</title>
        <meta name="description" content="Contact Mindelta for enterprise learning solutions. Get custom pricing and implementation support." />
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
              
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Let&apos;s Transform Your Learning
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ready to scale your team&apos;s skills with enterprise-grade learning? 
                Our specialists will design a custom solution for your organization.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PhoneIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Phone</div>
                      <div className="text-gray-600">+263 (0) 242 48 331</div>
                      <div className="text-sm text-gray-500">Mon-Fri 8AM-5PM CAT</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <EnvelopeIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Email</div>
                      <div className="text-gray-600">hello@mindelta.com</div>
                      <div className="text-sm text-gray-500">We respond within 4 hours</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Office</div>
                      <div className="text-gray-600">82 Eastern Road, Mandara, Harare</div>
                      <div className="text-sm text-gray-500">Zimbabwe</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Response Time</div>
                      <div className="text-gray-600">Within 24 hours</div>
                      <div className="text-sm text-gray-500">Usually much faster</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
                  <div className="text-sm font-semibold text-indigo-900 mb-2">Enterprise Benefits</div>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Custom implementation plan</li>
                    <li>• Dedicated customer success manager</li>
                    <li>• Priority technical support</li>
                    <li>• Volume pricing discounts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Your Needs</h2>
                <p className="text-gray-600 mb-8">
                  Fill out this form and we&apos;ll prepare a customized proposal for your organization.
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
                        placeholder="+1 (555) 123-4567"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range
                      </label>
                      <select
                        value={form.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                      >
                        <option value="">Select budget range</option>
                        {budgetOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Implementation Timeline *
                      </label>
                      <select
                        value={form.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        className={`w-full rounded-lg border ${errors.timeline ? 'border-red-300' : 'border-gray-300'} focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3`}
                      >
                        <option value="">Select timeline</option>
                        {timelineOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors.timeline && <p className="text-red-600 text-sm mt-1">{errors.timeline}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tell us about your specific requirements
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                      placeholder="Describe your learning goals, current challenges, integration requirements, or any specific features you need..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <div className="text-sm text-gray-500">
                      * Required fields
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                        isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Send Request'}
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
