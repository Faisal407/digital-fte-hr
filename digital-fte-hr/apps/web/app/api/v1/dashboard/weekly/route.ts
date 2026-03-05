import { NextResponse } from 'next/server';

export async function GET() {
  const weekData = [
    { date: 'Mon', jobs: 8, applications: 2, interviews: 1 },
    { date: 'Tue', jobs: 12, applications: 3, interviews: 0 },
    { date: 'Wed', jobs: 15, applications: 5, interviews: 2 },
    { date: 'Thu', jobs: 10, applications: 2, interviews: 1 },
    { date: 'Fri', jobs: 18, applications: 4, interviews: 1 },
    { date: 'Sat', jobs: 5, applications: 1, interviews: 0 },
    { date: 'Sun', jobs: 3, applications: 0, interviews: 0 },
  ];

  const topJobs = [
    {
      id: 'job-1',
      title: 'Senior Product Manager',
      company: 'Tech Corp',
      matchScore: 92,
      platform: 'LinkedIn',
      postedAt: '2 days ago',
    },
    {
      id: 'job-2',
      title: 'Product Manager - Growth',
      company: 'Startup Inc',
      matchScore: 85,
      platform: 'Indeed',
      postedAt: '1 day ago',
    },
    {
      id: 'job-3',
      title: 'PM II - Backend',
      company: 'Cloud Systems',
      matchScore: 78,
      platform: 'Glassdoor',
      postedAt: '3 days ago',
    },
  ];

  return NextResponse.json({
    success: true,
    data: {
      chartData: weekData,
      topJobs,
      totalJobsThisWeek: 71,
      totalApplicationsThisWeek: 17,
      totalInterviewsScheduled: 5,
    },
    meta: {
      processingTime: 32,
    },
  });
}
