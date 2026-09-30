import Link from 'next/link';
import Image from 'next/image';
import { withBasePath } from '@/lib/basePath';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const navigation = {
  platform: [
    { name: 'Courses', href: '/courses' },
    { name: 'Instructors', href: '/instructors' },
    { name: 'Enterprise', href: '/enterprise' },
    { name: 'Pricing', href: '/pricing' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Community', href: '/community' },
    { name: 'System Status', href: '/status' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'GDPR', href: '/gdpr' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: '#', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
  { name: 'LinkedIn', href: '#', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'GitHub', href: '#', icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' },
];

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="relative block h-10 w-10 flex-shrink-0">
                <Image
                  src={withBasePath('/chitepo-logo.jpg')}
                  alt="Chitepo School of Ideology"
                  fill
                  className="object-contain"
                  sizes="2.5rem"
                />
              </span>
              <span className="font-serif text-xl font-semibold">Chitepo</span>
            </div>
            <p className="text-cream/60 text-sm mb-6">
              Decolonising the Mind — Pan-African political education for professional growth and national development.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ochre-400 mb-4">Platform</h3>
            <ul className="space-y-3">
              {navigation.platform.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-cream/60 hover:text-cream transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ochre-400 mb-4">Support</h3>
            <ul className="space-y-3">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-cream/60 hover:text-cream transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ochre-400 mb-4">Company</h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-cream/60 hover:text-cream transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ochre-400 mb-4">Legal</h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-cream/60 hover:text-cream transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-ochre-400 mr-3 flex-shrink-0" />
              <span className="text-cream/60 text-sm">info@chitepo.co.zw</span>
            </div>
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-ochre-400 mr-3 flex-shrink-0" />
              <span className="text-cream/60 text-sm">+263 (0) 242 48 331</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-ochre-400 mr-3 flex-shrink-0" />
              <span className="text-cream/60 text-sm">Samora Machel Avenue & Simon Vengayi Muzenda Street, Harare</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-cream/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-cream/50 text-sm">
            © {new Date().getFullYear()} Chitepo School of Ideology. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 text-cream/50 text-sm italic">
            Decolonising the Mind
          </p>
        </div>
      </div>
    </footer>
  );
}
