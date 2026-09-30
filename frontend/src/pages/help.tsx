import { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const categories = [
  {
    name: 'Getting Started',
    icon: AcademicCapIcon,
    articles: [
      'How to create an account',
      'Navigating the platform',
      'Enrolling in your first course',
      'Setting up your profile',
    ],
  },
  {
    name: 'Courses & Learning',
    icon: BookOpenIcon,
    articles: [
      'How to access course materials',
      'Tracking your progress',
      'Taking quizzes and assessments',
      'Earning certificates',
    ],
  },
  {
    name: 'Technical Support',
    icon: QuestionMarkCircleIcon,
    articles: [
      'Video playback issues',
      'Browser compatibility',
      'Mobile app troubleshooting',
      'Download course materials',
    ],
  },
  {
    name: 'Account & Billing',
    icon: ChatBubbleLeftRightIcon,
    articles: [
      'Managing your subscription',
      'Payment methods',
      'Refund policy',
      'Account security',
    ],
  },
];

const faqs = [
  {
    question: 'How do I enroll in a course?',
    answer: 'Browse our course catalog, select a course, and click the "Enroll" button. Free courses are instantly accessible, while premium courses require an active subscription.',
  },
  {
    question: 'Can I access courses offline?',
    answer: 'Yes! Professional and Enterprise plan subscribers can download course materials and videos for offline viewing through our mobile app.',
  },
  {
    question: 'How do I get a certificate?',
    answer: 'Complete all course requirements including lessons, quizzes, and final assessments. Once completed, your certificate will be automatically generated and available in your profile.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept major credit cards, mobile money (EcoCash, OneMoney), and bank transfers for enterprise customers.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Yes, we offer a 14-day money-back guarantee for all paid subscriptions. Contact our support team to process your refund.',
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-charcoal mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-stone mb-8">
              Search our knowledge base or browse categories below
            </p>
            
            <div className="max-w-2xl mx-auto relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-pewter" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-md border-2 border-border/60 focus:border-primary-500 focus:outline-none text-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category) => (
              <div key={category.name} className="bg-white rounded-md p-6 shadow-sm hover:shadow-sm transition-shadow">
                <category.icon className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-charcoal mb-4">
                  {category.name}
                </h3>
                <ul className="space-y-2">
                  {category.articles.map((article) => (
                    <li key={article}>
                      <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border/60 pb-4">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full text-left flex justify-between items-center py-4 hover:text-primary-600 transition-colors"
                  >
                    <span className="text-lg font-semibold text-charcoal">
                      {faq.question}
                    </span>
                    <span className="text-2xl text-pewter">
                      {expandedFaq === index ? '−' : '+'}
                    </span>
                  </button>
                  {expandedFaq === index && (
                    <p className="text-stone pb-4">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-primary-50 rounded-md p-6 text-center">
              <VideoCameraIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                Video Tutorials
              </h3>
              <p className="text-stone mb-4">
                Watch step-by-step guides
              </p>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">
                Watch Now →
              </a>
            </div>

            <div className="bg-primary-50 rounded-md p-6 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                Live Chat
              </h3>
              <p className="text-stone mb-4">
                Chat with our support team
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-semibold">
                Start Chat →
              </button>
            </div>

            <div className="bg-primary-50 rounded-md p-6 text-center">
              <BookOpenIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                Documentation
              </h3>
              <p className="text-stone mb-4">
                Detailed technical guides
              </p>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">
                Read Docs →
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
