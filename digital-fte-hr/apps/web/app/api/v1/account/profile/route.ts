import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { firstName, lastName, email, phone, location, timezone, salaryExpectation } = data;

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          firstName,
          lastName,
          email,
          phone,
          location,
          timezone,
          salaryExpectation,
          updatedAt: new Date().toISOString(),
        },
        message: 'Profile updated successfully',
      },
      meta: {
        processingTime: 53,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
        },
      },
      { status: 500 }
    );
  }
}
