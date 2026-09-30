import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import CertificationProgressTracker from '@/components/certifications/CertificationProgressTracker';
import { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { getAuthHeaders } from '@/lib/auth';

interface RecommendedPathway {
  pathway: {
    id: string;
    name: string;
    type: string;
    level: number;
    levelTitle: string;
    cost: number;
    estimatedDurationWeeks: number;
  };
  progressPercentage: number;
  coursesCompleted: number;
  coursesRequired: number;
  recommended: boolean;
}

export default function MyCertificationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedPathway[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/certifications/recommendations', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.filter((rec: RecommendedPathway) => rec.recommended));
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  return (
    <>
      <Head>
        <title>Achieve — Chitepo</title>
        <meta name="description" content="Track your certification progress and achievements at the Chitepo School of Ideology" />
      </Head>
      <AppLayout>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-ochre-100 -skew-x-6 origin-top-right translate-x-1/4" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-5"
              >
                <div className="w-12 h-12 bg-ochre-400 rounded-md flex items-center justify-center">
                  <TrophyIcon className="h-6 w-6 text-ink-950" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ochre-600">
                  Achieve
                </p>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal leading-tight mb-4"
              >
                Your certifications
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-stone leading-relaxed"
              >
                Track progress, view achievements, and explore recommended pathways.
              </motion.p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Progress Tracker */}
          <div className="mb-16">
            <CertificationProgressTracker />
          </div>

          {/* Recommended Pathways */}
          {recommendations.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-ochre-400 rounded-md flex items-center justify-center">
                  <CheckBadgeIcon className="h-5 w-5 text-ink-950" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-charcoal">Recommended for you</h2>
                  <p className="text-sm text-stone">Based on your completed courses</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec) => (
                  <motion.div
                    key={rec.pathway.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-paper border border-border/60 rounded-md p-6 hover:border-ochre-400 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-forest-100 text-forest-700 rounded-full">
                        Level {rec.pathway.level}
                      </span>
                      <span className="text-sm font-semibold text-ochre-600">
                        {rec.progressPercentage.toFixed(0)}% ready
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-charcoal mb-1">
                      {rec.pathway.levelTitle}
                    </h3>

                    <p className="text-sm text-stone mb-5">{rec.pathway.name}</p>

                    <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                      <div>
                        <p className="text-xs text-pewter mb-0.5">Duration</p>
                        <p className="font-semibold text-charcoal">{rec.pathway.estimatedDurationWeeks} weeks</p>
                      </div>
                      <div>
                        <p className="text-xs text-pewter mb-0.5">Cost</p>
                        <p className="font-semibold text-charcoal">
                          {rec.pathway.cost === 0 ? 'Free' : `$${rec.pathway.cost}`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-stone mb-1.5">
                        <span>Your progress</span>
                        <span className="font-semibold text-charcoal">
                          {rec.coursesCompleted}/{rec.coursesRequired} courses
                        </span>
                      </div>
                      <div className="w-full bg-forest-100 rounded-full h-2">
                        <div
                          className="bg-forest-600 h-2 rounded-full"
                          style={{ width: `${rec.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/courses?tab=certifications`}
                      className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                    >
                      View pathway details
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-forest-700 rounded-md p-8 lg:p-12 text-center">
            <TrophyIcon className="mx-auto h-12 w-12 text-ochre-400 mb-5" />
            <h2 className="font-serif text-3xl font-semibold text-cream mb-4">
              Ready to start a new pathway?
            </h2>
            <p className="text-cream/80 mb-8 max-w-2xl mx-auto">
              Explore certification pathways designed to advance your ideological knowledge and leadership skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses?tab=certifications"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
              >
                Browse all pathways
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-cream border border-cream/30 rounded-md hover:bg-cream/10 transition-colors"
              >
                Explore courses
              </Link>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Official recognition',
                description: 'Earn nationally recognized certifications that advance your career and political engagement.',
                icon: AcademicCapIcon,
              },
              {
                title: 'Structured learning',
                description: 'Follow progressive pathways designed to build comprehensive ideological and leadership competence.',
                icon: ClockIcon,
              },
              {
                title: 'Career advancement',
                description: 'Certifications open doors to leadership positions and mandated opportunities in party and government.',
                icon: TrophyIcon,
              },
            ].map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="bg-forest-100 rounded-md w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-forest-600" />
                </div>
                <h3 className="font-semibold text-charcoal mb-2">{benefit.title}</h3>
                <p className="text-sm text-stone">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
