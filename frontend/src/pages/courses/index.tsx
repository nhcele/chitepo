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
  CheckBadgeIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TrophyIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import CourseTile from '@/components/ui/CourseTile';
import { CourseDifficulty, Course as ApiCourse } from '@mindelta/shared';
import { listCourses } from '@/lib/api/courses';
import { getCourseCoverImage } from '@/lib/cover-image';
import { enrollInCourse, listMyEnrollments } from '@/lib/api/enrollments';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { id: 'all', name: 'All Courses', count: 26, icon: '🎓', color: 'bg-gradient-to-r from-forest-500 to-terracotta-600' },
  { id: 'core_ideology', name: 'Core Ideological Courses', count: 8, icon: '🔥', color: 'bg-gradient-to-r from-terracotta-500 to-ochre-500', description: 'Foundation in Pan-Africanism and revolutionary theory' },
  { id: 'contemporary_studies', name: 'Contemporary Studies', count: 8, icon: '🌍', color: 'bg-gradient-to-r from-forest-500 to-forest-500', description: 'Modern issues: democracy, gender, environment' },
  { id: 'practical_governance', name: 'Practical Governance Track', count: 6, icon: '🏛️', color: 'bg-gradient-to-r from-terracotta-500 to-terracotta-500', description: 'Training for government officials and party structures' },
  { id: 'diaspora_program', name: 'Diaspora Engagement Program', count: 4, icon: '✈️', color: 'bg-gradient-to-r from-forest-500 to-forest-500', description: 'Virtual training for Zimbabweans abroad' }
];

const filters = {
  difficulty: ['Beginner', 'Intermediate', 'Advanced'],
  duration: ['< 5 hours', '5-15 hours', '15-30 hours', '30+ hours']
};

// Mapping between certification pathways and course categories
const pathwayToCourseCategories: Record<string, string[]> = {
  general: ['core_ideology', 'contemporary_studies'],
  officials: ['practical_governance'],
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
    color: 'from-forest-500 to-forest-700',
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
    color: 'from-terracotta-500 to-terracotta-700',
    courseCategories: ['practical_governance'],
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
    color: 'from-forest-500 to-forest-700',
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
    color: 'from-terracotta-500 to-terracotta-700',
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

type CourseCardData = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  students: number;
  category: string;
  categoryIds: string[];
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  coverImage: string;
  enrolled?: boolean;
  progress?: number;
};

const coreIdeologyCourseTitles = new Set([
  'Pan-Africanism and African Unity',
  'Revolutionary Theory and Practice',
  'Political Economy and Development',
  'Leadership and Governance',
  'African History and Liberation Heritage',
  'Social Transformation and Nation Building',
  'International Relations and Diplomacy',
  'Political Philosophy and Ideology'
]);

const contemporaryStudiesCourseTitles = new Set([
  'Contemporary African Politics and Democracy',
  'Gender Studies and Feminism in Africa',
  'Environmental Justice and Climate Policy',
  'Youth Leadership and Empowerment',
  'Pan-African Media and Communication',
  'African Languages and Cultural Studies',
  'Security Studies and Conflict Resolution',
  'Human Rights and Social Movements'
]);

const practicalGovernanceCourseTitles = new Set([
  'District Coordinating Committee (DCC) Training',
  'Local Government Administration and Service Delivery',
  'Electoral Campaign Management and Voter Mobilization',
  'Rural Development and Community Engagement',
  'Party-Government Coordination',
  'Vision 2030 and National Development Strategy'
]);

const diasporaProgramCourseTitles = new Set([
  'Virtual Political Engagement and Diaspora Mobilization',
  'Cultural Heritage and Identity Preservation',
  'Investment and Economic Participation',
  'Advocacy and International Relations'
]);

const legacyCategoryToCourseCategory: Record<string, string> = {
  'African Studies': 'core_ideology',
  'Political Theory': 'core_ideology',
  Economics: 'core_ideology',
  Governance: 'core_ideology',
  History: 'core_ideology',
  'International Relations': 'core_ideology',
  Philosophy: 'core_ideology',
  'Social Policy': 'contemporary_studies',
  'Gender Studies': 'contemporary_studies',
  Environment: 'contemporary_studies',
  Youth: 'contemporary_studies',
  Media: 'contemporary_studies',
  Culture: 'contemporary_studies',
  Security: 'contemporary_studies',
  'Human Rights': 'contemporary_studies'
};

function normalizeCourseCategories(course: ApiCourse & { category?: string; tags?: string[] }) {
  const categoryIds = new Set<string>();

  if (course.category) {
    const normalizedCategory = legacyCategoryToCourseCategory[course.category] || course.category;
    if (categories.some((category) => category.id === normalizedCategory)) {
      categoryIds.add(normalizedCategory);
      if (normalizedCategory === 'practical_governance' || normalizedCategory === 'diaspora_program') {
        return Array.from(categoryIds);
      }
    }
  }

  if (coreIdeologyCourseTitles.has(course.title)) {
    categoryIds.add('core_ideology');
  }

  if (contemporaryStudiesCourseTitles.has(course.title)) {
    categoryIds.add('contemporary_studies');
  }

  if (practicalGovernanceCourseTitles.has(course.title)) {
    categoryIds.add('practical_governance');
  }

  if (diasporaProgramCourseTitles.has(course.title)) {
    categoryIds.add('diaspora_program');
  }

  const tags = course.tags || [];
  const tagText = tags.join(' ');
  const isDiaspora = tags.some((tag) => /diaspora/i.test(tag));
  if (isDiaspora) {
    categoryIds.add('diaspora_program');
  }
  if (
    !isDiaspora
    && /dcc|district coordinating|local government|municipal administration|service delivery|council management|devolution|rural development|party-government|vision 2030/i.test(tagText)
  ) {
    categoryIds.add('practical_governance');
  }

  return Array.from(categoryIds);
}

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
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [allCourses, setAllCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [selectedPathway, setSelectedPathway] = useState(pathways[0]);
  const [pathwayFilter, setPathwayFilter] = useState<string | null>(null);

  const courseMatchesDuration = (course: CourseCardData, duration: string) => {
    const hours = course.estimatedDuration / 60;
    switch (duration) {
      case '< 5 hours':
        return hours < 5;
      case '5-15 hours':
        return hours >= 5 && hours <= 15;
      case '15-30 hours':
        return hours > 15 && hours <= 30;
      case '30+ hours':
        return hours > 30;
      default:
        return true;
    }
  };

  useEffect(() => {
    if (router.query.tab === 'certifications') {
      setActiveTab('certifications');
    } else if (router.query.tab === 'courses') {
      setActiveTab('courses');
    }
    
    if (router.query.category && typeof router.query.category === 'string') {
      const categoryExists = categories.some((category) => category.id === router.query.category);
      if (categoryExists) {
        setSelectedCategory(router.query.category);
        setPathwayFilter(null);
      }
    }

    // Handle pathway filter from URL
    if (router.query.pathway && typeof router.query.pathway === 'string') {
      setPathwayFilter(router.query.pathway);
    }
  }, [router.query.tab, router.query.pathway, router.query.category]);

  const mapApiToCard = (c: ApiCourse & { instructor?: { firstName?: string; lastName?: string; name?: string }; category?: string; tags?: string[] }) => {
    // Build instructor name from firstName and lastName, or use name field, or default
    let instructorName = 'Chitepo Instructor';
    if (c.instructor) {
      if (c.instructor.firstName && c.instructor.lastName) {
        instructorName = `${c.instructor.firstName} ${c.instructor.lastName}`;
      } else if (c.instructor.name) {
        instructorName = c.instructor.name;
      }
    }
    const categoryIds = normalizeCourseCategories(c);
    const primaryCategory = categoryIds[0] || c.category || (c as any).tags?.[0] || 'General';

    return {
      id: c.id,
      title: c.title,
      description: c.subtitle || '',
      instructor: instructorName,
      rating: typeof (c as any).averageRating === 'number' ? (c as any).averageRating : 0,
      students: typeof (c as any).totalEnrollments === 'number' ? (c as any).totalEnrollments : 0,
      category: primaryCategory,
      categoryIds,
      difficulty: c.difficulty,
      estimatedDuration: c.estimatedDuration || 0,
      coverImage: getCourseCoverImage(c.title, (c as any).coverImageUrl) || placeholderCover,
      enrolled: false,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [apiCourses, enrollments] = await Promise.all([
          listCourses(),
          isAuthenticated ? listMyEnrollments().catch(() => []) : Promise.resolve([]),
        ]);
        const enrollmentByCourseId = new Map(
          (enrollments as any[]).map((enrollment) => [enrollment.courseId, enrollment])
        );
        const mapped = (apiCourses as any[]).map((c) => mapApiToCard(c));
        setAllCourses(
          mapped.map((course) => {
            const enrollment = enrollmentByCourseId.get(course.id);
            return enrollment
              ? {
                  ...course,
                  enrolled: true,
                  progress: Math.round(Number(enrollment.progressPercent ?? enrollment.progressPercentage ?? 0)),
                }
              : course;
          })
        );
      } catch (e: any) {
        console.error('Failed to load courses:', e?.message || e);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  // Filter courses when pathway filter changes
  useEffect(() => {
    if (pathwayFilter && pathwayFilter !== 'all') {
      const pathway = pathways.find(p => p.id === pathwayFilter);
      if (pathway && pathway.courseCategories) {
        setSelectedCategory('all');
      }
    } else if (pathwayFilter === 'all' || !pathwayFilter) {
      setSelectedCategory('all');
    }
  }, [pathwayFilter]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const pathway = pathwayFilter && pathwayFilter !== 'all'
      ? pathways.find((p) => p.id === pathwayFilter)
      : null;

    const filtered = allCourses.filter((course) => {
      const matchesPathway = pathway?.courseCategories
        ? pathway.courseCategories.some((categoryId) => course.categoryIds.includes(categoryId))
        : true;

      const matchesCategory = selectedCategory === 'all'
        || course.categoryIds.includes(selectedCategory);

      const matchesSearch = !query
        || course.title.toLowerCase().includes(query)
        || course.description.toLowerCase().includes(query)
        || course.instructor.toLowerCase().includes(query);

      const matchesDifficulty = selectedFilters.difficulty.length === 0
        || selectedFilters.difficulty.some(
          (difficulty) => difficulty.toLowerCase() === String(course.difficulty).toLowerCase()
        );

      const matchesDuration = selectedFilters.duration.length === 0
        || selectedFilters.duration.some((duration) => courseMatchesDuration(course, duration));

      return matchesPathway && matchesCategory && matchesSearch && matchesDifficulty && matchesDuration;
    });

    setCourses(filtered);
  }, [allCourses, selectedCategory, searchQuery, selectedFilters, pathwayFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPathwayFilter(null); // Clear pathway filter when manually selecting category
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
      pathway.courseCategories?.some((categoryId) => course.categoryIds.includes(categoryId))
    ).length;
    
    return (
      <div className="mb-6 bg-gradient-to-r from-primary-50 to-forest-50 border-l-4 border-primary-500 p-4 rounded-r-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-charcoal">
                {pathway.icon} {pathway.name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {pathwayCourseCount} {pathwayCourseCount === 1 ? 'course' : 'courses'}
              </span>
            </div>
            <p className="text-sm text-stone">
              {pathway.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pathway.courseCategories?.map((cat) => {
                const category = categories.find(c => c.id === cat);
                return category ? (
                  <span key={cat} className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-white border border-border/60">
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
            }}
            className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
          >
            Clear Filter
          </button>
        </div>
      </div>
    );
  };

    const getCategoryCourseCount = (categoryId: string) => {
    if (categoryId === 'all') return allCourses.length;
    return allCourses.filter((course) => course.categoryIds.includes(categoryId)).length;
  };

  const categoryNameForId = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '';
  };

  return (
    <>
      <Head>
        <title>Explore courses — Chitepo</title>
        <meta name="description" content="Explore courses and certification pathways at the Chitepo School of Ideology." />
      </Head>
      <AppLayout>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal leading-tight mb-4"
              >
                Explore the curriculum
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-stone leading-relaxed mb-8"
              >
                Courses and certification pathways in Pan-Africanism, revolutionary theory, governance, and African liberation heritage.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative max-w-xl"
              >
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pewter" />
                <input
                  type="text"
                  placeholder="Search courses, certifications, or topics..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 text-sm text-charcoal bg-cream border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="sticky top-16 z-30 bg-cream/95 backdrop-blur border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1">
              {(['courses', 'certifications'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-forest-600 text-forest-600'
                      : 'border-transparent text-stone hover:text-charcoal hover:border-border/60'
                  }`}
                >
                  {tab === 'courses' ? `Courses (${courses.length})` : `Certification pathways (${pathways.length})`}
                </button>
              ))}
            </nav>
          </div>
        </section>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Pathway Filter */}
            {pathwayFilter && pathwayFilter !== 'all' && (
              <div className="mb-8 p-5 bg-forest-100 border-l-4 border-forest-600 rounded-r-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">
                      {pathways.find(p => p.id === pathwayFilter)?.name || 'Pathway'}
                    </h3>
                    <p className="text-sm text-stone">
                      {pathways.find(p => p.id === pathwayFilter)?.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPathwayFilter(null);
                      setSelectedCategory('all');
                    }}
                    className="text-sm font-semibold text-forest-600 hover:text-forest-500 whitespace-nowrap transition-colors"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="mb-10">
              <h2 className="font-serif text-2xl font-semibold text-charcoal mb-5">Course categories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {categories.map((category) => {
                  const count = getCategoryCourseCount(category.id);
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`p-4 text-left rounded-md border transition-all ${
                        isSelected
                          ? 'bg-forest-600 border-forest-600 text-white'
                          : 'bg-paper border-border/60 hover:border-forest-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h3 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-charcoal'}`}>
                          {category.name}
                        </h3>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-cream/80' : 'text-pewter'}`}>
                          {count}
                        </span>
                      </div>
                      {category.description && (
                        <p className={`text-xs ${isSelected ? 'text-cream/80' : 'text-stone'}`}>
                          {category.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters toggle */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone">
                Showing <span className="font-semibold text-charcoal">{courses.length}</span> courses
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal border border-border/60 rounded-md hover:bg-forest-100 transition-colors"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-paper border border-border/60 rounded-md p-6 mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(filters).map(([filterType, options]) => (
                    <div key={filterType}>
                      <h3 className="font-semibold text-charcoal mb-3 capitalize">
                        {filterType.replace('-', ' ')}
                      </h3>
                      <div className="space-y-2">
                        {options.map((option) => (
                          <label key={option} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFilters[filterType as keyof typeof selectedFilters].includes(option)}
                              onChange={() => toggleFilter(filterType as keyof typeof selectedFilters, option)}
                              className="w-4 h-4 rounded border-stone/30 text-forest-600 focus:ring-forest-600"
                            />
                            <span className="text-sm text-charcoal">{option}</span>
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
              <div className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100/50 rounded-r-md">
                <p className="text-sm text-terracotta-700">{enrollError}</p>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-terracotta-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <CourseTile
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      instructor={course.instructor}
                      category={categoryNameForId(course.categoryIds[0]) || course.category}
                      difficulty={course.difficulty}
                      estimatedDuration={course.estimatedDuration}
                      students={course.students}
                      coverImage={course.coverImage}
                      enrolled={course.enrolled}
                      progress={course.progress}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {courses.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="font-serif text-xl font-semibold text-charcoal mb-2">No courses found</p>
                <p className="text-stone">Try adjusting your search or filters.</p>
              </div>
            )}
          </section>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Benefits */}
            <div className="mb-16">
              <h2 className="font-serif text-3xl font-semibold text-charcoal mb-4 text-center">
                Progressive certification pathways
              </h2>
              <p className="text-stone text-center max-w-3xl mx-auto mb-10">
                Credentials for ideological education, governance excellence, diaspora leadership, youth empowerment, and women&apos;s advancement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-paper border border-border/60 rounded-md p-5 text-center"
                  >
                    <benefit.icon className="h-8 w-8 mx-auto mb-3 text-forest-600" />
                    <h3 className="font-semibold text-charcoal mb-1">{benefit.title}</h3>
                    <p className="text-sm text-stone">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pathway selector */}
            <div className="mb-10">
              <h2 className="font-serif text-2xl font-semibold text-charcoal mb-5">Choose your pathway</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {pathways.map((pathway) => {
                  const isSelected = selectedPathway.id === pathway.id;
                  return (
                    <button
                      key={pathway.id}
                      onClick={() => setSelectedPathway(pathway)}
                      className={`p-4 rounded-md border text-left transition-all ${
                        isSelected
                          ? 'bg-forest-600 border-forest-600 text-white'
                          : 'bg-paper border-border/60 hover:border-forest-400'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-forest-100 text-forest-600'
                      }`}>
                        {pathway.name.charAt(0)}
                      </div>
                      <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-charcoal'}`}>
                        {pathway.name.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Pathway Details */}
            <motion.div
              key={selectedPathway.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-paper border border-border/60 rounded-md overflow-hidden mb-12"
            >
              <div className="bg-forest-700 p-8 text-cream">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="font-serif text-2xl font-semibold mb-2">{selectedPathway.name}</h3>
                    <p className="text-cream/80 mb-5">{selectedPathway.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPathway.courseCategories?.map((cat) => {
                        const category = categories.find(c => c.id === cat);
                        const courseCount = getCategoryCourseCount(cat);
                        return category ? (
                          <span
                            key={cat}
                            className="inline-flex items-center text-xs px-3 py-1.5 rounded-full bg-cream/10 border border-cream/20"
                          >
                            {category.name} ({courseCount})
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-3xl font-semibold">{selectedPathway.levels.length}</div>
                    <div className="text-xs uppercase tracking-wider text-cream/60">Levels</div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {selectedPathway.levels.map((level, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="border-l-4 border-forest-600 pl-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-forest-100 rounded-full flex items-center justify-center text-forest-600 font-bold text-sm">
                            {level.level}
                          </div>
                          <div>
                            <h4 className="font-semibold text-charcoal">{level.title}</h4>
                            {level.mandatory && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-terracotta-100 text-terracotta-700 text-xs font-semibold rounded">
                                Mandatory: {level.mandatory}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center text-sm text-stone mb-1">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {level.duration}
                          </div>
                          <div className="flex items-center text-sm font-semibold text-forest-600">
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

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleBrowseCoursesFromPathway(selectedPathway.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                  >
                    <AcademicCapIcon className="h-5 w-5" />
                    Browse courses
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-forest-600 border border-forest-600 rounded-md hover:bg-forest-100 transition-colors">
                    <DocumentTextIcon className="h-5 w-5" />
                    Download guide
                  </button>
                </div>
              </div>
            </motion.div>

            {/* RPL */}
            <div className="bg-paper border border-border/60 rounded-md p-8 mb-12">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-forest-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <CheckBadgeIcon className="h-6 w-6 text-forest-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl font-semibold text-charcoal mb-3">
                    Recognition of Prior Learning
                  </h3>
                  <p className="text-stone mb-5">
                    Have relevant work experience or previous qualifications? You may be eligible for credit toward your certification.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      '5+ years relevant experience may earn up to 50% program credit',
                      'Previous academic qualifications from accredited institutions',
                      'Demonstrated competencies through portfolio assessment',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-stone">
                        <CheckBadgeIcon className="h-5 w-5 text-forest-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors">
                    Apply for RPL assessment
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-forest-700 rounded-md p-8 lg:p-12 text-center">
              <h2 className="font-serif text-3xl font-semibold text-cream mb-4">
                Start your certification journey
              </h2>
              <p className="text-cream/80 mb-8 max-w-2xl mx-auto">
                Join thousands of certified members advancing their knowledge and careers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setActiveTab('courses');
                    setPathwayFilter(null);
                    setSelectedCategory('all');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                  Browse all courses
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-cream border border-cream/30 rounded-md hover:bg-cream/10 transition-colors">
                  <UserGroupIcon className="h-5 w-5" />
                  Contact advisor
                </button>
              </div>
              <p className="mt-6 text-sm text-cream/60">
                Questions? Email{' '}
                <a href="mailto:registrar@chitepo.co.zw" className="underline font-semibold">
                  registrar@chitepo.co.zw
                </a>
              </p>
            </div>
          </section>
        )}
      </AppLayout>
    </>
  );
}
