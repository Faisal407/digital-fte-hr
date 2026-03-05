import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      totalJobsFound: 247,
      applicationsSubmitted: 34,
      matchScore: 78,
      responseRate: 62,
      averageDaysToInterview: 12,
      platformBreakdown: [
        { platform: 'LinkedIn', jobs: 89, applications: 12 },
        { platform: 'Indeed', jobs: 78, applications: 8 },
        { platform: 'Glassdoor', jobs: 45, applications: 6 },
        { platform: 'NaukriGulf', jobs: 35, applications: 8 },
      ],
    },
    meta: {
      processingTime: 45,
    },
  });
}
