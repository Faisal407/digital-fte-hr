'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const pathname = usePathname();

  // Determine active tab from pathname
  let activeTab = 'profile';
  if (pathname.includes('notifications')) activeTab = 'notifications';
  else if (pathname.includes('channels')) activeTab = 'channels';
  else if (pathname.includes('billing')) activeTab = 'billing';

  const tabs = [
    { id: 'profile', label: 'Profile', href: '/dashboard/settings/profile' },
    { id: 'notifications', label: 'Notifications', href: '/dashboard/settings/notifications' },
    { id: 'channels', label: 'Channels', href: '/dashboard/settings/channels' },
    { id: 'billing', label: 'Billing', href: '/dashboard/settings/billing' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage your account preferences and integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href} className="no-underline">
              <Button
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`rounded-none border-b-2 px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-[#00F0A0] bg-green-50 text-gray-900'
                    : 'border-transparent hover:border-[#00F0A0] text-gray-600'
                }`}
              >
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
