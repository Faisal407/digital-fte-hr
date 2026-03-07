'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const pathname = usePathname();

  // Detect active tab from URL
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
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href} className="no-underline">
              <Button
                variant="ghost"
                className={`rounded-none border-b-2 px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-[#00F0A0] text-gray-900 bg-green-50'
                    : 'border-transparent text-gray-600 hover:border-[#00F0A0]'
                }`}
              >
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Billing Tab Content */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Plan</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="border border-[#00F0A0] rounded-lg p-6 bg-green-50">
                <Badge className="bg-[#00F0A0] text-black mb-2">Current Plan</Badge>
                <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                <p className="text-gray-600 mt-1">$29/month</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-[#00F0A0]">✓</span> 50 applications/day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00F0A0]">✓</span> Resume optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00F0A0]">✓</span> 10 active resumes
                  </li>
                </ul>
                <p className="text-xs text-gray-600 mt-4">Next billing date: April 5, 2024</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900">Elite</h3>
                <p className="text-gray-600 mt-1">$79/month</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> 150 applications/day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> All Pro features
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Weekly coaching report
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  Upgrade to Elite
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">March 2024 - Pro Plan</p>
                  <p className="text-sm text-gray-600">Charge on March 5, 2024</p>
                </div>
                <p className="font-semibold text-gray-900">$29.00</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">February 2024 - Pro Plan</p>
                  <p className="text-sm text-gray-600">Charge on February 5, 2024</p>
                </div>
                <p className="font-semibold text-gray-900">$29.00</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
