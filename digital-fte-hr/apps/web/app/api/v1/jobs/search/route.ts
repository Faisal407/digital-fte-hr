import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, badRequest, serverError, accepted } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const body = await request.json();
    const { query, filters } = body;

    if (!query) {
      return badRequest('query is required');
    }

    console.log('Job search:', { query, filters });

    // Build WHERE clause with filters
    const whereConditions: any[] = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { companyName: { contains: query, mode: 'insensitive' } },
    ];

    const andConditions: any[] = [
      { OR: whereConditions }
    ];

    // Apply optional filters
    if (filters?.isRemote) {
      andConditions.push({ isRemote: true });
    }

    if (filters?.jobType) {
      // Would need a jobType field in schema - for now skip
    }

    if (filters?.salaryMin) {
      andConditions.push({
        OR: [
          { salaryMin: { gte: filters.salaryMin } },
          { salaryMax: { gte: filters.salaryMin } }
        ]
      });
    }

    if (filters?.datePosted) {
      const daysAgo = filters.datePosted === '7d' ? 7 : 30;
      const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      andConditions.push({ postedAt: { gte: cutoffDate } });
    }

    // Search for matching jobs immediately
    const searchWhere = andConditions.length > 1
      ? { AND: andConditions }
      : andConditions[0];

    console.log('Search where:', JSON.stringify(searchWhere, null, 2));

    const jobs = await db.jobListing.findMany({
      where: searchWhere,
      orderBy: { postedAt: 'desc' },
      take: 12,
    });

    console.log('Found jobs:', jobs.length);

    // Create task with results
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const task = await db.task.create({
      data: {
        userId: user.id,
        type: 'job_search',
        status: 'completed',
        inputData: { query },
        resultData: { jobs: jobs.map(j => ({
          id: j.id,
          title: j.title,
          companyName: j.companyName,
          location: j.location,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          platform: j.platform,
        })) },
        expiresAt,
      },
    });

    return accepted({
      taskId: task.id,
      status: 'completed',
      pollUrl: `/api/v1/tasks/${task.id}`,
    });
  } catch (err) {
    console.error('Job search error:', err);
    return serverError();
  }
}
