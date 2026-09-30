import Layout from '@/components/Layout';
import { 
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  AcademicCapIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const openPositions = [
  {
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    salary: 'Competitive',
    description: 'Build and maintain our learning platform using React, Node.js, and modern web technologies.',
  },
  {
    title: 'Content Curriculum Designer',
    department: 'Education',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    salary: 'Competitive',
    description: 'Design engaging course content and learning experiences for professional development programs.',
  },
  {
    title: 'AI/ML Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: 'Competitive',
    description: 'Develop AI-powered features including our learning companion and personalized recommendations.',
  },
  {
    title: 'Partnership Manager',
    department: 'Business Development',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    salary: 'Competitive',
    description: 'Build relationships with government institutions, NGOs, and corporate partners.',
  },
  {
    title: 'UX/UI Designer',
    department: 'Design',
    location: 'Hybrid',
    type: 'Full-time',
    salary: 'Competitive',
    description: 'Create intuitive and beautiful user experiences for our web and mobile platforms.',
  },
  {
    title: 'Video Production Specialist',
    department: 'Content',
    location: 'Harare, Zimbabwe',
    type: 'Contract',
    salary: 'Project-based',
    description: 'Produce high-quality educational videos for our course library.',
  },
];

const benefits = [
  {
    icon: CurrencyDollarIcon,
    title: 'Competitive Salary',
    description: 'Market-leading compensation packages with performance bonuses.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Learning & Development',
    description: 'Free access to all courses and professional development opportunities.',
  },
  {
    icon: HeartIcon,
    title: 'Health & Wellness',
    description: 'Comprehensive medical aid and wellness programs for you and your family.',
  },
  {
    icon: ClockIcon,
    title: 'Flexible Work',
    description: 'Hybrid work options and flexible hours to support work-life balance.',
  },
  {
    icon: UsersIcon,
    title: 'Great Team',
    description: 'Work with passionate, talented people committed to making a difference.',
  },
  {
    icon: SparklesIcon,
    title: 'Impact',
    description: 'Contribute to Zimbabwe\'s development by empowering thousands of learners.',
  },
];

const values = [
  'Innovation and continuous improvement',
  'Collaboration and teamwork',
  'Excellence in everything we do',
  'Integrity and transparency',
  'Commitment to Zimbabwe\'s development',
];

export default function Careers() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-charcoal mb-4">
              Join Our Team
            </h1>
            <p className="text-xl text-stone max-w-3xl mx-auto">
              Help us build Zimbabwe's premier professional learning platform and make a lasting impact on thousands of lives.
            </p>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-6 text-center">
              Why Work at Chitepo?
            </h2>
            <p className="text-lg text-charcoal text-center max-w-4xl mx-auto mb-12">
              At Chitepo, you'll be part of a mission-driven team working to transform education in Zimbabwe. 
              We're building cutting-edge technology while making a real difference in people's lives.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <benefit.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-stone">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-8 text-center">
              Open Positions
            </h2>
            <div className="space-y-6">
              {openPositions.map((position, index) => (
                <div key={index} className="bg-white rounded-md shadow-sm p-6 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <h3 className="text-xl font-bold text-charcoal mb-2">
                        {position.title}
                      </h3>
                      <p className="text-stone mb-3">
                        {position.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-stone">
                        <div className="flex items-center">
                          <BriefcaseIcon className="h-4 w-4 mr-1" />
                          <span>{position.department}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{position.type}</span>
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <span>{position.salary}</span>
                        </div>
                      </div>
                    </div>
                    <button className="bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-8 text-center">
              Our Values
            </h2>
            <ul className="max-w-2xl mx-auto space-y-4">
              {values.map((value, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-600 text-2xl mr-3">✓</span>
                  <span className="text-lg text-charcoal">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-md p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Don't See the Right Role?
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              We're always looking for talented individuals who share our passion for education and technology. 
              Send us your CV and let's talk about how you can contribute to our mission.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-md font-semibold hover:bg-forest-100 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
