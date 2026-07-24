import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ForumList from '@/components/forums/ForumList';
import { getDiasporaForums, Forum } from '@/lib/api/forums';

const REGIONS = [
  { value: 'south_africa', label: 'South Africa' },
  { value: 'east_africa', label: 'East Africa' },
  { value: 'uk_ireland', label: 'UK & Ireland' },
  { value: 'europe_continental', label: 'Continental Europe' },
  { value: 'north_america', label: 'North America' },
  { value: 'latin_america', label: 'Latin America' },
  { value: 'australia', label: 'Australia' },
  { value: 'china', label: 'China' },
  { value: 'uae', label: 'UAE' },
];

export default function DiasporaForumsPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diaspora Forums</h1>
          <p className="text-gray-600">Connect with Zimbabweans in your region</p>
        </div>

        {/* Region Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Regions</option>
            {REGIONS.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Forums List */}
        <ForumList
          title={selectedRegion ? `Forums in ${REGIONS.find((r) => r.value === selectedRegion)?.label}` : 'All Diaspora Forums'}
          filters={{
            type: 'diaspora' as any,
            region: selectedRegion || undefined,
          }}
        />
      </div>
    </Layout>
  );
}

