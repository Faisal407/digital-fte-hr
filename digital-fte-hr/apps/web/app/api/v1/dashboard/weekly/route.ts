import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const applications = await db.jobApplication.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        jobListing: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayApps = applications.filter(
        (app) => app.createdAt >= dayStart && app.createdAt < dayEnd
      );

      weekData.push({
        date: dayNames[date.getDay()],
        jobs: 0,
        applications: dayApps.length,
        interviews: 0,
      });
    }

    const topJobs = applications.slice(0, 3).map((app) => ({
      id: app.jobListingId,
      title: app.jobListing.title,
      company: app.jobListing.companyName,
      matchScore: app.matchScore,
      platform: app.jobListing.platform,
      postedAt: `${Math.floor((now.getTime() - app.jobListing.postedAt.getTime()) / (24 * 60 * 60 * 1000))} days ago`,
    }));

    return success({
      chartData: weekData,
      topJobs,
      totalJobsThisWeek: 0,
      totalApplicationsThisWeek: applications.length,
      totalInterviewsScheduled: 0,
    });
  } catch (err) {
    console.error('Weekly dashboard error:', err);
    return serverError();
  }
}
