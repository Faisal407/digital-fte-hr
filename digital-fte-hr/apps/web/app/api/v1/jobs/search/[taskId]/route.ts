import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, notFound, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  const { taskId } = params;

  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return notFound('Task not found');
    if (task.userId !== user.id) return unauthorized('You do not have access to this task');

    // If task is still pending/processing, return status
    if (task.status === 'pending' || task.status === 'processing') {
      return success({
        taskId,
        status: task.status,
        progress: task.progress,
        message: 'Job search in progress...',
      });
    }

    // If task is completed, return stored results
    if (task.status === 'completed') {
      const resultData = task.resultData as any;
      const jobs = resultData?.jobs || [];

      return success({
        taskId,
        status: 'complete',
        jobs,
        total: jobs.length,
        processingTime: 500,
      });
    }

    // Task failed
    return success({
      taskId,
      status: task.status,
      error: task.errorReason,
    });
  } catch (err) {
    console.error('Job search error:', err);
    return serverError();
  }
}
