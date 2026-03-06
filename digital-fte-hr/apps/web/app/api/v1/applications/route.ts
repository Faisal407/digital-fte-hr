import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');

    const applications = await db.jobApplication.findMany({
      where: {
        userId: user.id,
        ...(statusParam && { status: statusParam as any }),
      },
      include: { jobListing: true },
      orderBy: { createdAt: 'desc' },
    });

    const allApps = await db.jobApplication.findMany({
      where: { userId: user.id },
    });

    const stats = {
      totalApplications: allApps.length,
      pending_review: allApps.filter((a) => a.status === 'pending_review').length,
      submitted: allApps.filter((a) => a.status === 'submitted').length,
      viewed: allApps.filter((a) => a.status === 'viewed').length,
      shortlisted: allApps.filter((a) => a.status === 'shortlisted').length,
      rejected: allApps.filter((a) => a.status === 'rejected').length,
      skipped: allApps.filter((a) => a.status === 'skipped').length,
    };

    const formattedApps = applications.map((app) => ({
      id: app.id,
      jobTitle: app.jobListing.title,
      company: app.jobListing.companyName,
      status: app.status,
      matchScore: app.matchScore,
      appliedAt: app.createdAt.toISOString().split('T')[0],
      postedAt: app.jobListing.postedAt.toISOString().split('T')[0],
      platform: app.jobListing.platform,
      location: app.jobListing.location,
    }));

    return success({
      applications: formattedApps,
      total: formattedApps.length,
      stats,
    });
  } catch (err) {
    console.error('Applications fetch error:', err);
    return serverError();
  }
}
