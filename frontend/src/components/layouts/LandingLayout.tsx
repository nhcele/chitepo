import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { withBasePath } from '@/lib/basePath';

interface LandingLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { name: 'Courses', href: '/courses' },
  { name: 'Instructors', href: '/instructors' },
  { name: 'About', href: '/about' },
  { name: 'Community', href: '/community' },
  { name: 'Enterprise', href: '/enterprise' },
  { name: 'Contact', href: '/contact' },
];

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-forest-700 focus:outline-none"
      >
        Skip to main content
      </a>

      <header className="border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <span className="relative block h-12 w-12 flex-shrink-0">
                <Image
                  src={withBasePath('/chitepo-logo.jpg')}
                  alt="Chitepo School of Ideology"
                  fill
                  className="object-contain"
                  sizes="3rem"
                  loading="eager"
                  fetchPriority="high"
                />
              </span>
              <div className="hidden sm:block">
                <span className="font-serif text-lg font-semibold text-charcoal leading-tight">
                  Chitepo
                </span>
                <span className="block text-xs text-stone leading-tight">
                  School of Ideology
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-charcoal hover:text-forest-600 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex text-sm font-medium text-charcoal hover:text-forest-600 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:ring-offset-2"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="bg-ink-950 text-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <span className="relative block h-10 w-10 flex-shrink-0">
                  <Image
                    src={withBasePath('/chitepo-logo.jpg')}
                    alt="Chitepo School of Ideology"
                    fill
                    className="object-contain"
                    sizes="2.5rem"
                  />
                </span>
                <div>
                  <span className="font-serif text-lg font-semibold text-cream leading-tight">
                    Chitepo
                  </span>
                  <span className="block text-xs text-stone leading-tight">
                    School of Ideology
                  </span>
                </div>
              </div>
              <p className="text-sm text-stone leading-relaxed max-w-sm">
                Pan-African political education for leaders, public servants, and citizens
                committed to African liberation and unity.
              </p>
            </div>

            <div className="md:col-span-3 md:col-start-7">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-pewter mb-4">
                Platform
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/courses" className="text-sm text-cream/80 hover:text-ochre-400 transition-colors">
                    Explore courses
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-cream/80 hover:text-ochre-400 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-cream/80 hover:text-ochre-400 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-pewter mb-4">
                Account
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/auth/login" className="text-sm text-cream/80 hover:text-ochre-400 transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-sm text-cream/80 hover:text-ochre-400 transition-colors">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-forest-700/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-pewter">
              © {new Date().getFullYear()} Chitepo School of Ideology. All rights reserved.
            </p>
            <p className="text-xs text-pewter italic">
              Decolonising the Mind
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
