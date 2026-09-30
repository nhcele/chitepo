import Layout from '@/components/Layout';
import { 
  AcademicCapIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LightBulbIcon,
  HeartIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const values = [
  {
    icon: AcademicCapIcon,
    title: 'Excellence in Education',
    description: 'We are committed to providing world-class learning experiences that empower Zimbabweans to reach their full potential.',
  },
  {
    icon: UserGroupIcon,
    title: 'Community First',
    description: 'We believe in the power of community and collaboration to drive meaningful change and development.',
  },
  {
    icon: GlobeAltIcon,
    title: 'Accessibility',
    description: 'Quality education should be accessible to all, regardless of location or economic background.',
  },
  {
    icon: LightBulbIcon,
    title: 'Innovation',
    description: 'We leverage cutting-edge technology to create engaging and effective learning experiences.',
  },
  {
    icon: HeartIcon,
    title: 'National Pride',
    description: 'We are proud to contribute to Zimbabwe\'s development by empowering its citizens with valuable skills.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Integrity',
    description: 'We maintain the highest standards of quality, transparency, and ethical conduct in everything we do.',
  },
];

const team = [
  {
    name: 'Dr. Tafadzwa Mhembere',
    role: 'Chief Executive Officer',
    bio: 'Former education policy advisor with 15 years of experience in EdTech.',
  },
  {
    name: 'Rumbidzai Chikwanha',
    role: 'Chief Technology Officer',
    bio: 'Tech innovator passionate about using AI to transform education in Africa.',
  },
  {
    name: 'Ngoni Mutasa',
    role: 'Head of Content',
    bio: 'Curriculum designer with expertise in professional development programs.',
  },
  {
    name: 'Chipo Ndlovu',
    role: 'Head of Partnerships',
    bio: 'Building bridges between education, government, and industry.',
  },
];

const milestones = [
  { year: '2023', event: 'Chitepo Platform launched with 50 courses' },
  { year: '2024', event: 'Reached 10,000 active learners across Zimbabwe' },
  { year: '2024', event: 'Partnered with 5 government ministries' },
  { year: '2025', event: 'Expanded to diaspora community with 100+ courses' },
];

export default function About() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-charcoal mb-4">
              About Chitepo
            </h1>
            <p className="text-xl text-stone max-w-3xl mx-auto">
              Empowering Zimbabwe through accessible, quality professional education
            </p>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-charcoal text-center max-w-4xl mx-auto mb-8">
              Chitepo is Zimbabwe's premier professional learning platform, dedicated to empowering citizens 
              with the skills and knowledge needed for national development and personal growth. Named after 
              the revolutionary Herbert Chitepo, we embody his vision of an educated, skilled, and 
              self-reliant Zimbabwe.
            </p>
            <p className="text-lg text-charcoal text-center max-w-4xl mx-auto">
              We provide accessible, high-quality courses in technology, business, governance, and professional 
              development, serving individuals, organizations, and government institutions across Zimbabwe and 
              the diaspora.
            </p>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-6 text-center">
              The Legacy of Herbert Chitepo
            </h2>
            <p className="text-lg text-charcoal text-center max-w-4xl mx-auto mb-8">
              Learn about the revolutionary leader who inspired our mission to empower Zimbabweans through education and skills development.
            </p>
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-md overflow-hidden shadow-sm bg-ink-900 flex items-center justify-center">
                <div className="text-center text-pewter">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium">Video Coming Soon</p>
                  <p className="text-sm mt-2">Herbert Chitepo Legacy Documentary</p>
                </div>
              </div>
              <p className="text-sm text-stone text-center mt-4">
                Discover how Herbert Chitepo's vision continues to inspire our commitment to Zimbabwe's development
              </p>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-12 text-center">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value) => (
                <div key={value.title} className="bg-white rounded-md p-6 shadow-sm hover:shadow-sm transition-shadow">
                  <value.icon className="h-12 w-12 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold text-charcoal mb-2">
                    {value.title}
                  </h3>
                  <p className="text-stone">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-12 text-center">
              Our Journey
            </h2>
            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start mb-8 last:mb-0">
                  <div className="flex-shrink-0 w-24 text-right mr-8">
                    <span className="text-2xl font-bold text-primary-600">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="flex-1 border-l-4 border-primary-600 pl-8 pb-8">
                    <p className="text-lg text-charcoal">
                      {milestone.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-12 text-center">
              Leadership Team
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div key={member.name} className="bg-white rounded-md p-6 shadow-sm text-center">
                  <div className="w-32 h-32 bg-forest-100 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-charcoal mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 text-sm mb-3">
                    {member.role}
                  </p>
                  <p className="text-stone text-sm">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-md p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Join Us in Building Zimbabwe's Future
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Whether you're a learner, instructor, or partner organization, there's a place for you in the Chitepo community.
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="/auth/register" 
                className="bg-white text-primary-600 px-8 py-3 rounded-md font-semibold hover:bg-forest-100 transition-colors"
              >
                Get Started
              </a>
              <a 
                href="/contact" 
                className="bg-primary-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-primary-400 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
