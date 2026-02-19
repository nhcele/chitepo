import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import CourseCard from '@/components/learner/CourseCard';
import { CourseDifficulty, Course as ApiCourse } from '@mindelta/shared';
import { listCourses } from '@/lib/api/courses';
import { getCourseCoverImage } from '@/lib/cover-image';
import { enrollInCourse } from '@/lib/api/enrollments';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { id: 'all', name: 'All Courses', count: 26, icon: '🎓', color: 'bg-gradient-to-r from-blue-500 to-purple-600' },
  { id: 'core_ideology', name: 'Core Ideological Courses', count: 8, icon: '🔥', color: 'bg-gradient-to-r from-red-500 to-orange-500', description: 'Foundation in Pan-Africanism and revolutionary theory' },
  { id: 'contemporary_studies', name: 'Contemporary Studies', count: 8, icon: '🌍', color: 'bg-gradient-to-r from-green-500 to-teal-500', description: 'Modern issues: democracy, gender, environment' },
  { id: 'practical_governance', name: 'Practical Governance Track', count: 6, icon: '🏛️', color: 'bg-gradient-to-r from-purple-500 to-pink-500', description: 'Training for government officials and party structures' },
  { id: 'diaspora_program', name: 'Diaspora Engagement Program', count: 4, icon: '✈️', color: 'bg-gradient-to-r from-indigo-500 to-blue-500', description: 'Virtual training for Zimbabweans abroad' }
];

const filters = {
  difficulty: ['Beginner', 'Intermediate', 'Advanced'],
  duration: ['< 5 hours', '5-15 hours', '15-30 hours', '30+ hours']
};

// Mapping between certification pathways and course categories
const pathwayToCourseCategories: Record<string, string[]> = {
  general: ['core_ideology', 'contemporary_studies'],
  officials: ['practical_governance', 'core_ideology'],
  diaspora: ['diaspora_program', 'core_ideology'],
  youth: ['core_ideology', 'contemporary_studies'],
  women: ['contemporary_studies', 'core_ideology']
};

const pathways = [
  {
    id: 'general',
    name: 'General Ideological Education',
    icon: '🎓',
    description: 'For party members, general public, youth, and interested citizens',
    color: 'from-blue-500 to-blue-700',
    courseCategories: ['core_ideology', 'contemporary_studies'],
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
    color: 'from-red-500 to-red-700',
    courseCategories: ['practical_governance', 'core_ideology'],
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
    color: 'from-purple-500 to-purple-700',
    courseCategories: ['diaspora_program', 'core_ideology'],
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
    color: 'from-green-500 to-green-700',
    courseCategories: ['core_ideology', 'contemporary_studies'],
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
    color: 'from-pink-500 to-pink-700',
    courseCategories: ['contemporary_studies', 'core_ideology'],
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

const placeholderCover = '/api/placeholder/400/225';

export default function LearningPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications'>('courses');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: [] as string[],
    duration: [] as string[]
  });
  const [courses, setCourses] = useState<Array<{ id: string; title: string; description: string; instructor: string; rating: number; students: number; category: string; difficulty: CourseDifficulty; estimatedDuration: number; coverImage: string; enrolled?: boolean }>>([]);
  const [allCourses, setAllCourses] = useState<Array<{ id: string; title: string; description: string; instructor: string; rating: number; students: number; category: string; difficulty: CourseDifficulty; estimatedDuration: number; coverImage: string; enrolled?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [selectedPathway, setSelectedPathway] = useState(pathways[0]);
  const [pathwayFilter, setPathwayFilter] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.tab === 'certifications') {
      setActiveTab('certifications');
    } else if (router.query.tab === 'courses') {
      setActiveTab('courses');
    }
    
    // Handle pathway filter from URL
    if (router.query.pathway && typeof router.query.pathway === 'string') {
      setPathwayFilter(router.query.pathway);
    }
  }, [router.query.tab, router.query.pathway]);

  const mapApiToCard = (c: ApiCourse & { instructor?: { name?: string }; category?: string }) => ({
    id: c.id,
    title: c.title,
    description: c.subtitle || '',
    instructor: c.instructor?.name || 'Mindelta Instructor',
    rating: typeof (c as any).averageRating === 'number' ? (c as any).averageRating : 4.7,
    students: typeof (c as any).totalEnrollments === 'number' ? (c as any).totalEnrollments : 0,
    category: c.category || (c as any).tags?.[0] || 'General',
    difficulty: c.difficulty,
    estimatedDuration: c.estimatedDuration || 0,
    coverImage: getCourseCoverImage(c.title, (c as any).coverImageUrl) || placeholderCover,
    enrolled: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const apiCourses = await listCourses();
        const mapped = (apiCourses as any[]).map((c) => mapApiToCard(c));
        setAllCourses(mapped);
        setCourses(mapped);
      } catch (e: any) {
        console.error('Failed to load courses:', e?.message || e);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter courses when pathway filter changes
  useEffect(() => {
    if (pathwayFilter && pathwayFilter !== 'all') {
      const pathway = pathways.find(p => p.id === pathwayFilter);
      if (pathway && pathway.courseCategories) {
        const filtered = allCourses.filter(course => 
          pathway.courseCategories.includes(course.category)
        );
        setCourses(filtered);
        // Set the first matching category as selected
        if (pathway.courseCategories.length > 0) {
          setSelectedCategory(pathway.courseCategories[0]);
        }
      }
    } else if (pathwayFilter === 'all' || !pathwayFilter) {
      setCourses(allCourses);
      setSelectedCategory('all');
    }
  }, [pathwayFilter, allCourses]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(query.toLowerCase()) ||
      course.description.toLowerCase().includes(query.toLowerCase()) ||
      course.instructor.toLowerCase().includes(query.toLowerCase())
    );
    setCourses(filtered);
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPathwayFilter(null); // Clear pathway filter when manually selecting category
    setLoading(true);
    try {
      if (categoryId === 'all') {
        setCourses(allCourses);
      } else {
        // Filter from allCourses instead of making API call
        const filtered = allCourses.filter(course => course.category === categoryId);
        setCourses(filtered);
      }
    } catch (e: any) {
      console.error('Failed to filter courses:', e?.message || e);
      setError('Failed to filter courses');
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseCoursesFromPathway = (pathwayId: string) => {
    setActiveTab('courses');
    setPathwayFilter(pathwayId);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (enrollingId) return;
    setEnrollError(null);
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c)));
      setAllCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c)));
    } catch (e: any) {
      console.error('Failed to enroll:', e?.message || e);
      setEnrollError(e?.message || 'Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  const toggleFilter = (type: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const getPathwayCoursesDescription = () => {
    if (!pathwayFilter || pathwayFilter === 'all') return null;
    const pathway = pathways.find(p => p.id === pathwayFilter);
    if (!pathway) return null;
    
    const pathwayCourseCount = allCourses.filter(course => 
      pathway.courseCategories?.includes(course.category)
    ).length;
    
    return (
      <div className="mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border-l-4 border-primary-500 p-4 rounded-r-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {pathway.icon} {pathway.name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {pathwayCourseCount} {pathwayCourseCount === 1 ? 'course' : 'courses'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {pathway.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pathway.courseCategories?.map((cat) => {
                const category = categories.find(c => c.id === cat);
                return category ? (
                  <span key={cat} className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-white border border-gray-200">
                    {category.icon} {category.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <button
            onClick={() => {
              setPathwayFilter(null);
              setSelectedCategory('all');
              setCourses(allCourses);
            }}
            className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
          >
            Clear Filter
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Learning - Courses & Certifications | Chitepo School of Ideology</title>
        <meta name="description" content="Explore courses and certification pathways at the Chitepo School of Ideology - Pan-Africanism, Revolutionary Theory, Leadership, and African Liberation Heritage." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Chitepo School of Ideology
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Master Pan-Africanism, Revolutionary Theory, Leadership, and African Political Philosophy 
                through our comprehensive curriculum and progressive certification pathways.
              </p>
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses, certifications, or topics..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'courses'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AcademicCapIcon className="h-5 w-5" />
                  <span>Courses ({courses.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('certifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'certifications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="h-5 w-5" />
                  <span>Certification Pathways ({pathways.length})</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Courses Tab Content */}
        {activeTab === 'courses' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Pathway Filter Display */}
            {getPathwayCoursesDescription()}
            
            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      selectedCategory === category.id
                        ? `${category.color} text-white shadow-lg scale-105`
                        : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className={`font-semibold mb-1 ${selectedCategory === category.id ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className={`text-xs mb-2 ${selectedCategory === category.id ? 'text-white/90' : 'text-gray-600'}`}>
                        {category.description}
                      </p>
                    )}
                    <span className={`text-sm font-medium ${selectedCategory === category.id ? 'text-white' : 'text-primary-600'}`}>
                      {category.count} courses
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {courses.length} courses
                </p>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 rounded-lg p-6 mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(filters).map(([filterType, options]) => (
                    <div key={filterType}>
                      <h3 className="font-medium text-gray-900 mb-3 capitalize">
                        {filterType.replace('-', ' ')}
                      </h3>
                      <div className="space-y-2">
                        {options.map((option) => (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedFilters[filterType as keyof typeof selectedFilters].includes(option)}
                              onChange={() => toggleFilter(filterType as keyof typeof selectedFilters, option)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Course Grid */}
            {enrollError && (
              <div className="mb-4 text-sm text-red-600">{enrollError}</div>
            )}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CourseCard course={course} onEnroll={handleEnroll} loading={enrollingId === course.id} />
                  </motion.div>
                ))}
              </div>
            )}

            {courses.length === 0 && !loading && (
              <div className="text-center py-12">
                <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">Try adjusting your search or filters to find more courses.</p>
              </div>
            )}
          </div>
        )}

        {/* Certifications Tab Content */}
        {activeTab === 'certifications' && (
          <>
            {/* Benefits Grid */}
            <div className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-primary-600" />
                  <h2 className="text-3xl font-bold mb-4">Progressive Certification Pathways</h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Progressive credentials for ideological education, governance excellence, diaspora leadership, 
                    youth empowerment, and women's advancement.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white p-6 rounded-lg shadow-md text-center"
                    >
                      <benefit.icon className="h-10 w-10 mx-auto mb-3 text-primary-600" />
                      <h3 className="font-bold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
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
                  <p className="text-gray-600">Select the track that matches your role and goals</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                  {pathways.map((pathway) => (
                    <button
                      key={pathway.id}
                      onClick={() => setSelectedPathway(pathway)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPathway.id === pathway.id
                          ? 'border-primary-500 bg-primary-50 scale-105'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">{pathway.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{pathway.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>

                {/* Selected Pathway Details */}
                <motion.div
                  key={selectedPathway.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg shadow-xl overflow-hidden"
                >
                  <div className={`bg-gradient-to-r ${selectedPathway.color} p-8 text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-5xl mb-4">{selectedPathway.icon}</div>
                        <h3 className="text-3xl font-bold mb-2">{selectedPathway.name}</h3>
                        <p className="text-lg text-white/90 mb-4">{selectedPathway.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPathway.courseCategories?.map((cat) => {
                            const category = categories.find(c => c.id === cat);
                            const courseCount = allCourses.filter(course => course.category === cat).length;
                            return category ? (
                              <span key={cat} className="inline-flex items-center text-xs px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                {category.icon} {category.name} ({courseCount})
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="text-right ml-4">
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
                                <h4 className="text-lg font-bold text-gray-900">{level.title}</h4>
                                {level.mandatory && (
                                  <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold">
                                    MANDATORY: {level.mandatory}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-sm text-gray-600 mb-1">
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
                              <span className="font-semibold text-gray-700">Courses:</span>
                              <p className="text-gray-600">{level.courses}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Requirement:</span>
                              <p className="text-gray-600">{level.requirement}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Outcome:</span>
                              <p className="text-gray-600">{level.outcome}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-8 flex gap-4">
                      <button 
                        onClick={() => handleBrowseCoursesFromPathway(selectedPathway.id)}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        <AcademicCapIcon className="mr-2 h-5 w-5" />
                        Browse Courses
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                        <DocumentTextIcon className="mr-2 h-5 w-5" />
                        Download Guide
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Recognition of Prior Learning */}
            <div className="py-16 bg-gray-50">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="flex items-start">
                    <CheckBadgeIcon className="h-12 w-12 text-green-600 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Recognition of Prior Learning (RPL)</h3>
                      <p className="text-gray-700 mb-4">
                        Have relevant work experience or previous qualifications? You may be eligible for credit toward your certification.
                      </p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-start text-gray-700">
                          <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span><strong>5+ years relevant experience</strong> may earn up to 50% program credit</span>
                        </li>
                        <li className="flex items-start text-gray-700">
                          <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span><strong>Previous academic qualifications</strong> from accredited institutions</span>
                        </li>
                        <li className="flex items-start text-gray-700">
                          <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span><strong>Demonstrated competencies</strong> through portfolio assessment</span>
                        </li>
                      </ul>
                      <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
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
                  <button 
                    onClick={() => {
                      setActiveTab('courses');
                      setPathwayFilter(null);
                      setSelectedCategory('all');
                      setCourses(allCourses);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center px-8 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                  >
                    <AcademicCapIcon className="mr-2 h-5 w-5" />
                    Browse All Courses
                  </button>
                  <button className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                    <UserGroupIcon className="mr-2 h-5 w-5" />
                    Contact Advisor
                  </button>
                </div>
                <p className="mt-6 text-sm text-primary-200">
                  Questions? Email <a href="mailto:registrar@chitepo.edu.zw" className="underline font-semibold">registrar@chitepo.edu.zw</a>
                </p>
              </div>
            </div>
          </>
        )}
      </Layout>
    </>
  );
}
