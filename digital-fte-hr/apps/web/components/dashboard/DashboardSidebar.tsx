'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui-store';
import { useSession } from 'next-auth/react';
import { MAIN_MENU, PLAN_LIMITS } from '@/lib/constants';

interface DashboardSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function DashboardSidebar({ mobile = false, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { data: session } = useSession();

  // Get user plan from session or default to 'free'
  const userPlan = (session?.user as any)?.plan || 'free';
  const planConfig = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];

  const SidebarContent = () => (
    <>
      {/* Logo Area */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <Link href="/dashboard" className="font-bold text-gray-900">
          Digital FTE
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 hidden md:inline-flex"
            title="Toggle sidebar"
          >
            {sidebarCollapsed ? '→' : '←'}
          </Button>
        )}
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
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50',
              )}
              title={sidebarCollapsed && !mobile ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {(!sidebarCollapsed || mobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Plan Info */}
      {(!sidebarCollapsed || mobile) && (
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-900">
              {userPlan === 'free' ? 'Free Plan' : userPlan === 'pro' ? 'Pro Plan' : 'Elite Plan'}
            </p>
            {planConfig?.applyDailyLimit > 0 && (
              <p className="mt-1 text-xs text-blue-700">
                {planConfig.applyDailyLimit} apps/day
              </p>
            )}
            {userPlan === 'free' && (
              <Link href="/dashboard/settings/plan" onClick={onNavigate}>
                <Button
                  variant="default"
                  className="mt-2 h-8 w-full text-xs"
                >
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Mobile version - just render content (parent handles sheet)
  if (mobile) {
    return (
      <div className="flex h-full flex-col bg-white">
        <SidebarContent />
      </div>
    );
  }

  // Desktop version
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-gray-200 bg-white transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64',
      )}
    >
      <SidebarContent />
    </aside>
  );
}
