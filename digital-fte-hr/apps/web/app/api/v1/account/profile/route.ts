import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const profile = await db.userProfile.findUnique({
      where: { id: user.id },
    });

    if (!profile) {
      return success({ profile: null });
    }

    return success({
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phoneE164,
        timezone: profile.timezone,
        plan: profile.plan,
      },
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const data = await request.json();
    const { firstName, lastName, phone, timezone, salaryMin, salaryMax } = data;

    const updated = await db.userProfile.update({
      where: { id: user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phoneE164: phone }),
        ...(timezone && { timezone }),
        ...(salaryMin !== undefined && { salaryMin }),
        ...(salaryMax !== undefined && { salaryMax }),
        lastActiveAt: new Date(),
      },
    });

    return success({
      profile: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phoneE164,
        timezone: updated.timezone,
        salaryMin: updated.salaryMin,
        salaryMax: updated.salaryMax,
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: 'Profile updated successfully',
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return serverError();
  }
}
