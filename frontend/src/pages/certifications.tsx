import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  TrophyIcon,
  UserGroupIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const pathways = [
  {
    id: 'general',
    name: 'General Ideological Education',
    icon: '🎓',
    description: 'For party members, general public, youth, and interested citizens',
    color: 'from-forest-500 to-forest-700',
    levels: [
      {
        level: 0,
        title: 'Orientation Certificate',
        duration: '2 weeks',
        cost: 'Free',
        courses: '10-hour program',
        requirement: 'Basic quiz (60%)',
        outcome: 'Foundation for further studies'
      },
      {
        level: 1,
        title: 'Certificate in Political Ideology',
        duration: '8-12 weeks',
        cost: '$30',
        courses: '4 core courses (minimum)',
        requirement: '50% pass mark, capstone essay',
        outcome: 'Comprehensive ideological foundation'
      },
      {
        level: 2,
        title: 'Advanced Certificate',
        duration: '16-24 weeks',
        cost: '$60',
        courses: '8 courses (4 core + 4 contemporary)',
        requirement: '60% pass mark, research project',
        outcome: 'Advanced ideological competence'
      },
      {
        level: 3,
        title: 'Diploma in Political Ideology',
        duration: '9-12 months',
        cost: '$120',
        courses: 'All 16 core & contemporary courses',
        requirement: '65% pass mark, thesis (10,000 words)',
        outcome: 'Nationally recognized diploma'
      },
      {
        level: 4,
        title: 'Master Trainer Certification',
        duration: '6 weeks',
        cost: '$50',
        courses: 'Train-the-trainer program',
        requirement: 'Diploma + 2 years experience',
        outcome: 'Authorized to train party members'
      }
    ]
  },
  {
    id: 'officials',
    name: 'Government Officials Track',
    icon: '🏛️',
    description: 'For DCC members, councillors, mayors, traditional leaders, judges',
    color: 'from-terracotta-500 to-terracotta-700',
    levels: [
      {
        level: 1,
        title: 'Certificate in Public Service',
        duration: '6-8 weeks',
        cost: 'Fully Sponsored',
        courses: 'Orientation + 1 specialized track',
        requirement: '50% pass mark, field project',
        outcome: 'Basic qualification for duties',
        mandatory: 'New councillors (within 6 months)'
      },
      {
        level: 2,
        title: 'Advanced Certificate in Governance',
        duration: '10-12 weeks',
        cost: 'Fully Sponsored',
        courses: 'Orientation + 2 specialized tracks',
        requirement: '60% pass mark, development project',
        outcome: 'Qualification for senior positions',
        mandatory: 'Mayoral candidates, Council chairpersons'
      },
      {
        level: 3,
        title: 'Diploma in Governance and Ideology',
        duration: '3-6 months',
        cost: 'Fully Sponsored',
        courses: 'All Phase 1-3 requirements',
        requirement: '70% pass mark (distinction), thesis',
        outcome: 'Highest qualification for officials',
        mandatory: 'Parliamentary/Senate candidates'
      },
      {
        level: 4,
        title: 'Train-the-Trainer (Ward-Based)',
        duration: '4 weeks',
        cost: 'Fully Sponsored',
        courses: 'Ward-based training skills',
        requirement: 'Diploma + field training',
        outcome: 'Build ward capacity'
      }
    ]
  },
  {
    id: 'diaspora',
    name: 'Diaspora Engagement Track',
    icon: '✈️',
    description: 'For diaspora members, international community',
    color: 'from-terracotta-500 to-terracotta-700',
    levels: [
      {
        level: 1,
        title: 'Certificate in Diaspora Engagement',
        duration: '6-8 weeks',
        cost: '$50',
        courses: '1 diaspora stream',
        requirement: '50% pass mark, capstone project',
        outcome: 'Formal diaspora recognition'
      },
      {
        level: 2,
        title: 'Advanced Certificate in Diaspora Leadership',
        duration: '12-16 weeks',
        cost: '$90',
        courses: '2 diaspora streams',
        requirement: '60% pass mark, leadership project',
        outcome: 'Diaspora leadership eligibility'
      },
      {
        level: 3,
        title: 'Diploma in Diaspora Affairs',
        duration: '30 weeks',
        cost: '$150',
        courses: 'All 4 diaspora streams',
        requirement: '70% pass mark, major contribution',
        outcome: 'National diaspora representative'
      },
      {
        level: 4,
        title: 'Diaspora Ambassador Certification',
        duration: '6 weeks',
        cost: 'By invitation',
        courses: 'Ambassador training',
        requirement: 'Diploma + demonstrated excellence',
        outcome: 'Official diaspora ambassador'
      }
    ]
  },
  {
    id: 'youth',
    name: 'Youth Leadership Track',
    icon: '🌟',
    description: 'For young leaders (18-35 years), students, young professionals',
    color: 'from-forest-500 to-forest-700',
    levels: [
      {
        level: 1,
        title: 'Certificate in Youth Leadership',
        duration: '6 weeks',
        cost: '$15 (50% discount)',
        courses: 'Youth leadership + community service',
        requirement: '50% pass mark, 20 hours service',
        outcome: 'Youth league recognition'
      },
      {
        level: 2,
        title: 'Advanced Certificate in Youth Political Leadership',
        duration: '12 weeks',
        cost: '$30 (50% discount)',
        courses: '4 additional courses + campaign',
        requirement: '60% pass mark, mobilization project',
        outcome: 'Youth leadership positions'
      },
      {
        level: 3,
        title: 'Diploma in Youth Development',
        duration: '6 months',
        cost: '$60 (50% discount)',
        courses: '8 core courses + youth project',
        requirement: 'Research dissertation',
        outcome: 'Full party leadership eligibility'
      }
    ]
  },
  {
    id: 'women',
    name: 'Women\'s Leadership Track',
    icon: '👩‍💼',
    description: 'For women in party, government, and civil society',
    color: 'from-terracotta-500 to-terracotta-700',
    levels: [
      {
        level: 1,
        title: 'Certificate in Women\'s Leadership',
        duration: '8 weeks',
        cost: '$15 (50% discount)',
        courses: 'Gender studies + empowerment project',
        requirement: '50% pass mark',
        outcome: 'Women\'s league recognition'
      },
      {
        level: 2,
        title: 'Advanced Certificate in Women\'s Political Leadership',
        duration: '12 weeks',
        cost: '$30 (50% discount)',
        courses: '4 additional courses + mobilization',
        requirement: 'Mentor 5 younger women',
        outcome: 'Senior women\'s league positions'
      },
      {
        level: 3,
        title: 'Diploma in Gender and Development',
        duration: '6 months',
        cost: '$60 (50% discount)',
        courses: 'Comprehensive curriculum',
        requirement: 'Research on gender issues',
        outcome: 'Expert recognition, policy consultation'
      }
    ]
  }
];

const benefits = [
  {
    title: 'Nationally Recognized',
    description: 'Accredited by ZIMCHE and Public Service Commission',
    icon: CheckBadgeIcon
  },
  {
    title: 'Career Advancement',
    description: 'Eligibility for senior positions and electoral candidacy',
    icon: TrophyIcon
  },
  {
    title: 'Flexible Learning',
    description: 'Online, face-to-face, and blended options',
    icon: GlobeAltIcon
  },
  {
    title: 'University Credit',
    description: 'Articulation with UZ, NUST, and ZOU',
    icon: AcademicCapIcon
  }
];

export default function CertificationsPage() {
  const [selectedPathway, setSelectedPathway] = useState(pathways[0]);

  return (
    <>
      <Head>
        <title>Certification Pathways - Chitepo School of Ideology</title>
        <meta name="description" content="Progressive certification pathways from orientation to diploma. Multiple tracks for different audiences." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <SparklesIcon className="h-16 w-16 mx-auto mb-6 text-ochre-300" />
              <h1 className="text-5xl font-bold mb-6">
                Certification Pathways
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
                Progressive credentials for ideological education, governance excellence, diaspora leadership, 
                youth empowerment, and women's advancement.
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-white/20 rounded-md">
                <TrophyIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">6 Pathways • 5 Levels • Multiple Specializations</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="py-16 bg-paper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm text-center"
                >
                  <benefit.icon className="h-10 w-10 mx-auto mb-3 text-primary-600" />
                  <h3 className="font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-stone">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Pathway Selector */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choose Your Pathway</h2>
              <p className="text-stone">Select the track that matches your role and goals</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {pathways.map((pathway) => (
                <button
                  key={pathway.id}
                  onClick={() => setSelectedPathway(pathway)}
                  className={`p-4 rounded-md border-2 transition-all ${
                    selectedPathway.id === pathway.id
                      ? 'border-primary-500 bg-primary-50 scale-105'
                      : 'border-border/60 hover:border-primary-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{pathway.icon}</div>
                  <div className="text-sm font-semibold text-charcoal">{pathway.name.split(' ')[0]}</div>
                </button>
              ))}
            </div>

            {/* Selected Pathway Details */}
            <motion.div
              key={selectedPathway.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-md shadow-sm overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${selectedPathway.color} p-8 text-white`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-5xl mb-4">{selectedPathway.icon}</div>
                    <h3 className="text-3xl font-bold mb-2">{selectedPathway.name}</h3>
                    <p className="text-lg text-white/90">{selectedPathway.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{selectedPathway.levels.length}</div>
                    <div className="text-sm">Levels</div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {selectedPathway.levels.map((level, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="border-l-4 border-primary-500 pl-6 py-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                            {level.level}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-charcoal">{level.title}</h4>
                            {level.mandatory && (
                              <span className="inline-block mt-1 px-2 py-1 bg-terracotta-100 text-terracotta-700 text-xs rounded font-semibold">
                                MANDATORY: {level.mandatory}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-stone mb-1">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {level.duration}
                          </div>
                          <div className="flex items-center text-sm font-semibold text-primary-600">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {level.cost}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-charcoal">Courses:</span>
                          <p className="text-stone">{level.courses}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-charcoal">Requirement:</span>
                          <p className="text-stone">{level.requirement}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-charcoal">Outcome:</span>
                          <p className="text-stone">{level.outcome}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex gap-4">
                  <Link 
                    href="/courses"
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-md font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <AcademicCapIcon className="mr-2 h-5 w-5" />
                    Browse Courses
                  </Link>
                  <button className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-md font-semibold hover:bg-primary-50 transition-colors">
                    <DocumentTextIcon className="mr-2 h-5 w-5" />
                    Download Guide
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recognition of Prior Learning */}
        <div className="py-16 bg-paper">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-md shadow-sm p-8">
              <div className="flex items-start">
                <CheckBadgeIcon className="h-12 w-12 text-forest-600 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-4">Recognition of Prior Learning (RPL)</h3>
                  <p className="text-charcoal mb-4">
                    Have relevant work experience or previous qualifications? You may be eligible for credit toward your certification.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start text-charcoal">
                      <CheckBadgeIcon className="h-5 w-5 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>5+ years relevant experience</strong> may earn up to 50% program credit</span>
                    </li>
                    <li className="flex items-start text-charcoal">
                      <CheckBadgeIcon className="h-5 w-5 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Previous academic qualifications</strong> from accredited institutions</span>
                    </li>
                    <li className="flex items-start text-charcoal">
                      <CheckBadgeIcon className="h-5 w-5 text-forest-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Demonstrated competencies</strong> through portfolio assessment</span>
                    </li>
                  </ul>
                  <button className="inline-flex items-center px-6 py-3 bg-forest-600 text-white rounded-md font-semibold hover:bg-forest-700 transition-colors">
                    Apply for RPL Assessment
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start Your Certification Journey Today
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of certified members advancing their knowledge and careers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/courses"
                className="inline-flex items-center px-8 py-3 bg-white text-primary-700 rounded-md font-semibold hover:bg-primary-50 transition-colors"
              >
                <AcademicCapIcon className="mr-2 h-5 w-5" />
                Browse All Courses
              </Link>
              <button className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-md font-semibold hover:bg-white/10 transition-colors">
                <UserGroupIcon className="mr-2 h-5 w-5" />
                Contact Advisor
              </button>
            </div>
            <p className="mt-6 text-sm text-primary-200">
              Questions? Email <a href="mailto:registrar@chitepo.co.zw" className="underline font-semibold">registrar@chitepo.co.zw</a>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}
