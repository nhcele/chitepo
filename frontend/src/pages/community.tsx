import Layout from '../components/Layout';
import { 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CalendarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const communityFeatures = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Discussion Forums',
    description: 'Connect with fellow learners, ask questions, and share knowledge in our active community forums.',
    link: '/forums',
  },
  {
    icon: UserGroupIcon,
    title: 'Study Groups',
    description: 'Join or create study groups to collaborate with peers and enhance your learning experience.',
    link: '/forums',
  },
  {
    icon: AcademicCapIcon,
    title: 'Expert Mentorship',
    description: 'Get guidance from experienced instructors and industry professionals in your field.',
    link: '/instructors',
  },
  {
    icon: GlobeAltIcon,
    title: 'Global Network',
    description: 'Connect with learners from across Zimbabwe and the diaspora community worldwide.',
    link: '/diaspora',
  },
];

const upcomingEvents = [
  {
    title: 'Web Development Bootcamp',
    date: 'February 15, 2025',
    time: '10:00 AM - 4:00 PM',
    type: 'Workshop',
  },
  {
    title: 'Career Fair 2025',
    date: 'February 22, 2025',
    time: '9:00 AM - 5:00 PM',
    type: 'Event',
  },
  {
    title: 'AI & Machine Learning Webinar',
    date: 'March 1, 2025',
    time: '2:00 PM - 3:30 PM',
    type: 'Webinar',
  },
];

const successStories = [
  {
    name: 'Tendai Moyo',
    role: 'Software Developer',
    story: 'Through Chitepo, I transitioned from teaching to software development. The community support was invaluable.',
    image: '/images/placeholder-avatar.png',
  },
  {
    name: 'Rudo Ncube',
    role: 'Data Analyst',
    story: 'The study groups helped me stay motivated and complete my data science certification in record time.',
    image: '/images/placeholder-avatar.png',
  },
  {
    name: 'Farai Chikwanha',
    role: 'Digital Marketer',
    story: 'I found my first client through the Chitepo community. The networking opportunities are amazing.',
    image: '/images/placeholder-avatar.png',
  },
];

export default function Community() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Join Our Thriving Community
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect, collaborate, and grow with thousands of learners across Zimbabwe and beyond.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {communityFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <a href={feature.link} className="text-primary-600 hover:text-primary-700 font-semibold">
                  Learn More →
                </a>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <CalendarIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Upcoming Events
                </h2>
              </div>
              <div className="space-y-6">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="border-l-4 border-primary-600 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-1 rounded">
                        {event.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {event.date} • {event.time}
                    </p>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                View All Events
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <SparklesIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Community Stats
                </h2>
              </div>
              <div className="space-y-6">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    15,000+
                  </div>
                  <div className="text-gray-700">Active Members</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    500+
                  </div>
                  <div className="text-gray-700">Study Groups</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    2,000+
                  </div>
                  <div className="text-gray-700">Daily Discussions</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Success Stories
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {successStories.map((story, index) => (
                <div key={index} className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {story.name}
                  </h3>
                  <p className="text-primary-600 text-sm mb-3">
                    {story.role}
                  </p>
                  <p className="text-gray-600 italic">
                    "{story.story}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Join the Community?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Start connecting with fellow learners and grow your network today.
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="/auth/register" 
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Sign Up Free
              </a>
              <a 
                href="/forums" 
                className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
              >
                Explore Forums
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
