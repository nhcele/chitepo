import Head from 'next/head';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { searchCourses } from '@/lib/api/courses';
import { Course } from '@mindelta/shared';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState<string>((router.query.q as string) || '');
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial = router.query.q as string;
    if (initial) {
      setQ(initial);
      void handleSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (query?: string) => {
    const term = query ?? q;
    if (!term || term.trim().length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchCourses(term.trim());
      setResults(data);
      const url = { pathname: '/search', query: { q: term.trim() } };
      router.replace(url, undefined, { shallow: true });
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Search - Mindelta</title>
      </Head>
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-6">Search</h1>
          <div className="flex gap-3 mb-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search courses..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search courses"
            />
            <button
              onClick={() => handleSearch()}
              className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
          {loading && <p className="text-gray-600">Searching...</p>}
          {error && <p className="text-red-600">{error}</p>}
          <ul className="space-y-4">
            {results.map((c) => (
              <li key={c.id} className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{c.title}</h2>
                    <p className="text-gray-600 text-sm line-clamp-2">{c.description}</p>
                  </div>
                  <Link href={`/courses/${c.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm">
                    View →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    </>
  );
}
