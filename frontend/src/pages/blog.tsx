import { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const categories = [
  'All Posts',
  'Technology',
  'Career Development',
  'Education',
  'Success Stories',
  'Platform Updates',
];

const blogPosts = [
  {
    id: 1,
    title: 'How AI is Transforming Professional Education in Zimbabwe',
    excerpt: 'Explore how artificial intelligence is revolutionizing the way Zimbabweans learn and develop professional skills.',
    author: 'Rumbidzai Chikwanha',
    date: 'January 18, 2025',
    readTime: '5 min read',
    category: 'Technology',
    image: '/images/blog/ai-education.jpg',
  },
  {
    id: 2,
    title: '5 In-Demand Skills for 2025 in Zimbabwe',
    excerpt: 'Discover the most sought-after skills in the Zimbabwean job market and how to acquire them through Chitepo.',
    author: 'Ngoni Mutasa',
    date: 'January 15, 2025',
    readTime: '7 min read',
    category: 'Career Development',
    image: '/images/blog/skills-2025.jpg',
  },
  {
    id: 3,
    title: 'Success Story: From Teacher to Software Developer',
    excerpt: 'Meet Tendai Moyo, who successfully transitioned careers using Chitepo\'s web development program.',
    author: 'Chipo Ndlovu',
    date: 'January 12, 2025',
    readTime: '4 min read',
    category: 'Success Stories',
    image: '/images/blog/success-story.jpg',
  },
  {
    id: 4,
    title: 'New Course Launch: Digital Marketing Mastery',
    excerpt: 'We\'re excited to announce our comprehensive digital marketing course designed for Zimbabwean businesses.',
    author: 'Dr. Tafadzwa Mhembere',
    date: 'January 10, 2025',
    readTime: '3 min read',
    category: 'Platform Updates',
    image: '/images/blog/digital-marketing.jpg',
  },
  {
    id: 5,
    title: 'The Future of Remote Work in Zimbabwe',
    excerpt: 'How remote work is changing the employment landscape and what skills you need to succeed.',
    author: 'Rumbidzai Chikwanha',
    date: 'January 8, 2025',
    readTime: '6 min read',
    category: 'Career Development',
    image: '/images/blog/remote-work.jpg',
  },
  {
    id: 6,
    title: 'Building a Learning Culture in Your Organization',
    excerpt: 'Best practices for creating a culture of continuous learning in Zimbabwean organizations.',
    author: 'Ngoni Mutasa',
    date: 'January 5, 2025',
    readTime: '8 min read',
    category: 'Education',
    image: '/images/blog/learning-culture.jpg',
  },
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All Posts');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All Posts' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="bg-gradient-to-b from-forest-100 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-charcoal mb-4">
              Chitepo Blog
            </h1>
            <p className="text-xl text-stone max-w-3xl mx-auto">
              Insights, stories, and updates from the Chitepo community
            </p>
          </div>

          <div className="mb-8">
            <div className="max-w-2xl mx-auto relative mb-8">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-pewter" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-md border-2 border-border/60 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-charcoal hover:bg-forest-100 border border-border/60'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-md shadow-sm overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="h-48 bg-forest-100"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-charcoal mb-2 hover:text-primary-600 cursor-pointer">
                      {post.title}
                    </h2>
                    <p className="text-stone mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-sm text-stone space-x-4">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-stone mt-2">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{post.readTime}</span>
                    </div>
                    <button className="mt-4 text-primary-600 hover:text-primary-700 font-semibold">
                      Read More →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-stone text-lg">
                No articles found matching your search.
              </p>
            </div>
          )}

          <div className="mt-16 bg-primary-50 rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold text-charcoal mb-4">
              Stay Updated
            </h2>
            <p className="text-charcoal mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive the latest articles, course updates, and learning tips directly in your inbox.
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-md border border-border/60 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
