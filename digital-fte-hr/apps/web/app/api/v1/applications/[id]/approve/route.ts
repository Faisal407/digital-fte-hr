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
    await request.json();

    // Verify user owns this application
    const app = await db.jobApplication.findFirst({
      where: { id, userId: user.id },
      include: { jobListing: true },
    });

    if (!app) return notFound('Application not found');

    // Update application status
    const updated = await db.jobApplication.update({
      where: { id },
      data: {
        status: 'submitted',
        approvedAt: new Date(),
        submittedAt: new Date(),
      },
    });

    return success({
      applicationId: updated.id,
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString(),
      submissionDetails: {
        platform: app.jobListing.platform,
        screenshotUrl: 'https://via.placeholder.com/800x600',
        submittedAt: updated.submittedAt?.toISOString(),
      },
    });
  } catch (err) {
    console.error('Application approval error:', err);
    return serverError();
  }
}
