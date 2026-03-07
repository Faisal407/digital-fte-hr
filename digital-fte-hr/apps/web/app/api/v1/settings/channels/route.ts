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

    return success({
      channels: {
        whatsapp: {
          connected: false,
          phoneNumber: userProfile?.phoneE164 || '',
          verified: false,
        },
        telegram: {
          connected: false,
          botName: '',
          verified: false,
        },
        email: {
          connected: true,
          email: userProfile?.email || '',
          verified: true,
        },
      },
    });
  } catch (err) {
    console.error('Channels fetch error:', err);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const data = await request.json();
    const { action, channel, phoneNumber, botName } = data;

    console.log('Channel action:', { action, channel, phoneNumber, botName });

    if (action === 'connect') {
      // In production, verify the channel connection here
      // Send OTP to WhatsApp, verify Telegram bot, etc.
      return success({
        message: `${channel} connected successfully`,
        channel: {
          name: channel,
          connected: true,
          verified: true,
          phoneNumber: phoneNumber || undefined,
          botName: botName || undefined,
        },
      });
    } else if (action === 'disconnect') {
      // Disconnect the channel
      return success({
        message: `${channel} disconnected successfully`,
      });
    }

    return serverError('Invalid action');
  } catch (err) {
    console.error('Channels save error:', err);
    return serverError();
  }
}
