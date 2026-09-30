import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';
import { UserGroupIcon, ChartBarIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@mindelta/shared';

interface UserMenuProps {
  user: User | null;
}

export default function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  const isInstructor = user.role === UserRole.INSTRUCTOR;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold text-charcoal shadow-sm ring-1 ring-inset ring-border hover:bg-paper">
          {user.avatar ? (
            <Image
              className="h-8 w-8 rounded-full"
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
            />
          ) : (
            <UserCircleIcon className="h-8 w-8 text-pewter" />
          )}
          <span className="hidden sm:block ml-2">{user.name}</span>
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-pewter" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-border/60 rounded-md bg-white shadow-sm ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm">Signed in as</p>
            <p className="text-sm font-medium text-charcoal truncate">{user.email}</p>
          </div>
          
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/dashboard"
                  className={`${
                    active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                  } group flex items-center px-4 py-2 text-sm`}
                >
                  <UserCircleIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                  Dashboard
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={`${
                    active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                  } group flex items-center px-4 py-2 text-sm`}
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                  Profile
                </Link>
              )}
            </Menu.Item>
          </div>

          {isInstructor && (
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/instructor/dashboard"
                    className={`${
                      active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                    } group flex items-center px-4 py-2 text-sm`}
                  >
                    <ChartBarIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                    Instructor Dashboard
                  </Link>
                )}
              </Menu.Item>
            </div>
          )}

          {isAdmin && (
            <div className="py-1">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-pewter uppercase tracking-wider">Admin</p>
              </div>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/users"
                    className={`${
                      active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                    } group flex items-center px-4 py-2 text-sm`}
                  >
                    <UserGroupIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                    User Management
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/analytics"
                    className={`${
                      active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                    } group flex items-center px-4 py-2 text-sm`}
                  >
                    <ChartBarIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                    Analytics
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/settings"
                    className={`${
                      active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                    } group flex items-center px-4 py-2 text-sm`}
                  >
                    <AdjustmentsHorizontalIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                    Admin Settings
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/approval-queue"
                    className={`${
                      active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                    } group flex items-center px-4 py-2 text-sm`}
                  >
                    <ShieldCheckIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                    Approval Queue
                  </Link>
                )}
              </Menu.Item>
            </div>
          )}
          
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`${
                    active ? 'bg-forest-100 text-charcoal' : 'text-charcoal'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-pewter group-hover:text-stone" />
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
