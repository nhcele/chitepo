import { withBasePath } from '@/lib/basePath';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

const navigation = [
  { name: 'Courses', href: '/courses' },
  { name: 'My Courses', href: '/my-learning' },
  { name: 'Instructors', href: '/instructors' },
  { name: 'Enterprise', href: '/enterprise' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-paper border-b border-border/60 sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative block h-10 w-10 flex-shrink-0">
              <Image
                src={withBasePath("/chitepo-logo.jpg")}
                alt="Chitepo School of Ideology"
                fill
                className="object-contain"
                sizes="2.5rem"
                loading="eager"
                fetchPriority="high"
              />
            </span>
            <span className="hidden sm:block font-serif text-lg font-semibold text-charcoal leading-tight">
              Chitepo
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            aria-label="Open main menu"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-charcoal"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 transition-colors hover:text-forest-600 ${
                router.pathname === item.href 
                  ? 'text-forest-600' 
                  : 'text-charcoal'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="p-2 text-pewter hover:text-charcoal transition-colors"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          {isAuthenticated ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-x-4">
              <Link
                href="/auth/login"
                className="text-sm font-semibold leading-6 text-charcoal hover:text-forest-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50"
          >
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-cream px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-border">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <span className="relative block h-10 w-10 flex-shrink-0">
                    <Image
                      src={withBasePath("/chitepo-logo.jpg")}
                      alt="Chitepo School of Ideology"
                      fill
                      className="object-contain"
                      sizes="2.5rem"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </span>
                  <span className="font-serif text-lg font-semibold text-charcoal">Chitepo</span>
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="-m-2.5 rounded-md p-2.5 text-charcoal"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-border/60">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-md px-3 py-2 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link href="/dashboard" className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                        <Link href="/my-learning" className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100" onClick={() => setMobileMenuOpen(false)}>My Courses</Link>
                        <Link href="/profile" className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                        {user?.role === UserRole.INSTRUCTOR && (
                          <Link href="/instructor/dashboard" className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100" onClick={() => setMobileMenuOpen(false)}>Instructor Dashboard</Link>
                        )}
                        {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
                          <>
                            <Link href="/admin/users" className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100" onClick={() => setMobileMenuOpen(false)}>User Management</Link>
                            <Link href="/admin/analytics" className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => { setMobileMenuOpen(false); logout(); }}
                          className="w-full text-left -mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100"
                        >
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          href="/auth/login"
                          className="-mx-3 block rounded-md px-3 py-2.5 text-base font-semibold leading-7 text-charcoal hover:bg-forest-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Log in
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 transition-colors"
                        >
                          Sign up
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
