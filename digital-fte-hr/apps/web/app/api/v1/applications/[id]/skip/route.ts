import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const { reason } = data;

    return NextResponse.json({
      success: true,
      data: {
        applicationId: id,
        status: 'skipped',
        skipReason: reason || 'user_skipped',
        skippedAt: new Date().toISOString(),
      },
      meta: {
        processingTime: 42,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to skip application',
        },
      },
      { status: 500 }
    );
  }
}
