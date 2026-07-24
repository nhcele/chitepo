import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import {
  StarIcon,
  PlayIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Layout from '@/components/Layout';

interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  expertise: string[];
  featured: boolean;
  joinedDate: string;
  achievements: string[];
}

const featuredInstructors: Instructor[] = [
  {
    id: '1',
    name: 'Dr. Simbarashe Mumbengegwi',
    title: 'Political Ideology & Liberation Heritage Specialist',
    avatar: '/api/placeholder/150/150',
    bio: 'Leading expert on Zimbabwe\'s liberation struggle and political ideology. Former political commissar with extensive experience in grassroots mobilization and ideological education. Dedicated to preserving revolutionary values and training the next generation of political leaders.',
    rating: 4.9,
    totalStudents: 12500,
    totalCourses: 6,
    totalRevenue: 0,
    expertise: ['Political Ideology', 'Liberation Heritage', 'Pan-Africanism', 'Grassroots Organizing'],
    featured: true,
    joinedDate: '2020-01-15',
    achievements: ['Founding Instructor', 'Ideological Excellence', 'Community Impact Award']
  },
  {
    id: '2',
    name: 'Hon. Tafadzwa Mupfumira',
    title: 'Local Government & Municipal Administration Expert',
    avatar: '/api/placeholder/150/150',
    bio: 'Former mayor and municipal director with 20+ years experience in local government administration. Specialized in devolution, service delivery, and urban development. Has trained hundreds of councillors and municipal officials across Zimbabwe.',
    rating: 4.8,
    totalStudents: 8400,
    totalCourses: 3,
    totalRevenue: 0,
    expertise: ['Local Government', 'Municipal Administration', 'Devolution', 'Urban Planning'],
    featured: true,
    joinedDate: '2020-03-20',
    achievements: ['Governance Excellence', 'Most Practical Training', 'Student Choice Award']
  },
  {
    id: '3',
    name: 'Cde. Kudzai Nhema',
    title: 'DCC Training & Political Mobilization Coordinator',
    avatar: '/api/placeholder/150/150',
    bio: 'Veteran political organizer with expertise in District Coordinating Committee operations, voter mobilization, and party-government coordination. Has successfully led electoral campaigns achieving record voter registration numbers.',
    rating: 4.9,
    totalStudents: 15200,
    totalCourses: 4,
    totalRevenue: 0,
    expertise: ['DCC Training', 'Voter Mobilization', 'Campaign Management', 'Party Structures'],
    featured: true,
    joinedDate: '2020-02-10',
    achievements: ['Top Mobilizer 2024', 'Electoral Excellence', 'Innovation in Training']
  },
  {
    id: '4',
    name: 'Dr. Rumbidzai Chikwanha',
    title: 'Rural Development & Agricultural Policy Specialist',
    avatar: '/api/placeholder/150/150',
    bio: 'Agricultural economist and rural development expert. Former director at Ministry of Lands, Agriculture and Rural Development. Passionate about transforming rural areas through sustainable agriculture, infrastructure development, and community empowerment.',
    rating: 4.8,
    totalStudents: 6800,
    totalCourses: 2,
    totalRevenue: 0,
    expertise: ['Rural Development', 'Agriculture', 'Infrastructure', 'Community Development'],
    featured: true,
    joinedDate: '2020-06-15',
    achievements: ['Rural Impact Award', 'Agricultural Excellence', 'Community Champion']
  },
  {
    id: '5',
    name: 'Prof. Tendai Moyo',
    title: 'National Development & Vision 2030 Strategist',
    avatar: '/api/placeholder/150/150',
    bio: 'Economic policy advisor and development strategist. Key architect of Vision 2030 implementation framework. Expert in translating national development goals into actionable provincial and district-level programs.',
    rating: 4.9,
    totalStudents: 9500,
    totalCourses: 2,
    totalRevenue: 0,
    expertise: ['Vision 2030', 'Economic Development', 'Policy Implementation', 'Strategic Planning'],
    featured: true,
    joinedDate: '2020-08-10',
    achievements: ['Policy Excellence', 'Strategic Leadership', 'National Impact Award']
  },
  {
    id: '6',
    name: 'Cde. Nyasha Mutasa',
    title: 'Diaspora Engagement & Transnational Advocacy Coordinator',
    avatar: '/api/placeholder/150/150',
    bio: 'Former diaspora coordinator with experience organizing Zimbabweans in UK, USA, and South Africa. Expert in virtual political engagement, heritage preservation, and diaspora investment mobilization. Passionate about maintaining homeland connections.',
    rating: 4.8,
    totalStudents: 7300,
    totalCourses: 4,
    totalRevenue: 0,
    expertise: ['Diaspora Engagement', 'Virtual Organizing', 'Investment Mobilization', 'Cultural Preservation'],
    featured: true,
    joinedDate: '2020-09-20',
    achievements: ['Diaspora Excellence', 'Global Impact', 'Cultural Ambassador']
  }
];

const stats = [
  { name: 'Expert Instructors', value: '500+', icon: AcademicCapIcon },
  { name: 'Total Students Taught', value: '2.5M+', icon: UserGroupIcon },
  { name: 'Average Rating', value: '4.8/5', icon: StarIcon },
  { name: 'Instructor Earnings', value: '$50M+', icon: CurrencyDollarIcon }
];

export default function InstructorsPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  const isInstructor = isAuthenticated && (user?.role === UserRole.INSTRUCTOR || user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN);

  const allExpertise = Array.from(
    new Set(featuredInstructors.flatMap(instructor => instructor.expertise))
  ).sort();

  const filteredInstructors = featuredInstructors.filter(instructor => {
    const matchesSearch = instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         instructor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         instructor.expertise.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesExpertise = !selectedExpertise || instructor.expertise.includes(selectedExpertise);
    const matchesFeatured = !showFeaturedOnly || instructor.featured;
    
    return matchesSearch && matchesExpertise && matchesFeatured;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>Instructors - Chitepo</title>
        <meta name="description" content="Meet our world-class instructors - industry experts who create engaging, professional courses for mid-career tech professionals." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Learn from Industry Experts
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Our instructors are seasoned professionals from top companies who bring
                real-world experience to every lesson. Join thousands of learners advancing
                their careers with expert guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Start Learning Today
                    </Link>
                    <Link
                      href="/instructor/apply"
                      className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
                    >
                      Become an Instructor
                    </Link>
                  </>
                ) : isInstructor ? (
                  <>
                    <Link
                      href="/instructor/dashboard"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      href="/instructor/courses"
                      className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
                    >
                      Manage Courses
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/learning"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Browse Courses
                    </Link>
                    <Link
                      href="/instructor/apply"
                      className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
                    >
                      Become an Instructor
                    </Link>
                  </>
                )}
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
                  <div className="flex justify-center mb-4">
                    <stat.icon className="h-12 w-12 text-primary-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.name}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructors Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Instructors</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Meet some of our top-rated instructors who are shaping the future of professional learning.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search instructors by name, title, or expertise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedExpertise || ''}
                    onChange={(e) => setSelectedExpertise(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Expertise</option>
                    {allExpertise.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showFeaturedOnly}
                      onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">Featured only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Instructors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredInstructors.map((instructor, index) => (
                <motion.div
                  key={instructor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative">
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      width={400}
                      height={256}
                      className="w-full h-64 object-cover"
                    />
                    {instructor.featured && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-medium rounded-full">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{instructor.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{instructor.title}</p>
                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(instructor.rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {instructor.rating} ({formatNumber(instructor.totalStudents)} students)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{instructor.bio}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {instructor.expertise.slice(0, 4).map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {instructor.expertise.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{instructor.expertise.length - 4} more
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">{instructor.totalCourses}</div>
                        <div>Courses</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{formatNumber(instructor.totalStudents)}</div>
                        <div>Students</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{formatCurrency(instructor.totalRevenue)}</div>
                        <div>Earned</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/instructors/${instructor.id}`}
                        className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/courses?instructor=${instructor.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                      >
                        View Courses
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredInstructors.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors found</h3>
                <p className="text-gray-600">Try adjusting your search or filters to find more instructors.</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Share Your Expertise?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our community of expert instructors and help shape the future of professional learning.
              Earn competitive revenue while making a global impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/instructor/apply"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
                  >
                    Apply to Teach
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
                  >
                    Get Started
                  </Link>
                </>
              ) : isInstructor ? (
                <>
                  <Link
                    href="/instructor/dashboard"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/instructor/courses"
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
                  >
                    Create Course
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/instructor/apply"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
                  >
                    Apply to Teach
                  </Link>
                  <Link
                    href="/learning"
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700"
                  >
                    Browse Courses
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
