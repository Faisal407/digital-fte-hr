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
          connected: !!userProfile?.whatsappPhone,
          phoneNumber: userProfile?.whatsappPhone || '',
          verified: userProfile?.whatsappVerified || false,
        },
        telegram: {
          connected: !!userProfile?.telegramBotName,
          botName: userProfile?.telegramBotName || '',
          verified: userProfile?.telegramVerified || false,
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
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const data = await request.json();
    const { action, channel, phoneNumber, botName } = data;

    console.log('Channel action:', { action, channel, phoneNumber, botName, userId: user.id });

    if (action === 'connect') {
      // Save channel connection to database
      const updateData: any = {};

      if (channel === 'whatsapp' && phoneNumber) {
        updateData.whatsappPhone = phoneNumber;
        updateData.whatsappVerified = true;
      } else if (channel === 'telegram' && botName) {
        updateData.telegramBotName = botName;
        updateData.telegramVerified = true;
      }

      if (Object.keys(updateData).length > 0) {
        await db.userProfile.update({
          where: { id: user.id },
          data: updateData,
        });
      }

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
      // Disconnect the channel from database
      const updateData: any = {};

      if (channel === 'whatsapp') {
        updateData.whatsappPhone = null;
        updateData.whatsappVerified = false;
      } else if (channel === 'telegram') {
        updateData.telegramBotName = null;
        updateData.telegramVerified = false;
      }

      if (Object.keys(updateData).length > 0) {
        await db.userProfile.update({
          where: { id: user.id },
          data: updateData,
        });
      }

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
