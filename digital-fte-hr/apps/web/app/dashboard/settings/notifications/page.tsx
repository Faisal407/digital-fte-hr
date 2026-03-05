'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Clock } from 'lucide-react';

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

  const handleSave = () => {
    console.log('Saved preferences:', { notifications, frequencies, quietHours });
    // TODO: Call API to save preferences
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-1 text-gray-600">Control how and when you receive updates</p>
      </div>

      {/* Notification Types */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00F0A0]" />
          Notification Types
        </h2>

        <div className="space-y-6">
          {/* Job Alerts */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Job Alerts</h3>
              <p className="text-sm text-gray-600 mt-1">
                Get notified when new matching jobs are found
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.jobAlerts}
                  onChange={() => handleToggle('jobAlerts')}
                  className="w-5 h-5 accent-[#00F0A0]"
                />
              </label>
              {notifications.jobAlerts && (
                <select
                  value={frequencies.jobAlerts}
                  onChange={(e) => handleFrequencyChange('jobAlerts', e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly</option>
                </select>
              )}
            </div>
          </div>

          {/* Application Status Updates */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Application Status Updates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Updates when applications are viewed or status changes
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.applicationStatus}
                  onChange={() => handleToggle('applicationStatus')}
                  className="w-5 h-5 accent-[#00F0A0]"
                />
              </label>
              {notifications.applicationStatus && (
                <select
                  value={frequencies.applicationStatus}
                  onChange={(e) => handleFrequencyChange('applicationStatus', e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly</option>
                </select>
              )}
            </div>
          </div>

          {/* Weekly Report */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Weekly Progress Report</h3>
              <p className="text-sm text-gray-600 mt-1">
                Summary of your job search activity and progress
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={() => handleToggle('weeklyReport')}
                  className="w-5 h-5 accent-[#00F0A0]"
                />
              </label>
              {notifications.weeklyReport && (
                <select
                  value={frequencies.weeklyReport}
                  onChange={(e) => handleFrequencyChange('weeklyReport', e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Sun)</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
            </div>
          </div>

          {/* High Match Alerts */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">High Match Alerts (80%+)</h3>
              <p className="text-sm text-gray-600 mt-1">Instant alerts for top matching jobs</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.matchAlerts}
                  onChange={() => handleToggle('matchAlerts')}
                  className="w-5 h-5 accent-[#00F0A0]"
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#00F0A0]" />
          Quiet Hours
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietHours.enabled}
                onChange={(e) => setQuietHours((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-5 h-5 accent-[#00F0A0]"
              />
              <span className="ml-2 text-gray-900 font-medium">Enable Quiet Hours</span>
            </label>
          </div>

          {quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 ml-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => setQuietHours((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => setQuietHours((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded px-3 py-2"
                />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-4">
            No notifications will be sent between {quietHours.startTime} and {quietHours.endTime}
          </p>
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="bg-[#00F0A0] hover:bg-[#00D68A] text-black font-semibold"
      >
        Save Preferences
      </Button>
    </div>
  );
}
