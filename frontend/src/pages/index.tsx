import { useEffect, useState } from 'react';
import Head from 'next/head';
import LandingLayout from '@/components/layouts/LandingLayout';
import HybridLanding from '@/components/landing/variants/HybridLanding';
import type { FeaturedCourse } from '@/components/landing/data';
import { sampleCourses } from '@/components/landing/data';
import { Course as ApiCourse } from '@mindelta/shared';
import { listCourses } from '@/lib/api/courses';
import { getCourseCoverImage } from '@/lib/cover-image';

export default function Home() {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const placeholderCover = '/api/placeholder/400/225';

  const practicalGovernanceRank = (course: ApiCourse & { category?: string; tags?: string[] }) => {
    const text = [
      course.title,
      course.subtitle,
      course.description,
      course.category,
      ...(course.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (/dcc|district coordinating|local government|ward|councillor|rural development/.test(text)) return 3;
    if (/governance|public service|community engagement|mobilization|party/.test(text)) return 2;
    if (/leadership|development/.test(text)) return 1;
    return 0;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await listCourses();
        const sorted = (all as any[])
          .filter(Boolean)
          .sort((a, b) => {
            const rankDelta = practicalGovernanceRank(b) - practicalGovernanceRank(a);
            return rankDelta || (b.totalEnrollments || 0) - (a.totalEnrollments || 0);
          });
        const top = sorted.slice(0, 3).map(
          (c: ApiCourse & { instructor?: { name?: string } }): FeaturedCourse => ({
            id: c.id,
            title: c.title,
            subtitle: c.subtitle || '',
            instructor: c.instructor?.name || 'Chitepo School Faculty',
            duration: c.estimatedDuration || 0,
            coverImage: getCourseCoverImage(c.title, (c as any).coverImageUrl) || placeholderCover,
            difficulty: c.difficulty,
          })
        );
        setCourses(top.length > 0 ? top : sampleCourses);
      } catch (e: any) {
        // Backend not available in this dev session; sample courses keep the prototype usable.
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.info('Using sample courses (backend unavailable):', e?.message || e);
        }
        setCourses(sampleCourses);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Head>
        <title>Chitepo School of Ideology — Pan-African Political Education</title>
        <meta
          name="description"
          content="Master Pan-Africanism, Revolutionary Theory, and African Political Philosophy. Named after Herbert Chitepo, champion of African liberation and unity."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingLayout>
        <HybridLanding courses={courses} loading={loading} />
      </LandingLayout>
    </>
  );
}
