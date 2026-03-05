'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DashboardSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

const MAIN_MENU = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/recommendations', icon: '⚡', label: 'Recommendations' },
  { href: '/dashboard/resume', icon: '📄', label: 'Resume' },
  { href: '/dashboard/applications', icon: '✅', label: 'Applications' },
  { href: '/dashboard/interview', icon: '🎯', label: 'Interview Prep' },
  { href: '/dashboard/analytics', icon: '📈', label: 'Analytics' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export function DashboardSidebar({ mobile = false, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();

  const SidebarContent = () => (
    <>
      {/* Logo Area */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <Link href="/dashboard" className="font-bold text-lg text-gray-900">
          <span className="text-primary-400">◆</span> Digital FTE
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {MAIN_MENU.map((item) => {
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Plan Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-lg bg-primary-50 p-3">
          <p className="text-xs font-semibold text-primary-700">Free Plan</p>
          <p className="mt-1 text-xs text-primary-600">0 apps/day</p>
          <Link href="/dashboard/settings">
            <Button
              variant="default"
              className="mt-2 h-8 w-full text-xs bg-primary-400 hover:bg-primary-500 text-white"
            >
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    </>
  );

  // Mobile version
  if (mobile) {
    return (
      <div className="flex h-full flex-col bg-white">
        <SidebarContent />
      </div>
    );
  }

  // Desktop version
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white">
      <SidebarContent />
    </aside>
  );
}
