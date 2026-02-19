import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CogIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';

const features = [
  {
    name: 'Custom Learning Paths',
    description: 'Create tailored learning journeys aligned with your company\'s specific skills and career progression frameworks.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Advanced Analytics',
    description: 'Deep insights into learning progress, skill gaps, and ROI with comprehensive reporting and dashboards.',
    icon: ChartBarIcon,
  },
  {
    name: 'SSO & Security',
    description: 'Enterprise-grade security with SAML/OIDC SSO, GDPR compliance, and advanced user management.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'API Integration',
    description: 'Seamless integration with your existing HR systems, LMS, and workflow tools via REST APIs.',
    icon: CogIcon,
  },
  {
    name: 'White-label Solution',
    description: 'Fully customizable platform with your branding, domain, and user experience.',
    icon: BuildingOfficeIcon,
  },
  {
    name: 'Dedicated Support',
    description: '24/7 dedicated customer success manager and technical support for enterprise clients.',
    icon: UserGroupIcon,
  },
];

const stats = [
  { name: 'Enterprise Clients', value: '500+' },
  { name: 'Learners Trained', value: '2.5M+' },
  { name: 'Completion Rate', value: '94%' },
  { name: 'Skill Improvement', value: '85%' },
];

const testimonials = [
  {
    content: "Mindelta transformed our engineering team's capabilities. The AI-driven micro-pacing helped our developers complete courses 40% faster while maintaining high comprehension.",
    author: "Sarah Chen",
    role: "VP of Engineering",
    company: "TechCorp",
    avatar: "/api/placeholder/64/64"
  },
  {
    content: "The blockchain certificates gave our team verifiable credentials that enhanced their professional profiles. ROI was evident within 6 months.",
    author: "Michael Rodriguez",
    role: "Chief Learning Officer",
    company: "InnovateCo",
    avatar: "/api/placeholder/64/64"
  },
  {
    content: "Custom learning paths aligned perfectly with our career framework. Employee engagement in learning increased by 300%.",
    author: "Jennifer Kim",
    role: "Head of People",
    company: "ScaleUp Inc",
    avatar: "/api/placeholder/64/64"
  }
];

const pricingPlans = [
  {
    name: 'Team',
    description: 'Perfect for growing teams',
    price: '$49',
    period: 'per user/month',
    features: [
      'Up to 100 users',
      'Standard course library',
      'Basic analytics',
      'Email support',
      'SSO integration',
      'Mobile app access'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: '$99',
    period: 'per user/month',
    features: [
      'Unlimited users',
      'Custom learning paths',
      'Advanced analytics',
      'Priority support',
      'API access',
      'White-label option',
      'Dedicated CSM',
      'Custom integrations'
    ],
    cta: 'Contact Sales',
    popular: true
  },
  {
    name: 'Custom',
    description: 'Tailored to your needs',
    price: 'Custom',
    period: 'pricing',
    features: [
      'Everything in Enterprise',
      'Custom course development',
      'On-premise deployment',
      'Advanced security',
      'SLA guarantees',
      'Training & onboarding',
      '24/7 phone support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function EnterprisePage() {
  const [activeTab, setActiveTab] = useState<'features' | 'pricing' | 'case-studies'>('features');

  return (
    <>
      <Head>
        <title>Enterprise Solutions - Mindelta</title>
        <meta name="description" content="Scale your team's skills with Mindelta's enterprise learning platform. Custom learning paths, advanced analytics, and blockchain certificates." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Transform Your Team&apos;s Skills
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Empower your organization with AI-driven professional learning, blockchain certificates, 
                and comprehensive analytics. Join 500+ companies already scaling their teams with Mindelta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/enterprise/demo"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlayCircleIcon className="h-5 w-5 mr-2" />
                  Watch Demo
                </Link>
                <Link
                  href="/enterprise/contact"
                  className="inline-flex items-center px-8 py-4 border border-primary-600 text-lg font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
                >
                  Contact Sales
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.name}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('features')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'features'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pricing'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => setActiveTab('case-studies')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'case-studies'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Case Studies
              </button>
            </nav>
          </div>
        </div>

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise Features</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Everything you need to scale learning across your organization with enterprise-grade security and customization.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-6"
                  >
                    <div className="flex items-center mb-4">
                      <feature.icon className="h-8 w-8 text-primary-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise Pricing</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Flexible pricing options to fit organizations of all sizes. All plans include our core learning platform.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pricingPlans.map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-lg shadow-lg overflow-hidden ${
                      plan.popular ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="bg-primary-500 text-white text-center py-2 text-sm font-medium">
                        Most Popular
                      </div>
                    )}
                    <div className="bg-white p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-2">{plan.period}</span>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                        {plan.cta}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Case Studies Tab */}
        {activeTab === 'case-studies' && (
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  See how leading organizations are transforming their teams with Mindelta.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-6"
                  >
                    <p className="text-gray-600 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                    <div className="flex items-center">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.author}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                        <div className="text-sm text-gray-500">{testimonial.company}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-primary-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Team?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of companies already using Mindelta to upskill their teams.
              Get started with a personalized demo today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/enterprise/demo"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
              >
                <PlayCircleIcon className="h-5 w-5 mr-2" />
                Schedule Demo
              </Link>
              <Link
                href="/enterprise/contact"
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Download Brochure
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
