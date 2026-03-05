import { NextRequest, NextResponse } from 'next/server';

const mockApplications = [
  {
    id: 'app-1',
    jobTitle: 'Senior Product Manager',
    company: 'Tech Corp',
    status: 'pending_review',
    matchScore: 92,
    appliedAt: '2024-03-05',
    postedAt: '2024-03-03',
    platform: 'LinkedIn',
  },
  {
    id: 'app-2',
    jobTitle: 'Product Manager - Growth',
    company: 'Startup Inc',
    status: 'submitted',
    matchScore: 85,
    appliedAt: '2024-03-04',
    postedAt: '2024-03-04',
    platform: 'Indeed',
  },
  {
    id: 'app-3',
    jobTitle: 'PM II - Backend',
    company: 'Cloud Systems',
    status: 'viewed',
    matchScore: 78,
    appliedAt: '2024-03-02',
    postedAt: '2024-03-02',
    platform: 'Glassdoor',
  },
  {
    id: 'app-4',
    jobTitle: 'Product Manager',
    company: 'Middle East Tech',
    status: 'shortlisted',
    matchScore: 72,
    appliedAt: '2024-02-28',
    postedAt: '2024-02-27',
    platform: 'NaukriGulf',
  },
  {
    id: 'app-5',
    jobTitle: 'Sr. PM - Enterprise',
    company: 'Fortune 500 Corp',
    status: 'submitted',
    matchScore: 88,
    appliedAt: '2024-02-25',
    postedAt: '2024-02-23',
    platform: 'LinkedIn',
  },
  {
    id: 'app-6',
    jobTitle: 'Associate Product Manager',
    company: 'EdTech Startup',
    status: 'rejected',
    matchScore: 65,
    appliedAt: '2024-02-20',
    postedAt: '2024-02-18',
    platform: 'Indeed',
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');

  let filtered = mockApplications;
  if (status) {
    filtered = mockApplications.filter((app) => app.status === status);
  }

  return NextResponse.json({
    success: true,
    data: {
      applications: filtered,
      total: filtered.length,
      stats: {
        totalApplications: mockApplications.length,
        pending: mockApplications.filter((a) => a.status === 'pending_review').length,
        submitted: mockApplications.filter((a) => a.status === 'submitted').length,
        viewed: mockApplications.filter((a) => a.status === 'viewed').length,
        shortlisted: mockApplications.filter((a) => a.status === 'shortlisted').length,
        rejected: mockApplications.filter((a) => a.status === 'rejected').length,
      },
    },
    meta: {
      processingTime: 28,
    },
  });
}
