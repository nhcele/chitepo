import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import ForumList from '@/components/forums/ForumList';
import CreateForumModal from '@/components/forums/CreateForumModal';
import { ForumType, getForums, ForumStatus, Forum } from '@/lib/api/forums';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type TabKey = 'all' | ForumType;

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: ForumType.GENERAL, label: 'General' },
  { key: ForumType.COHORT, label: 'Cohort' },
  { key: ForumType.DIASPORA, label: 'Diaspora' },
];

export default function ForumsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'members' | 'posts'>('recent');
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState<{ forums: number; members: number; posts: number } | null>(null);

  useEffect(() => {
    getForums({ status: ForumStatus.ACTIVE })
      .then((data: Forum[]) => {
        setStats({
          forums: data.length,
          members: data.reduce((s, f) => s + (f.memberCount || 0), 0),
          posts: data.reduce((s, f) => s + (f.postCount || 0), 0),
        });
      })
      .catch(() => setStats(null));
  }, []);

  const typeFilter =
    activeTab === 'all' ? undefined : { type: activeTab as ForumType };

  return (
    <>
      <Head>
        <title>Forums — Chitepo</title>
        <meta name="description" content="Join discussions with your cohort, diaspora community, and fellow learners." />
      </Head>
      <AppLayout>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-forest-100 -skew-x-6 origin-top-right translate-x-1/4" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="w-12 h-12 bg-forest-600 rounded-md flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-cream" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">
                    Forums
                  </p>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal leading-tight mb-3"
                >
                  Where learners talk
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg text-stone"
                >
                  Ask questions, share resources, and learn in community — with your cohort and across the diaspora.
                </motion.p>
              </div>
              {user && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Start a forum
                </button>
              )}
            </div>

            {stats && (
              <div className="flex flex-wrap gap-x-8 gap-y-2 mt-8 text-sm text-stone">
                <span className="inline-flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-forest-600" />
                  <strong className="text-charcoal font-semibold">{stats.forums}</strong> forums
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-forest-600" />
                  <strong className="text-charcoal font-semibold">{stats.members}</strong> members
                </span>
                <span className="inline-flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-forest-600" />
                  <strong className="text-charcoal font-semibold">{stats.posts}</strong> discussions
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pewter" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search forums…"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-paper border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 text-charcoal"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="px-3 py-2.5 text-sm bg-paper border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 text-charcoal"
              aria-label="Sort forums"
            >
              <option value="recent">Most recent activity</option>
              <option value="members">Most members</option>
              <option value="posts">Most discussions</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-8 border-b border-border/60 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-forest-600 text-forest-600'
                    : 'border-transparent text-stone hover:text-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ForumList filters={typeFilter} search={search} sort={sort} />
        </div>
      </AppLayout>

      {showCreate && (
        <CreateForumModal
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
