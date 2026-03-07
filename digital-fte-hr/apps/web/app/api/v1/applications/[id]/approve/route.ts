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
    console.log('Approving application:', { id, userId: user?.id });
    // Body is optional for approve
    try {
      await request.json();
    } catch {
      // Empty body is OK
    }

    // Verify user owns this application
    const app = await db.jobApplication.findFirst({
      where: { id, userId: user.id },
      include: { jobListing: true },
    });

    console.log('Found application:', { appId: app?.id, status: app?.status });
    if (!app) return notFound('Application not found');

    // Update application status
    console.log('Updating status to submitted');
    const updated = await db.jobApplication.update({
      where: { id },
      data: {
        status: 'submitted',
        approvedAt: new Date(),
        submittedAt: new Date(),
      },
    });
    console.log('Update successful:', { updatedId: updated.id, newStatus: updated.status });

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    return serverError(`Approval failed: ${errorMsg}`);
  }
}
