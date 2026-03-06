import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, notFound, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const { id } = params;
    const data = await request.json();
    const { reason } = data;

    // Verify user owns this application
    const app = await db.jobApplication.findFirst({
      where: { id, userId: user.id },
    });

    if (!app) return notFound('Application not found');

    // Update application status
    const updated = await db.jobApplication.update({
      where: { id },
      data: {
        status: 'skipped',
        skipReason: reason || 'user_skipped',
        skippedAt: new Date(),
      },
    });

    return success({
      applicationId: updated.id,
      status: updated.status,
      skipReason: updated.skipReason,
      skippedAt: updated.skippedAt?.toISOString(),
    });
  } catch (err) {
    console.error('Application skip error:', err);
    return serverError();
  }
}
