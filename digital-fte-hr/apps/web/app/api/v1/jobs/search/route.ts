import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'query is required',
            details: [{ field: 'query', issue: 'Required' }],
          },
        },
        { status: 400 }
      );
    }

    const taskId = `task-${randomUUID()}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          taskId,
          status: 'queued',
          pollUrl: `/api/v1/tasks/${taskId}`,
        },
        meta: {
          processingTime: 8,
        },
      },
      { status: 202 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process search request',
        },
      },
      { status: 500 }
    );
  }
}
