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

    // Create task in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const task = await db.task.create({
      data: {
        userId: user.id,
        type: 'job_search',
        status: 'processing',
        inputData: { query },
        expiresAt,
      },
    });

    return accepted({
      taskId: task.id,
      status: 'queued',
      pollUrl: `/api/v1/tasks/${task.id}`,
    });
  } catch (err) {
    console.error('Job search error:', err);
    return serverError();
  }
}
