import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';
import Button from './ui/Button';
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center">
            <Image
              src="/chitepo-logo.jpg"
              alt="Chitepo School of Ideology"
              width={64}
              height={64}
              className="h-16 w-auto"
              loading="eager"
              fetchPriority="high"
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            aria-label="Open main menu"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
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
              className={`text-sm font-semibold leading-6 transition-colors hover:text-primary-600 ${
                router.pathname === item.href 
                  ? 'text-primary-600' 
                  : 'text-gray-900'
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
            className="p-2 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          {isAuthenticated ? (
            <>
              {/* User menu */}
              <UserMenu user={user} />
            </>
          ) : (
            <div className="flex items-center gap-x-4">
              <Link
                href="/auth/login"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
              >
                Log in
              </Link>
              <Button href="/auth/register" size="sm">
                Sign up
              </Button>
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
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <Link href="/" className="-m-1.5 p-1.5 flex items-center">
                  <Image
                    src="/chitepo-logo.jpg"
                    alt="Chitepo School of Ideology"
                    width={64}
                    height={64}
                    className="h-16 w-auto"
                    loading="eager"
                    fetchPriority="high"
                  />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link href="/dashboard" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                        <Link href="/my-learning" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>My Courses</Link>
                        <Link href="/profile" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                        {user?.role === UserRole.INSTRUCTOR && (
                          <Link href="/instructor/dashboard" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Instructor Dashboard</Link>
                        )}
                        {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
                          <>
                            <Link href="/admin/users" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>User Management</Link>
                            <Link href="/admin/analytics" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => { setMobileMenuOpen(false); logout(); }}
                          className="w-full text-left -mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        >
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          href="/auth/login"
                          className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Log in
                        </Link>
                        <Button
                          href="/auth/register"
                          className="w-full"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign up
                        </Button>
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

