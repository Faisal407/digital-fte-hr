'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    applicationStatus: true,
    weeklyReport: true,
    matchAlerts: true,
  });

  const [frequencies, setFrequencies] = useState({
    jobAlerts: 'instant',
    applicationStatus: 'daily',
    weeklyReport: 'weekly',
    matchAlerts: 'instant',
  });

  const [quietHours, setQuietHours] = useState({
    enabled: true,
    startTime: '23:00',
    endTime: '07:00',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
        const token = auth ? JSON.parse(auth).access_token : null;

        const response = await fetch('/api/v1/settings/notifications', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (data.success && data.preferences) {
          const prefs = data.preferences;
          setNotifications({
            jobAlerts: prefs.jobAlerts,
            applicationStatus: prefs.applicationStatus,
            weeklyReport: prefs.weeklyReport,
            matchAlerts: prefs.matchAlerts,
          });
          setFrequencies({
            jobAlerts: prefs.jobAlertsFrequency,
            applicationStatus: prefs.applicationStatusFrequency,
            weeklyReport: prefs.weeklyReportFrequency,
            matchAlerts: prefs.matchAlertsFrequency,
          });
          setQuietHours({
            enabled: prefs.quietHoursEnabled,
            startTime: prefs.quietHoursStart,
            endTime: prefs.quietHoursEnd,
          });
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleToggle = (key: string) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !(prev as any)[key],
    }));
  };

  const handleFrequencyChange = (key: string, value: string) => {
    setFrequencies((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleQuietHoursChange = (field: string, value: string | boolean) => {
    setQuietHours((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const response = await fetch('/api/v1/settings/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications,
          frequencies,
          quietHours,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Notification preferences saved!' });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to save preferences' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: '❌ Error saving preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-1 text-gray-600">Control how and when you receive updates</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Notification Types */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00F0A0]" />
          Notification Types
        </h2>

        <div className="space-y-6">
          {[
            { key: 'jobAlerts', label: 'Job Alerts', desc: 'Get notified when new matching jobs are found' },
            { key: 'applicationStatus', label: 'Application Status', desc: 'Updates on your submitted applications' },
            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Get a summary of your progress every week' },
            { key: 'matchAlerts', label: 'High Match Alerts', desc: 'Instant notifications for jobs with 90%+ match' },
          ].map((item) => (
            <div key={item.key} className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(notifications as any)[item.key]}
                    onChange={() => handleToggle(item.key)}
                    className="w-5 h-5 accent-[#00F0A0]"
                  />
                </label>
                {(notifications as any)[item.key] && (
                  <select
                    value={(frequencies as any)[item.key]}
                    onChange={(e) => handleFrequencyChange(item.key, e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#00F0A0]" />
          Quiet Hours
        </h2>

        <div className="space-y-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
              className="w-5 h-5 accent-[#00F0A0]"
            />
            <span className="ml-3 text-gray-900 font-medium">Enable Quiet Hours</span>
          </label>

          {quietHours.enabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4 pl-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-4">
            No notifications will be sent during quiet hours
          </p>
        </div>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-primary-400 hover:bg-primary-500 text-white"
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}
