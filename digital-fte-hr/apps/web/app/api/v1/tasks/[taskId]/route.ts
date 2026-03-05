import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  // Simulate various task states based on taskId
  if (taskId.startsWith('task-')) {
    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status: 'complete',
        progress: 1.0,
        result: {
          message: 'Task completed successfully',
          dataCount: 12,
        },
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        completedAt: new Date().toISOString(),
      },
      meta: {
        processingTime: 18,
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    },
    { status: 404 }
  );
}
