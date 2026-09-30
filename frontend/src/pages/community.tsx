import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import { getForums, Forum, ForumStatus } from '@/lib/api/forums';
import { timeAgo } from '@/components/forums/PostCard';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const communityFeatures = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Discussion forums',
    description: 'Ask questions, share resources, and learn in community across general, cohort, and diaspora forums.',
    link: '/forums',
    linkLabel: 'Browse forums',
  },
  {
    icon: UserGroupIcon,
    title: 'Cohort spaces',
    description: 'Every training cohort gets a private discussion space to collaborate on coursework.',
    link: '/forums',
    linkLabel: 'Find your cohort forum',
  },
  {
    icon: AcademicCapIcon,
    title: 'Expert mentorship',
    description: 'Get guidance from experienced instructors and industry professionals in your field.',
    link: '/instructors',
    linkLabel: 'Meet instructors',
  },
  {
    icon: GlobeAltIcon,
    title: 'Diaspora network',
    description: 'Connect with learners across Zimbabwe and the diaspora community worldwide.',
    link: '/diaspora',
    linkLabel: 'Explore diaspora',
  },
];

export default function Community() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForums({ status: ForumStatus.ACTIVE })
      .then((data) => {
        const sorted = data
          .slice()
          .sort(
            (a, b) =>
              new Date(b.lastActivityAt || b.createdAt).getTime() -
              new Date(a.lastActivityAt || a.createdAt).getTime(),
          );
        setForums(sorted);
      })
      .catch(() => setForums([]))
      .finally(() => setLoading(false));
  }, []);

  const totalMembers = forums.reduce((s, f) => s + (f.memberCount || 0), 0);
  const totalPosts = forums.reduce((s, f) => s + (f.postCount || 0), 0);
  const activeForums = forums.filter((f) => f.lastActivityAt).slice(0, 4);

  return (
    <>
      <Head>
        <title>Community — Chitepo</title>
        <meta name="description" content="Connect, collaborate, and grow with learners across Zimbabwe and beyond." />
      </Head>
      <AppLayout>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-5"
              >
                <div className="w-12 h-12 bg-forest-600 rounded-md flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-cream" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">
                  Community
                </p>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-charcoal leading-tight mb-4"
              >
                Learn together
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-stone leading-relaxed"
              >
                Connect, collaborate, and grow with learners across Zimbabwe and beyond.
              </motion.p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {communityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-paper border border-border/60 rounded-md p-6 hover:border-forest-400 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-forest-600 mb-4" />
                <h3 className="font-serif text-lg font-semibold text-charcoal mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-stone mb-4">{feature.description}</p>
                <Link
                  href={feature.link}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                >
                  {feature.linkLabel}
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Active forums + live stats */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div className="bg-paper border border-border/60 rounded-md p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-forest-100 rounded-md flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-forest-600" />
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal">
                    Active forums
                  </h2>
                </div>
                <Link
                  href="/forums"
                  className="text-sm font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                >
                  View all
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600" />
                </div>
              ) : activeForums.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone mb-4">No forum activity yet — start the conversation.</p>
                  <Link
                    href="/forums"
                    className="inline-flex px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                  >
                    Browse forums
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeForums.map((forum) => (
                    <Link
                      key={forum.id}
                      href={`/forums/${forum.id}`}
                      className="block border-l-4 border-forest-600 pl-4 hover:bg-forest-100/40 -ml-4 pl-4 py-1 transition-colors rounded-r"
                    >
                      <h3 className="font-semibold text-charcoal mb-0.5">{forum.title}</h3>
                      <p className="text-sm text-stone">
                        {forum.postCount} discussions · {forum.memberCount} members
                        {forum.lastActivityAt && ` · active ${timeAgo(forum.lastActivityAt)}`}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-forest-700 rounded-md p-6 lg:p-8">
              <h2 className="font-serif text-xl font-semibold text-cream mb-6">
                Community at a glance
              </h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-cream/10 pb-4">
                  <span className="text-sm text-cream/70">Forums</span>
                  <span className="font-serif text-3xl font-semibold text-ochre-400">
                    {loading ? '—' : forums.length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-cream/10 pb-4">
                  <span className="text-sm text-cream/70">Members</span>
                  <span className="font-serif text-3xl font-semibold text-ochre-400">
                    {loading ? '—' : totalMembers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/70">Discussions</span>
                  <span className="font-serif text-3xl font-semibold text-ochre-400">
                    {loading ? '—' : totalPosts}
                  </span>
                </div>
              </div>
              <Link
                href="/forums"
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
              >
                Join the conversation
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-forest-700 rounded-md p-8 lg:p-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-cream mb-4">
              Ready to join the community?
            </h2>
            <p className="text-cream/80 mb-8 max-w-2xl mx-auto">
              Start connecting with fellow learners and grow your network today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-ink-950 bg-ochre-400 rounded-md hover:bg-ochre-300 transition-colors"
              >
                Sign up free
              </Link>
              <Link
                href="/forums"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-cream border border-cream/30 rounded-md hover:bg-cream/10 transition-colors"
              >
                Explore forums
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
