import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ForumList from '@/components/forums/ForumList';
import { ForumType } from '@/lib/api/forums';

export default function ForumsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'cohort' | 'diaspora'>('all');

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forums</h1>
          <p className="text-gray-600">Join discussions with your cohort members and diaspora community</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['all', 'cohort', 'diaspora'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Forums
            </button>
          ))}
        </div>

        {/* Forum Lists */}
        {activeTab === 'all' && <ForumList title="All Forums" />}
        {activeTab === 'cohort' && (
          <ForumList title="Cohort Forums" filters={{ type: ForumType.COHORT }} />
        )}
        {activeTab === 'diaspora' && (
          <ForumList title="Diaspora Forums" filters={{ type: ForumType.DIASPORA }} />
        )}
      </div>
    </Layout>
  );
}

