import Head from 'next/head';
import Layout from '@/components/Layout';
import { GlobeAltIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface RegionalCoordinator {
  region: string;
  country: string;
  coordinator: string;
  title: string;
  email: string;
  phone: string;
  timezone: string;
  members: number;
  description: string;
  flag: string;
}

const coordinators: RegionalCoordinator[] = [
  // AFRICA REGION
  {
    region: 'South Africa',
    country: 'South Africa',
    coordinator: 'Comrade Tendai Moyo',
    title: 'Regional Coordinator - Southern Africa',
    email: 'tendai.moyo@chitepo-diaspora.org',
    phone: '+27 11 234 5678',
    timezone: 'GMT+2 (SAST)',
    members: 12500,
    description: 'Coordinates activities across South Africa, Botswana, Namibia, and neighboring countries. Focus on investment opportunities and business networking.',
    flag: '🇿🇦',
  },
  {
    region: 'East Africa',
    country: 'Kenya',
    coordinator: 'Comrade Kudzai Mupfumira',
    title: 'Regional Coordinator - East Africa',
    email: 'kudzai.mupfumira@chitepo-diaspora.org',
    phone: '+254 20 123 4567',
    timezone: 'GMT+3 (EAT)',
    members: 2800,
    description: 'Oversees operations in Kenya, Tanzania, Uganda, and the Horn of Africa. Focus on cultural exchange and trade facilitation.',
    flag: '🇰🇪',
  },

  // EUROPE REGION
  {
    region: 'United Kingdom & Ireland',
    country: 'United Kingdom',
    coordinator: 'Comrade Ruvimbo Chikwanha',
    title: 'Regional Coordinator - UK & Ireland',
    email: 'ruvimbo.chikwanha@chitepo-diaspora.org',
    phone: '+44 20 7123 4567',
    timezone: 'GMT (GMT/BST)',
    members: 8200,
    description: 'Manages the largest European diaspora community. Focus on political advocacy, remittances, and professional networking.',
    flag: '🇬🇧',
  },
  {
    region: 'Continental Europe',
    country: 'Germany',
    coordinator: 'Comrade Tapiwa Schmidt',
    title: 'Regional Coordinator - Continental Europe',
    email: 'tapiwa.schmidt@chitepo-diaspora.org',
    phone: '+49 30 1234 5678',
    timezone: 'GMT+1 (CET)',
    members: 1500,
    description: 'Covers Germany, France, Netherlands, Belgium, and Nordic countries. Focus on academic collaboration and skilled worker programs.',
    flag: '🇩🇪',
  },

  // AMERICAS REGION
  {
    region: 'United States & Canada',
    country: 'United States',
    coordinator: 'Comrade Farai Washington',
    title: 'Regional Coordinator - North America',
    email: 'farai.washington@chitepo-diaspora.org',
    phone: '+1 202 555 0123',
    timezone: 'GMT-5 (EST)',
    members: 3900,
    description: 'Coordinates across USA and Canada with focus on investment, technology transfer, and political advocacy at international institutions.',
    flag: '🇺🇸',
  },
  {
    region: 'Latin America & Caribbean',
    country: 'Brazil',
    coordinator: 'Comrade Chipo Silva',
    title: 'Regional Coordinator - Latin America',
    email: 'chipo.silva@chitepo-diaspora.org',
    phone: '+55 11 3456 7890',
    timezone: 'GMT-3 (BRT)',
    members: 450,
    description: 'Emerging diaspora community with focus on South-South cooperation and cultural exchange.',
    flag: '🇧🇷',
  },

  // ASIA-PACIFIC REGION
  {
    region: 'Australia & New Zealand',
    country: 'Australia',
    coordinator: 'Comrade Nyasha Melbourne',
    title: 'Regional Coordinator - Oceania',
    email: 'nyasha.melbourne@chitepo-diaspora.org',
    phone: '+61 2 9876 5432',
    timezone: 'GMT+10 (AEST)',
    members: 1800,
    description: 'Manages activities in Australia, New Zealand, and Pacific Islands. Focus on educational partnerships and mining sector collaboration.',
    flag: '🇦🇺',
  },
  {
    region: 'China & East Asia',
    country: 'China',
    coordinator: 'Comrade Tino Zhang',
    title: 'Regional Coordinator - East Asia',
    email: 'tino.zhang@chitepo-diaspora.org',
    phone: '+86 10 1234 5678',
    timezone: 'GMT+8 (CST)',
    members: 850,
    description: 'Coordinates students, professionals, and business community in China, Japan, South Korea. Focus on Belt and Road initiatives.',
    flag: '🇨🇳',
  },

  // MIDDLE EAST
  {
    region: 'Middle East',
    country: 'United Arab Emirates',
    coordinator: 'Comrade Munashe Dubai',
    title: 'Regional Coordinator - Middle East',
    email: 'munashe.dubai@chitepo-diaspora.org',
    phone: '+971 4 123 4567',
    timezone: 'GMT+4 (GST)',
    members: 1200,
    description: 'Covers UAE, Saudi Arabia, Qatar, and neighboring Gulf states. Focus on investment, logistics, and energy sector partnerships.',
    flag: '🇦🇪',
  },
];

const RegionCard = ({ coordinator }: { coordinator: RegionalCoordinator }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-5xl">{coordinator.flag}</div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
            {coordinator.members.toLocaleString()} members
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-1">{coordinator.region}</h3>
        <p className="text-blue-100 text-sm">{coordinator.timezone}</p>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 text-lg mb-1">{coordinator.coordinator}</h4>
          <p className="text-sm text-gray-600">{coordinator.title}</p>
        </div>

        <p className="text-sm text-gray-600 mb-6 line-clamp-3">{coordinator.description}</p>

        <div className="space-y-3">
          <div className="flex items-start">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <a
              href={`mailto:${coordinator.email}`}
              className="text-sm text-blue-600 hover:text-blue-800 break-all"
            >
              {coordinator.email}
            </a>
          </div>

          <div className="flex items-start">
            <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <a
              href={`tel:${coordinator.phone}`}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              {coordinator.phone}
            </a>
          </div>

          <div className="flex items-start">
            <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {coordinator.members.toLocaleString()} active members
            </p>
          </div>
        </div>

        <button className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          Contact Coordinator
        </button>
      </div>
    </div>
  );
};

export default function RegionalCoordinatorsPage() {
  const totalMembers = coordinators.reduce((sum, c) => sum + c.members, 0);
  const regions = coordinators.length;

  return (
    <Layout>
      <Head>
        <title>Regional Coordinators - Chitepo School of Ideology</title>
        <meta name="description" content="Connect with our global network of regional coordinators" />
      </Head>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GlobeAltIcon className="mx-auto h-16 w-16 text-white mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Regional Coordinators Directory
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Connect with our global network of coordinators serving the diaspora community
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <p className="text-4xl font-bold text-white">{regions}</p>
              <p className="text-blue-100 mt-2">Global Regions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <p className="text-4xl font-bold text-white">{totalMembers.toLocaleString()}</p>
              <p className="text-blue-100 mt-2">Total Members</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <p className="text-4xl font-bold text-white">24/7</p>
              <p className="text-blue-100 mt-2">Support Available</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Africa Region */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">🌍</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Africa</h2>
              <p className="text-gray-600">
                {coordinators.filter(c => ['South Africa', 'East Africa'].includes(c.region))
                  .reduce((sum, c) => sum + c.members, 0).toLocaleString()} members
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordinators.filter(c => ['South Africa', 'East Africa'].includes(c.region)).map((coordinator) => (
              <RegionCard key={coordinator.region} coordinator={coordinator} />
            ))}
          </div>
        </div>

        {/* Europe Region */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">🇪🇺</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Europe</h2>
              <p className="text-gray-600">
                {coordinators.filter(c => c.region.includes('United Kingdom') || c.region.includes('Continental'))
                  .reduce((sum, c) => sum + c.members, 0).toLocaleString()} members
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordinators.filter(c => c.region.includes('United Kingdom') || c.region.includes('Continental')).map((coordinator) => (
              <RegionCard key={coordinator.region} coordinator={coordinator} />
            ))}
          </div>
        </div>

        {/* Americas Region */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">🌎</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Americas</h2>
              <p className="text-gray-600">
                {coordinators.filter(c => c.region.includes('United States') || c.region.includes('Latin'))
                  .reduce((sum, c) => sum + c.members, 0).toLocaleString()} members
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordinators.filter(c => c.region.includes('United States') || c.region.includes('Latin')).map((coordinator) => (
              <RegionCard key={coordinator.region} coordinator={coordinator} />
            ))}
          </div>
        </div>

        {/* Asia-Pacific Region */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">🌏</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Asia-Pacific</h2>
              <p className="text-gray-600">
                {coordinators.filter(c => c.region.includes('Australia') || c.region.includes('China'))
                  .reduce((sum, c) => sum + c.members, 0).toLocaleString()} members
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordinators.filter(c => c.region.includes('Australia') || c.region.includes('China')).map((coordinator) => (
              <RegionCard key={coordinator.region} coordinator={coordinator} />
            ))}
          </div>
        </div>

        {/* Middle East Region */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">🕌</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Middle East</h2>
              <p className="text-gray-600">
                {coordinators.filter(c => c.region.includes('Middle East'))
                  .reduce((sum, c) => sum + c.members, 0).toLocaleString()} members
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordinators.filter(c => c.region.includes('Middle East')).map((coordinator) => (
              <RegionCard key={coordinator.region} coordinator={coordinator} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-xl p-8 text-center text-white mt-12">
          <h2 className="text-3xl font-bold mb-4">Join Your Regional Community</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Connect with your regional coordinator to access resources, participate in events, and contribute to national development.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="/diaspora"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-green-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Learn About Diaspora Programs
            </a>
            <a
              href="/training-calendar"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-white hover:text-green-600 transition-colors"
            >
              View Training Calendar
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

