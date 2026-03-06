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

    // Verify user owns this task
    if (task.userId !== user.id) return unauthorized('You do not have access to this task');

    return success({
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      result: task.resultData,
      error: task.errorReason,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error('Task fetch error:', err);
    return serverError();
  }
}
