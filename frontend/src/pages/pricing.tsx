import { useState } from 'react';
import Layout from '../components/Layout';
import { CheckIcon } from '@heroicons/react/24/outline';

const pricingPlans = [
  {
    name: 'Individual',
    price: 'Free',
    description: 'Perfect for individual learners starting their journey',
    features: [
      'Access to free courses',
      'Community forums',
      'Basic certifications',
      'Mobile app access',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    description: 'For professionals seeking career advancement',
    features: [
      'All Individual features',
      'Access to all premium courses',
      'Advanced certifications',
      'AI-powered learning companion',
      'Priority support',
      'Offline access',
      'Career guidance',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations and government institutions',
    features: [
      'All Professional features',
      'Custom course creation',
      'Team management dashboard',
      'Advanced analytics',
      'Dedicated account manager',
      'SSO integration',
      'Custom branding',
      'API access',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that best fits your learning goals. All plans include access to our world-class content.
            </p>
            
            <div className="mt-8 flex justify-center items-center space-x-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-primary-600 text-white shadow-2xl scale-105'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.highlighted ? 'text-primary-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-primary-100' : 'text-gray-600'}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold mb-8 transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-primary-600 hover:bg-gray-100'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className={`h-6 w-6 mr-3 flex-shrink-0 ${
                        plan.highlighted ? 'text-primary-200' : 'text-primary-600'
                      }`} />
                      <span className={plan.highlighted ? 'text-primary-50' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-primary-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Government & NGO Partnerships
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              We offer special pricing for government institutions, NGOs, and educational organizations. 
              Contact us to discuss custom solutions for your organization.
            </p>
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
