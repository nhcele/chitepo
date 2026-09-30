import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import {
  GlobeAltIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ArrowRightIcon,
  HeartIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const streams = [
  {
    id: 'political',
    title: 'Virtual Political Engagement',
    icon: '🗳️',
    duration: '8 weeks',
    description: 'Political participation, digital organizing, and voter mobilization from abroad',
    modules: ['Ideological Foundation', 'Digital Activism', 'Community Organization'],
    color: 'from-forest-500 to-forest-700',
    features: [
      'Voter registration drives',
      'Digital organizing tools',
      'Diaspora branch building',
      'Electoral participation'
    ]
  },
  {
    id: 'heritage',
    title: 'Heritage Preservation',
    icon: '🏛️',
    duration: '6 weeks',
    description: 'Maintaining culture, language, and identity while living abroad',
    modules: ['Cultural Identity', 'Cultural Programming', 'Homeland Connections'],
    color: 'from-forest-500 to-forest-700',
    features: [
      'Language preservation',
      'Saturday schools',
      'Cultural events',
      'Second-generation engagement'
    ]
  },
  {
    id: 'investment',
    title: 'Investment & Economic Participation',
    icon: '💼',
    duration: '10 weeks',
    description: 'Business opportunities and economic contribution to national development',
    modules: ['Economic Overview', 'Investment Opportunities', 'Practical Implementation'],
    color: 'from-terracotta-500 to-terracotta-700',
    features: [
      'Sector-specific opportunities',
      'Remote business management',
      'Remittance optimization',
      'Risk management'
    ]
  },
  {
    id: 'advocacy',
    title: 'Transnational Advocacy',
    icon: '📢',
    duration: '6 weeks',
    description: 'Advocacy for Zimbabwe in host countries and international representation',
    modules: ['Advocacy Fundamentals', 'Practical Skills', 'Campaign Management'],
    color: 'from-terracotta-500 to-terracotta-700',
    features: [
      'Engaging host governments',
      'Media relations',
      'Coalition building',
      'Digital advocacy'
    ]
  }
];

const regions = [
  {
    name: 'Africa',
    countries: ['South Africa', 'Botswana', 'Namibia', 'Mozambique', 'Kenya'],
    members: '15,000+',
    color: 'bg-ochre-500'
  },
  {
    name: 'Europe',
    countries: ['UK', 'Germany', 'Netherlands', 'Belgium'],
    members: '8,000+',
    color: 'bg-forest-500'
  },
  {
    name: 'Americas',
    countries: ['USA', 'Canada'],
    members: '5,000+',
    color: 'bg-forest-500'
  },
  {
    name: 'Asia-Pacific',
    countries: ['Australia', 'New Zealand', 'China', 'UAE'],
    members: '3,000+',
    color: 'bg-terracotta-500'
  }
];

const impactMetrics = [
  { label: 'Diaspora Members', value: '31,000+', icon: UserGroupIcon },
  { label: 'Annual Remittances', value: '$850M', icon: CurrencyDollarIcon },
  { label: 'Diaspora Businesses', value: '450+', icon: BriefcaseIcon },
  { label: 'Cultural Events', value: '200+', icon: CalendarDaysIcon }
];

const certificationLevels = [
  {
    level: 'Level 1',
    title: 'Certificate in Diaspora Engagement',
    duration: '6-8 weeks',
    requirement: 'Complete 1 stream',
    cost: 'USD $50'
  },
  {
    level: 'Level 2',
    title: 'Advanced Certificate in Diaspora Leadership',
    duration: '12-16 weeks',
    requirement: 'Complete 2 streams',
    cost: 'USD $90'
  },
  {
    level: 'Level 3',
    title: 'Diploma in Diaspora Affairs',
    duration: '30 weeks',
    requirement: 'Complete all 4 streams',
    cost: 'USD $150'
  },
  {
    level: 'Level 4',
    title: 'Diaspora Ambassador Certification',
    duration: '6 weeks additional',
    requirement: 'Diploma + demonstrated excellence',
    cost: 'By invitation'
  }
];

const successStories = [
  {
    name: 'Tanya M.',
    location: 'London, UK',
    achievement: 'Organized 500 diaspora members for voter registration, resulting in 350 new registrations',
    stream: 'Political Engagement'
  },
  {
    name: 'Kudzai N.',
    location: 'Toronto, Canada',
    achievement: 'Started a Saturday school teaching Shona to 45 children',
    stream: 'Heritage Preservation'
  },
  {
    name: 'Tinashe D.',
    location: 'Sydney, Australia',
    achievement: 'Started a solar business in Bulawayo, now employing 12 people',
    stream: 'Investment'
  },
  {
    name: 'Rumbi S.',
    location: 'Berlin, Germany',
    achievement: 'Led successful campaign resulting in positive coverage in major German media',
    stream: 'Advocacy'
  }
];

export default function DiasporaPage() {
  return (
    <>
      <Head>
        <title>Diaspora Engagement Program - Chitepo School of Ideology</title>
        <meta name="description" content="Virtual training for Zimbabweans abroad. Political engagement, heritage preservation, investment, and advocacy." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-forest-600 via-forest-700 to-terracotta-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-6">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-semibold">100% Online • Timezone Friendly • Global Community</span>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Diaspora Engagement Program
              </h1>
              <p className="text-xl text-forest-100 max-w-3xl mx-auto mb-8">
                Maintain your connection to Zimbabwe while living abroad. Engage politically, preserve culture, 
                invest economically, and advocate for your homeland from anywhere in the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses?category=diaspora_program" className="inline-flex items-center px-8 py-3 bg-white text-forest-700 rounded-md font-semibold hover:bg-forest-50 transition-colors">
                  Browse Diaspora Courses
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/regional-coordinators" className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-md font-semibold hover:bg-white/10 transition-colors">
                  <MapPinIcon className="mr-2 h-5 w-5" />
                  Find Your Regional Coordinator
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="py-12 bg-paper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {impactMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm text-center"
                >
                  <metric.icon className="h-8 w-8 mx-auto mb-3 text-primary-600" />
                  <div className="text-3xl font-bold text-charcoal mb-1">{metric.value}</div>
                  <div className="text-sm text-stone">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Training Streams */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Four Training Streams</h2>
              <p className="text-stone max-w-2xl mx-auto">
                Choose the stream that matches your interests and goals. All streams are 100% online 
                and designed for working professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {streams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-md shadow-sm overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className={`bg-gradient-to-r ${stream.color} p-6 text-white`}>
                    <div className="text-4xl mb-3">{stream.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{stream.title}</h3>
                    <div className="flex items-center text-sm text-white/90">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      <span>{stream.duration}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-charcoal mb-4">{stream.description}</p>
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-stone mb-2">KEY FEATURES:</h4>
                      <ul className="space-y-2">
                        {stream.features.map((feature, i) => (
                          <li key={i} className="text-sm text-charcoal flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-forest-600 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href={`/courses?category=diaspora_program`} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold">
                      View Course Details
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Hubs */}
        <div className="py-16 bg-paper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Global Network</h2>
              <p className="text-stone">Active diaspora communities in major cities worldwide</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regions.map((region, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm"
                >
                  <div className={`w-12 h-12 ${region.color} rounded-md flex items-center justify-center text-white font-bold text-xl mb-4`}>
                    {region.name[0]}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{region.name}</h3>
                  <p className="text-sm text-stone mb-3">
                    {region.countries.slice(0, 3).join(', ')}
                    {region.countries.length > 3 && `, +${region.countries.length - 3} more`}
                  </p>
                  <div className="text-2xl font-bold text-primary-600">{region.members}</div>
                  <p className="text-xs text-stone">Active members</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Certification Levels */}
        <div className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Certification Pathways</h2>
              <p className="text-stone">Progressive credentials for diaspora leadership</p>
            </div>

            <div className="space-y-6">
              {certificationLevels.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm border-l-4 border-primary-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                          {cert.level}
                        </span>
                        <span className="text-sm text-stone">{cert.duration}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{cert.title}</h3>
                      <p className="text-stone mb-2">
                        <strong>Requirement:</strong> {cert.requirement}
                      </p>
                      <p className="text-stone">
                        <strong>Cost:</strong> {cert.cost}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 bg-forest-50 border border-forest-200 rounded-md p-6">
              <div className="flex items-start">
                <HeartIcon className="h-6 w-6 text-forest-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-forest-900 mb-2">Scholarships Available</h4>
                  <p className="text-forest-800 text-sm">
                    50% discount for students • Full waivers for vulnerable groups • Group discounts (30% off for 5+) • 
                    Recruit 3 friends, get 1 stream free
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="py-16 bg-paper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
              <p className="text-stone">Real impact from diaspora members</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {successStories.map((story, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-md shadow-sm"
                >
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {story.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-charcoal">{story.name}</h4>
                      <p className="text-sm text-stone">{story.location}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-forest-100 text-forest-700 text-xs rounded">
                        {story.stream}
                      </span>
                    </div>
                  </div>
                  <p className="text-charcoal italic">"{story.achievement}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Join 31,000+ Diaspora Members Worldwide
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Stay connected, give back, and help build Zimbabwe from wherever you are
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses?category=diaspora_program" className="inline-flex items-center px-8 py-3 bg-white text-primary-700 rounded-md font-semibold hover:bg-primary-50 transition-colors">
                <AcademicCapIcon className="mr-2 h-5 w-5" />
                Start Learning
              </Link>
              <Link href="/community" className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-md font-semibold hover:bg-white/10 transition-colors">
                <UserGroupIcon className="mr-2 h-5 w-5" />
                Find Your Community
              </Link>
            </div>
            <p className="mt-6 text-sm text-primary-200">
              Questions? Contact <a href="mailto:diaspora@chitepo.co.zw" className="underline font-semibold">diaspora@chitepo.co.zw</a> or 
              WhatsApp <a href="tel:+263-77-DIASPORA" className="underline font-semibold">+263 77 DIASPORA</a>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}
