import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { withBasePath } from '@/lib/basePath';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  TrophyIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Explore', href: '/courses', icon: MagnifyingGlassIcon },
  { name: 'Learn', href: '/my-learning', icon: AcademicCapIcon },
  { name: 'Achieve', href: '/my-certifications', icon: TrophyIcon },
  { name: 'Community', href: '/community', icon: UsersIcon },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-forest-700 focus:outline-none"
      >
        Skip to main content
      </a>

      <header className="bg-paper border-b border-border/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="relative block h-9 w-9 flex-shrink-0">
                <Image
                  src={withBasePath('/chitepo-logo.jpg')}
                  alt="Chitepo School of Ideology"
                  fill
                  className="object-contain"
                  sizes="2.25rem"
                  loading="eager"
                  fetchPriority="high"
                />
              </span>
              <span className="hidden sm:block font-serif text-lg font-semibold text-charcoal leading-tight">
                Chitepo
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-forest-600 bg-forest-100'
                        : 'text-stone hover:text-charcoal hover:bg-forest-100/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-charcoal leading-tight">{user.name}</span>
                    <span className="text-xs text-stone capitalize leading-tight">{user.role}</span>
                  </div>
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-forest-100 text-forest-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
                      aria-label="Account menu"
                    >
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-paper border border-border/60 rounded-md shadow-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-charcoal hover:bg-forest-100 first:rounded-t-md"
                      >
                        Profile
                      </Link>
                      {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-charcoal hover:bg-forest-100"
                        >
                          Admin
                        </Link>
                      )}
                      {user.role === UserRole.INSTRUCTOR && (
                        <Link
                          href="/instructor/dashboard"
                          className="block px-4 py-2 text-sm text-charcoal hover:bg-forest-100"
                        >
                          Instructor
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-charcoal hover:bg-forest-100 last:rounded-b-md"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                >
                  Sign in
                </Link>
              )}

              <button
                type="button"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                className="md:hidden p-2 text-charcoal hover:bg-forest-100 rounded-md"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/60 bg-paper">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 -mx-3 rounded-md px-3 py-2.5 text-base font-semibold ${
                      isActive
                        ? 'text-forest-600 bg-forest-100'
                        : 'text-charcoal hover:bg-forest-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              {isAuthenticated && user && (
                <div className="pt-3 mt-3 border-t border-border/60 space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold text-charcoal hover:bg-forest-100"
                  >
                    Profile
                  </Link>
                  {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold text-charcoal hover:bg-forest-100"
                    >
                      Admin
                    </Link>
                  )}
                  {user.role === UserRole.INSTRUCTOR && (
                    <Link
                      href="/instructor/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold text-charcoal hover:bg-forest-100"
                    >
                      Instructor
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="w-full text-left -mx-3 block rounded-md px-3 py-2.5 text-base font-semibold text-charcoal hover:bg-forest-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="bg-paper border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-pewter">
              © {new Date().getFullYear()} Chitepo School of Ideology
            </p>
            <p className="text-xs text-pewter italic">Decolonising the Mind</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
