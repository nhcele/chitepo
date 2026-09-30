import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { FeaturedCourse } from '@/components/landing/data';
import { features, stats, formatDuration, difficultyLabel } from '@/components/landing/data';
import CourseCover from '@/components/ui/CourseCover';

interface HybridLandingProps {
  courses: FeaturedCourse[];
  loading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

function FeatureVisual({ number, title, index }: { number: string; title: string; index: number }) {
  const palettes = [
    { bg: 'from-forest-700 to-ink-950', accent: 'bg-ochre-400', ring: 'border-ochre-400/70' },
    { bg: 'from-terracotta-700 to-ink-950', accent: 'bg-forest-500', ring: 'border-cream/50' },
    { bg: 'from-ink-950 to-forest-800', accent: 'bg-terracotta-500', ring: 'border-ochre-400/60' },
  ];
  const palette = palettes[index % palettes.length];

  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-md bg-gradient-to-br ${palette.bg}`}>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full ${palette.accent} opacity-80`} />
      <div className={`absolute -bottom-12 -left-12 h-44 w-44 rounded-full border-[18px] ${palette.ring}`} />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-ochre-400/90" style={{ clipPath: 'polygon(0 45%, 100% 0, 100% 100%, 0 100%)' }} />
      <div className="absolute inset-0 flex flex-col justify-between p-8">
        <div className="flex items-center justify-between">
          <span className="font-serif text-6xl font-bold text-white/20">{number}</span>
          <span className="h-2 w-16 bg-ochre-400" />
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/70">Chitepo Method</p>
          <p className="max-w-xs font-serif text-2xl font-semibold leading-tight text-white">{title}</p>
        </div>
      </div>
    </div>
  );
}

export default function HybridLanding({ courses, loading }: HybridLandingProps) {
  return (
    <>
      {/* Hero — editorial text + dynamic geometric visual */}
      <section className="relative overflow-hidden bg-cream">
        <div className="absolute top-0 right-0 w-2/5 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/6" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-ochre-100 rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="lg:col-span-6"
            >
              <motion.p
                variants={itemVariants}
                className="text-sm font-semibold uppercase tracking-wider text-forest-600 mb-6"
              >
                Practical Governance Track
              </motion.p>
              <motion.h1
                variants={itemVariants}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-charcoal leading-[1.1] mb-6"
              >
                Training party structures and local government leaders for delivery.
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-lg text-stone leading-relaxed max-w-xl mb-10"
              >
                Applied courses for DCC members, councillors, ward teams, public servants, and
                community organizers working where policy meets people.
              </motion.p>
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:ring-offset-2"
                >
                  Explore governance tracks
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/courses?pathway=officials"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-charcoal hover:text-forest-600 transition-colors focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
                >
                  View officials pathway
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="lg:col-span-6 relative"
            >
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-8 bg-ink-950 rounded-tr-[5rem] rounded-bl-[5rem] flex items-center justify-center shadow-sm">
                  <div className="text-center text-cream p-8">
                    <span className="font-serif text-8xl lg:text-9xl text-ochre-500 font-bold">C</span>
                    <p className="mt-4 font-serif text-2xl italic text-cream/90">
                      Governance in Practice
                    </p>
                    <p className="text-sm text-cream/50 mt-2">Party and Local Government Tracks</p>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-forest-600 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-36 h-36 border-4 border-terracotta-600 rounded-full" />
                <div className="absolute top-1/2 -right-10 w-20 h-20 bg-ochre-400 rounded-md -rotate-12" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats — editorial numbers with dynamic color band */}
      <section className="relative bg-forest-700 text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ochre-400 via-terracotta-600 to-forest-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="text-center md:text-left"
              >
                <p className="font-serif text-4xl lg:text-5xl font-semibold text-ochre-400 mb-2">
                  {stat.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — editorial numbered rows with dynamic alternating visuals */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600 mb-4">
                Why this track?
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal leading-tight">
                Practical training for the leaders closest to the people.
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-16 lg:space-y-20">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`grid lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-serif text-3xl text-ochre-500 font-semibold">
                        {feature.number}
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-stone leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <FeatureVisual number={feature.number} title={feature.title} index={index} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses — editorial rows on a dynamic angled background */}
      <section className="relative py-20 lg:py-28 bg-cream overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600 mb-3">
                Governance curriculum
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal">
                Party and local government courses
              </h2>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
            >
              View all courses
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-6" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-6 p-4 border border-border/60 rounded-md animate-pulse bg-white"
                >
                  <div className="w-32 h-24 bg-cream rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-5 bg-cream rounded w-1/3" />
                    <div className="h-4 bg-cream rounded w-2/3" />
                    <div className="h-4 bg-cream rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center border border-border/60 rounded-md bg-white">
              <p className="text-charcoal mb-2">No courses are available yet.</p>
              <p className="text-sm text-stone">Please check back soon as we expand the curriculum.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <Link
                    href={course.isSample ? '/courses' : `/courses/${course.id}`}
                    className="group flex flex-col sm:flex-row gap-6 p-4 sm:p-6 border border-border/60 rounded-md hover:border-forest-600 transition-colors bg-white shadow-sm hover:shadow-sm"
                  >
                    <div className="relative w-full sm:w-48 h-32 flex-shrink-0 bg-cream rounded-md overflow-hidden">
                      <CourseCover
                        title={course.title}
                        src={course.coverImage}
                        className="transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, 12rem"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-forest-600 px-2 py-1 bg-forest-100 rounded">
                          {difficultyLabel[course.difficulty]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-stone">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {formatDuration(course.duration)}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal mb-2 group-hover:text-forest-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-stone leading-relaxed line-clamp-2 max-w-2xl mb-3">
                        {course.subtitle}
                      </p>
                      <p className="text-sm text-pewter">by {course.instructor}</p>
                    </div>
                    <div className="flex items-center self-start sm:self-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border/60 text-charcoal group-hover:border-forest-600 group-hover:text-forest-600 transition-colors">
                        <ArrowRightIcon className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA — dark editorial with dynamic accent */}
      <section className="relative py-20 lg:py-28 bg-ink-950 text-cream overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-forest-900/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-ochre-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-ochre-400 mb-4">
                Build capacity
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
                Equip every ward, district, and council with practical governance skills.
              </h2>
              <p className="text-lg text-cream/70 leading-relaxed max-w-2xl">
                Create an account to access the officials pathway, track progress, and strengthen
                party and local government teams through structured learning.
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href="/courses?pathway=officials"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-ink-950 bg-ochre-500 rounded-md hover:bg-ochre-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cream focus:ring-offset-2 focus:ring-offset-ink-950"
              >
                Start the officials track
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
