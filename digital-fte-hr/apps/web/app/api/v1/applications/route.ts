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

export async function POST(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const body = await request.json();
    const { jobListingId, resumeProfileId } = body;

    if (!jobListingId) {
      return serverError('jobListingId is required');
    }

    // Check if job exists
    const job = await db.jobListing.findUnique({
      where: { id: jobListingId },
    });

    if (!job) {
      return serverError('Job not found');
    }

    // Get or create default resume
    let resumeId = resumeProfileId;
    if (!resumeId || resumeId === 'default') {
      const existingResume = await db.resumeProfile.findFirst({
        where: { userId: user.id },
      });
      resumeId = existingResume?.id || 'default-resume-' + user.id;
    }

    // Create application
    const application = await db.jobApplication.create({
      data: {
        userId: user.id,
        jobListingId,
        resumeProfileId: resumeId,
        status: 'pending_review',
        matchScore: 75,
      },
    });

    return success({
      applicationId: application.id,
      status: 'created',
      message: 'Application created successfully',
    });
  } catch (err) {
    console.error('Application creation error:', err);
    return serverError();
  }
}
