import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  PlayIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import CourseCard from '@/components/CourseCard';
import { CourseDifficulty, Course as ApiCourse } from '@mindelta/shared';
import { listCourses } from '@/lib/api/courses';
import { getCourseCoverImage } from '@/lib/cover-image';

const features = [
  {
    name: 'Pan-African Philosophy',
    description: 'Deep exploration of African unity, liberation, and revolutionary theory rooted in continental thought.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Revolutionary Leadership',
    description: 'Develop transformative leadership skills grounded in African political philosophy and governance.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Historical Perspective',
    description: 'Comprehensive study of African liberation heritage, anti-colonial struggles, and social movements.',
    icon: ChartBarIcon,
  },
];

const stats = [
  { name: 'Course Modules', value: '16' },
  { name: 'Legacy Since', value: '1975' },
  { name: 'Pan-African Focus', value: '100%' },
  { name: 'Political Traditions', value: '50+' },
];

type FeaturedCard = { id: string; title: string; subtitle: string; instructor: string; rating: number; students: number; duration: number; coverImage: string; difficulty: CourseDifficulty };

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const placeholderCover = '/api/placeholder/400/225';
  const mapApiToCard = (c: ApiCourse & { instructor?: { name?: string } }): FeaturedCard => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle || '',
    instructor: c.instructor?.name || 'Chitepo School Faculty',
    rating: typeof (c as any).averageRating === 'number' ? (c as any).averageRating : 0,
    students: typeof (c as any).totalEnrollments === 'number' ? (c as any).totalEnrollments : 0,
    duration: c.estimatedDuration || 0,
    coverImage: getCourseCoverImage(c.title, (c as any).coverImageUrl) || placeholderCover,
    difficulty: c.difficulty,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await listCourses();
        // Get top 3 most popular courses
        const sorted = (all as any[])
          .filter(Boolean)
          .sort((a, b) => ((b.totalEnrollments || 0) - (a.totalEnrollments || 0)));
        const top = sorted.slice(0, 3).map((c) => mapApiToCard(c));
        setFeaturedCourses(top);
      } catch (e: any) {
        console.error('Failed to load featured courses:', e?.message || e);
        setError('Failed to load featured courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Head>
        <title>Chitepo School of Ideology - Pan-African Political Education</title>
        <meta name="description" content="Master Pan-Africanism, Revolutionary Theory, and African Political Philosophy. Named after Herbert Chitepo, champion of African liberation and unity." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Chitepo School of Ideology
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Pan-African Political Education
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
                Master revolutionary theory, Pan-Africanism, and African political philosophy. 
                Building leaders for African liberation and unity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button href="/courses" size="lg" className="bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold">
                    Explore Curriculum
                  </Button>
                <Button href="/about" 
                    size="lg" 
                    className="border-2 border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    About Herbert Chitepo
                  </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm md:text-base">{stat.name}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Chitepo School of Ideology?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive curriculum rooted in African liberation heritage and revolutionary political thought.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-8 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
                    <feature.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Begin Your Journey
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our comprehensive curriculum in African political philosophy, revolutionary theory, and Pan-African thought.
              </p>
            </div>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-gray-600" role="alert">{error}</div>
            ) : featuredCourses.length === 0 ? (
              <div className="text-center text-gray-600">No courses are available yet — please check back soon.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </div>
            )}
            <div className="text-center mt-12">
              <Button href="/courses" size="lg" className="bg-primary-600 text-white hover:bg-primary-700">
                  View All Courses
                </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Join the Struggle for African Liberation?
              </h2>
              <p className="text-xl mb-8 text-gray-200">
                Become part of a revolutionary tradition dedicated to Pan-African unity, 
                social justice, and the transformation of our continent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button href="/auth/register" 
                    size="lg" 
                    className="bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold"
                  >
                    Begin Your Journey
                  </Button>
                <Button href="/about" 
                    size="lg" 
                    className="border-2 border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    Learn More
                  </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    </>
  );
}
