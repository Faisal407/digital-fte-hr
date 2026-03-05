import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await request.json();

    return NextResponse.json({
      success: true,
      data: {
        applicationId: id,
        status: 'submitted',
        approvedAt: new Date().toISOString(),
        submissionDetails: {
          platform: 'LinkedIn',
          screenshotUrl: 'https://via.placeholder.com/800x600',
          submittedAt: new Date().toISOString(),
        },
      },
      meta: {
        processingTime: 156,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to approve application',
        },
      },
      { status: 500 }
    );
  }
}
