'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-provider';
import { supabase } from '@/lib/supabase-client';

interface DashboardHeaderProps {
  onMobileMenuClick?: () => void;
}

function getInitials(firstName: string = '', lastName: string = ''): string {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'US';
}

export function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.push('/auth/login');
  };

  const userMetadata = user?.user_metadata || {};
  const firstName = userMetadata.first_name || '';
  const lastName = userMetadata.last_name || '';
  const email = user?.email || '';
  const initials = getInitials(firstName, lastName);

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
              <div className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full bg-primary-400 text-xs sm:text-sm font-semibold text-white flex-shrink-0">
                {initials}
              </div>

              {/* User Info + Dropdown (hidden on mobile) */}
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {firstName || email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {email}
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
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/settings"
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
