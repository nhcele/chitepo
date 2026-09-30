import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  CheckBadgeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const tracks = [
  {
    id: 'dcc',
    title: 'DCC Training Track',
    duration: '8 weeks',
    icon: '🎯',
    description: 'Political mobilization, grassroots organizing, and party-government coordination',
    modules: ['Political Mobilization', 'Party-Government Coordination', 'Community Engagement'],
    target: 'DCC members, district officials',
    color: 'from-forest-500 to-forest-700'
  },
  {
    id: 'local-gov',
    title: 'Local Government Track',
    duration: '10 weeks',
    icon: '🏛️',
    description: 'Municipal administration, service delivery, and local governance',
    modules: ['Local Government Law', 'Urban Development', 'Community Leadership'],
    target: 'Mayors, councillors, municipal directors',
    color: 'from-terracotta-500 to-terracotta-700'
  },
  {
    id: 'rural-dev',
    title: 'Rural Development Track',
    duration: '8 weeks',
    icon: '🌾',
    description: 'Agriculture, infrastructure, and rural transformation',
    modules: ['Rural Development Strategy', 'Resource Management', 'Community Services'],
    target: 'RDC officials, traditional leaders',
    color: 'from-forest-500 to-forest-700'
  },
  {
    id: 'traditional',
    title: 'Traditional Leadership Track',
    duration: '6 weeks',
    icon: '👑',
    description: 'Traditional authority in modern governance',
    modules: ['Traditional Authority', 'Community Development', 'Unity & Patriotism'],
    target: 'Chiefs, headmen, village heads',
    color: 'from-ochre-500 to-ochre-700'
  },
  {
    id: 'judicial',
    title: 'Judicial Officers Track',
    duration: '12 weeks',
    icon: '⚖️',
    description: 'National values and judicial philosophy',
    modules: ['Judicial Philosophy', 'Law & Development', 'Justice Administration'],
    target: 'Judges, magistrates, legal officers',
    color: 'from-terracotta-500 to-terracotta-700'
  }
];

const certificationLevels = [
  {
    level: 'Level 1: Certificate',
    duration: '6-8 weeks',
    description: 'Basic qualification for official duties',
    requirement: 'All new councillors within 6 months of election'
  },
  {
    level: 'Level 2: Advanced Certificate',
    duration: '10-12 weeks',
    description: 'Qualification for senior positions',
    requirement: 'Mayoral candidates, Council chairpersons'
  },
  {
    level: 'Level 3: Diploma',
    duration: '3-6 months',
    description: 'Highest qualification for officials',
    requirement: 'Parliamentary candidates, Senate candidates'
  },
  {
    level: 'Level 4: Train-the-Trainer',
    duration: 'Additional 4 weeks',
    description: 'Qualified to train ward-based teams',
    requirement: 'Diploma holders with field experience'
  }
];

const benefits = [
  {
    title: 'Fully Sponsored',
    description: 'No cost for elected and appointed officials',
    icon: '💰'
  },
  {
    title: 'Mandatory Certification',
    description: 'Required for electoral candidacy (2016 ZANU-PF resolution)',
    icon: '✅'
  },
  {
    title: 'Practical Skills',
    description: 'Real-world governance and management training',
    icon: '🎓'
  },
  {
    title: 'National Recognition',
    description: 'Accredited by ZIMCHE and Public Service Commission',
    icon: '🏆'
  },
  {
    title: 'Career Advancement',
    description: 'Eligibility for senior positions and promotions',
    icon: '📈'
  },
  {
    title: 'Networking',
    description: 'Connect with officials across 10 provinces',
    icon: '🤝'
  }
];

export default function GovernmentOfficialsPage() {
  return (
    <>
      <Head>
        <title>Government Officials Track - Chitepo School of Ideology</title>
        <meta name="description" content="Specialized training for government officials, DCC members, councillors, mayors, and traditional leaders." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-terracotta-600 via-terracotta-700 to-terracotta-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-6">
                <CheckBadgeIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-semibold">Mandatory Training for Electoral Candidates</span>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Government Officials Track
              </h1>
              <p className="text-xl text-terracotta-100 max-w-3xl mx-auto mb-8">
                Specialized training for DCC members, local government officials, traditional leaders, 
                and judicial officers. Fully sponsored by government.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses?category=practical_governance">
                  <a className="inline-flex items-center px-8 py-3 bg-white text-terracotta-700 rounded-md font-semibold hover:bg-terracotta-50 transition-colors">
                    Browse Courses
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </a>
                </Link>
                <button className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-md font-semibold hover:bg-white/10 transition-colors">
                  <CalendarDaysIcon className="mr-2 h-5 w-5" />
                  View Training Calendar
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="py-16 bg-paper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Program Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm hover:shadow-sm transition-shadow"
                >
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-stone">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Training Tracks */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Specialized Training Tracks</h2>
              <p className="text-stone max-w-2xl mx-auto">
                Choose the track that matches your role and responsibilities. Each track includes 
                orientation, specialized training, and practical application.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-md shadow-sm overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className={`bg-gradient-to-r ${track.color} p-6 text-white`}>
                    <div className="text-4xl mb-3">{track.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{track.title}</h3>
                    <div className="flex items-center text-sm text-white/90">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      <span>{track.duration}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-charcoal mb-4">{track.description}</p>
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-stone mb-2">MODULES:</h4>
                      <ul className="space-y-1">
                        {track.modules.map((module, i) => (
                          <li key={i} className="text-sm text-charcoal flex items-start">
                            <span className="text-primary-600 mr-2">•</span>
                            {module}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t border-border/60">
                      <p className="text-xs text-stone uppercase font-semibold mb-1">Target Audience</p>
                      <p className="text-sm text-charcoal">{track.target}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Certification Levels */}
        <div className="py-16 bg-paper">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Certification Pathways</h2>
              <p className="text-stone">
                Progressive certification levels aligned with your career advancement
              </p>
            </div>

            <div className="space-y-6">
              {certificationLevels.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-md flex items-center justify-center text-primary-600 font-bold text-lg mr-4">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{cert.level}</h3>
                        <span className="text-sm text-stone">{cert.duration}</span>
                      </div>
                      <p className="text-charcoal mb-2">{cert.description}</p>
                      <div className="flex items-start text-sm text-stone">
                        <CheckBadgeIcon className="h-5 w-5 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span><strong>Requirement:</strong> {cert.requirement}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Training Calendar */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Annual Training Calendar</h2>
              <p className="text-stone">Cohorts organized by quarter across all 10 provinces</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-forest-500 to-forest-700 text-white p-6 rounded-md">
                <h3 className="text-lg font-bold mb-2">Q1 (Jan-Mar)</h3>
                <ul className="space-y-1 text-sm text-forest-50">
                  <li>• New Councillors</li>
                  <li>• DCC Members</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-forest-500 to-forest-700 text-white p-6 rounded-md">
                <h3 className="text-lg font-bold mb-2">Q2 (Apr-Jun)</h3>
                <ul className="space-y-1 text-sm text-forest-50">
                  <li>• RDC Officials (P1-5)</li>
                  <li>• Traditional Leaders</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white p-6 rounded-md">
                <h3 className="text-lg font-bold mb-2">Q3 (Jul-Sep)</h3>
                <ul className="space-y-1 text-sm text-terracotta-50">
                  <li>• RDC Officials (P6-10)</li>
                  <li>• Mayoral Leadership</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white p-6 rounded-md">
                <h3 className="text-lg font-bold mb-2">Q4 (Oct-Dec)</h3>
                <ul className="space-y-1 text-sm text-terracotta-50">
                  <li>• Pre-Election Training</li>
                  <li>• Train-the-Trainer</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Begin Your Training?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Check your eligibility and register for the next available cohort
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-3 bg-white text-primary-700 rounded-md font-semibold hover:bg-primary-50 transition-colors">
                <DocumentTextIcon className="mr-2 h-5 w-5" />
                Check Eligibility
              </button>
              <button className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-md font-semibold hover:bg-white/10 transition-colors">
                <UserGroupIcon className="mr-2 h-5 w-5" />
                Register Now
              </button>
            </div>
            <p className="mt-6 text-sm text-primary-200">
              Need help? Contact us at <a href="mailto:officials@chitepo.co.zw" className="underline font-semibold">officials@chitepo.co.zw</a>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}

