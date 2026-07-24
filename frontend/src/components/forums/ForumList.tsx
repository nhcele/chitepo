import React, { useState, useEffect } from 'react';
import { getForums, Forum, ForumType, ForumStatus } from '@/lib/api/forums';
import Link from 'next/link';

interface ForumListProps {
  filters?: {
    type?: ForumType;
    cohortId?: string;
    region?: string;
    country?: string;
  };
  title?: string;
}

export default function ForumList({ filters, title }: ForumListProps) {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForums();
  }, [filters]);

  const loadForums = async () => {
    setLoading(true);
    try {
      const data = await getForums({ ...filters, status: ForumStatus.ACTIVE });
      setForums(data);
    } catch (error) {
      console.error('Error loading forums:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: ForumType) => {
    const badges = {
      [ForumType.COHORT]: { label: 'Cohort', color: 'bg-blue-100 text-blue-800' },
      [ForumType.DIASPORA]: { label: 'Diaspora', color: 'bg-purple-100 text-purple-800' },
      [ForumType.GENERAL]: { label: 'General', color: 'bg-gray-100 text-gray-800' },
    };
    return badges[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading forums...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
      )}

      {forums.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No forums found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forums.map((forum) => (
            <Link 
              key={forum.id} 
              href={`/forums/${forum.id}`}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{forum.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(forum.type).color}`}>
                  {getTypeBadge(forum.type).label}
                </span>
              </div>

              {forum.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{forum.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>{forum.memberCount} members</span>
                  <span>{forum.postCount} posts</span>
                </div>
                {forum.lastActivityAt && (
                  <span>{new Date(forum.lastActivityAt).toLocaleDateString()}</span>
                )}
              </div>

              {forum.cohort && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Cohort:</span>
                  <span className="text-xs font-medium text-gray-700 ml-2">{forum.cohort.name}</span>
                </div>
              )}

              {forum.region && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Region:</span>
                  <span className="text-xs font-medium text-gray-700 ml-2">{forum.region}</span>
                  {forum.country && (
                    <span className="text-xs text-gray-500 ml-2">({forum.country})</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

