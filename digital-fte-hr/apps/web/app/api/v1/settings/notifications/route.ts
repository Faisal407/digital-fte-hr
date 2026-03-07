import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, serverError, success } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    // For now, return default preferences
    // In future, store these in DB
    return success({
      preferences: {
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
      },
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const data = await request.json();
    const { notifications, frequencies, quietHours } = data;

    console.log('Saving notification preferences:', { notifications, frequencies, quietHours });

    // In production, save these to database with user_id
    // For now, just acknowledge receipt
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
