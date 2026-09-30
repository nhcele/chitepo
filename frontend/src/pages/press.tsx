import Layout from '@/components/Layout';
import { 
  NewspaperIcon,
  DocumentTextIcon,
  PhotoIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const pressReleases = [
  {
    date: 'January 15, 2025',
    title: 'Chitepo Platform Reaches 15,000 Active Learners',
    excerpt: 'Zimbabwe\'s leading professional learning platform celebrates milestone achievement in digital education.',
  },
  {
    date: 'December 10, 2024',
    title: 'Partnership with Ministry of Higher Education Announced',
    excerpt: 'Chitepo partners with government to provide upskilling programs for civil servants.',
  },
  {
    date: 'November 20, 2024',
    title: 'New AI-Powered Learning Companion Launched',
    excerpt: 'Platform introduces cutting-edge AI technology to personalize learning experiences.',
  },
  {
    date: 'October 5, 2024',
    title: 'Diaspora Program Connects Global Zimbabwean Community',
    excerpt: 'New initiative enables diaspora professionals to contribute to national development.',
  },
];

const mediaKit = [
  {
    icon: PhotoIcon,
    title: 'Brand Assets',
    description: 'Logos, colors, and brand guidelines',
    link: '#',
  },
  {
    icon: DocumentTextIcon,
    title: 'Fact Sheet',
    description: 'Company information and statistics',
    link: '#',
  },
  {
    icon: NewspaperIcon,
    title: 'Press Releases',
    description: 'Latest news and announcements',
    link: '#',
  },
];

const coverage = [
  {
    outlet: 'The Herald',
    title: 'How Chitepo is Revolutionizing Professional Education',
    date: 'January 2025',
  },
  {
    outlet: 'TechZim',
    title: 'EdTech Startup Chitepo Secures Government Partnership',
    date: 'December 2024',
  },
  {
    outlet: 'Zimbabwe Independent',
    title: 'Digital Learning Platform Empowers Zimbabwean Workforce',
    date: 'November 2024',
  },
  {
    outlet: 'NewsDay',
    title: 'Chitepo Platform Bridges Skills Gap in Zimbabwe',
    date: 'October 2024',
  },
];

export default function Press() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-forest-100 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-charcoal mb-4">
              Press & Media
            </h1>
            <p className="text-xl text-stone max-w-3xl mx-auto">
              Latest news, press releases, and media resources about Chitepo
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-white rounded-md shadow-sm p-8">
              <h2 className="text-2xl font-bold text-charcoal mb-6">
                Media Contact
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">
                    Chipo Ndlovu
                  </h3>
                  <p className="text-stone">Head of Communications</p>
                </div>
                <div className="flex items-center text-stone">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-primary-600" />
                  <span>press@chitepo.co.zw</span>
                </div>
                <div className="pt-4">
                  <p className="text-stone text-sm">
                    For media inquiries, interview requests, or press materials, please contact our communications team.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm p-8">
              <h2 className="text-2xl font-bold text-charcoal mb-6">
                Media Kit
              </h2>
              <div className="space-y-4">
                {mediaKit.map((item) => (
                  <a
                    key={item.title}
                    href={item.link}
                    className="flex items-start p-4 border border-border/60 rounded-md hover:bg-paper transition-colors"
                  >
                    <item.icon className="h-6 w-6 text-primary-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-charcoal mb-1">
                        {item.title}
                      </h3>
                      <p className="text-stone text-sm">
                        {item.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-2xl font-bold text-charcoal mb-8">
              Press Releases
            </h2>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <div key={index} className="border-l-4 border-primary-600 pl-6 py-2">
                  <p className="text-sm text-stone mb-2">{release.date}</p>
                  <h3 className="text-xl font-semibold text-charcoal mb-2 hover:text-primary-600 cursor-pointer">
                    {release.title}
                  </h3>
                  <p className="text-stone mb-3">
                    {release.excerpt}
                  </p>
                  <button className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                    Read Full Release →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-2xl font-bold text-charcoal mb-8">
              Media Coverage
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {coverage.map((article, index) => (
                <div key={index} className="border border-border/60 rounded-md p-6 hover:shadow-sm transition-shadow">
                  <p className="text-sm text-primary-600 font-semibold mb-2">
                    {article.outlet}
                  </p>
                  <h3 className="text-lg font-semibold text-charcoal mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-stone">
                    {article.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-50 rounded-md p-8">
            <h2 className="text-2xl font-bold text-charcoal mb-4 text-center">
              About Chitepo
            </h2>
            <p className="text-charcoal max-w-4xl mx-auto text-center mb-6">
              Chitepo is Zimbabwe's premier professional learning platform, providing accessible, high-quality courses 
              in technology, business, governance, and professional development. Named after revolutionary Herbert Chitepo, 
              the platform serves individuals, organizations, and government institutions across Zimbabwe and the diaspora, 
              empowering citizens with skills for national development and personal growth.
            </p>
            <div className="grid md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">15,000+</div>
                <div className="text-charcoal">Active Learners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">100+</div>
                <div className="text-charcoal">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
                <div className="text-charcoal">Expert Instructors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">5</div>
                <div className="text-charcoal">Government Partners</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
