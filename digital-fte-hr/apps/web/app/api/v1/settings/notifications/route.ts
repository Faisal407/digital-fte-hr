import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const userProfile = await db.userProfile.findUnique({
      where: { id: user.id },
    });

    // Default preferences
    const defaultPrefs = {
      jobAlerts: true,
      applicationStatus: true,
      weeklyReport: true,
      matchAlerts: true,
      jobAlertsFrequency: 'instant',
      applicationStatusFrequency: 'daily',
      weeklyReportFrequency: 'weekly',
      matchAlertsFrequency: 'instant',
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
    };

    // Merge saved preferences with defaults
    const savedPrefs = userProfile?.notificationPrefs as any || {};
    const preferences = { ...defaultPrefs, ...savedPrefs };

    return success({
      preferences,
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const data = await request.json();
    const { notifications, frequencies, quietHours } = data;

    console.log('Saving notification preferences:', { notifications, frequencies, quietHours, userId: user.id });

    // Combine all preferences into single JSON object
    const preferencesData = {
      ...notifications,
      ...Object.entries(frequencies).reduce((acc, [key, value]) => {
        acc[`${key}Frequency`] = value;
        return acc;
      }, {} as Record<string, any>),
      ...quietHours,
    };

    // Save to database
    await db.userProfile.update({
      where: { id: user.id },
      data: {
        notificationPrefs: preferencesData,
      },
    });

    return success({
      message: 'Notification preferences updated successfully',
      preferences: {
        notifications,
        frequencies,
        quietHours,
      },
    });
  } catch (err) {
    console.error('Notifications save error:', err);
    return serverError();
  }
}
