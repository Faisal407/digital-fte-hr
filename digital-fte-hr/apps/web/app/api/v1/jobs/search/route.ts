import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, badRequest, serverError, accepted } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return badRequest('query is required');
    }

    // Search for matching jobs immediately
    const jobs = await db.jobListing.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { postedAt: 'desc' },
      take: 12,
    });

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
