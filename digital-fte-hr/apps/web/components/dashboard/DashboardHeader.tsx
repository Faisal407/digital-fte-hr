'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';

interface DashboardHeaderProps {
  onMobileMenuClick?: () => void;
}

export function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const user = session?.user;
  const initials = user
    ? getInitials(
        (user as any)?.firstName || 'User',
        (user as any)?.lastName || 'Account',
      )
    : 'UA';

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left side - Mobile menu & title */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <span className="text-xl">☰</span>
          </button>

          <h2 className="text-sm font-medium text-gray-600 hidden sm:block">Welcome back</h2>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <span className="text-lg sm:text-xl">🔔</span>
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full"></span>
          </button>

          {/* User Avatar & Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Avatar */}
              <div className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full bg-blue-600 text-xs sm:text-sm font-semibold text-white flex-shrink-0">
                {initials}
              </div>

              {/* User Info + Dropdown (hidden on mobile) */}
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="User menu"
                >
                  <span className="text-lg">⋯</span>
                </button>

                {/* Dropdown Items */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <Link
                      href="/dashboard/settings/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/settings/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
