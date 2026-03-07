'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/app/providers/auth-provider';

export default function SettingsPage() {
  const { user } = useAuth();

  const userMetadata = user?.user_metadata || {};
  const [formData, setFormData] = useState({
    firstName: userMetadata.first_name || '',
    lastName: userMetadata.last_name || '',
    email: user?.email || '',
    phone: userMetadata.phone || '',
    timezone: userMetadata.timezone || 'UTC',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user?.email) {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      // Fetch current profile data from API
      fetch('/api/v1/account/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data?.profile) {
            const profile = data.data.profile;
            setFormData({
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              email: profile.email || '',
              phone: profile.phone || '',
              timezone: profile.timezone || 'UTC',
            });
          }
        })
        .catch(err => console.error('Failed to load profile:', err));
    }
  }, [user?.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const response = await fetch('/api/v1/account/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          timezone: formData.timezone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
        setHasChanges(false);
      } else {
        setMessage({
          type: 'error',
          text: '❌ Failed to update profile: ' + (data.error?.message || 'Unknown error'),
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Error saving profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Settings ⚙️</h1>
        <p className="mt-2 text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button className="px-4 py-2 border-b-2 border-primary-400 text-primary-400 font-semibold">
          Profile
        </button>
        <button className="px-4 py-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
          Notifications
        </button>
        <button className="px-4 py-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
          Privacy
        </button>
        <button className="px-4 py-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
          Billing
        </button>
      </div>

      {/* Profile Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>

        {message && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-1 bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed. Contact support if you need assistance.
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="mt-1 flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Dubai">Dubai</option>
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <Button
              type="submit"
              disabled={isSaving || !hasChanges}
              className="bg-primary-400 hover:bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </Button>
            {!hasChanges && message?.type === 'success' && (
              <p className="mt-2 text-sm text-green-700">All changes have been saved.</p>
            )}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 max-w-2xl">
        <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
        <p className="mt-2 text-sm text-red-800">
          These actions cannot be undone. Please be careful.
        </p>
        <Button
          variant="outline"
          className="mt-4 border-red-300 text-red-600 hover:bg-red-100"
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}
