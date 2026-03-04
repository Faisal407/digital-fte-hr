import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validators';
import { mockUsers } from '@/lib/auth';

/**
 * POST /api/auth/register
 * Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    const { email, password, firstName, lastName } = validatedData;
    const emailLower = email.toLowerCase();

    // Check if user already exists
    if (mockUsers.has(emailLower)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email already exists. Please sign in instead.',
          },
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email: emailLower,
      password, // In production, this should be hashed with bcrypt
      name: `${firstName} ${lastName}`,
    };

    // Store user (in production, use a real database)
    mockUsers.set(emailLower, newUser);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          message: 'Account created successfully! Please sign in.',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    // Handle other errors
    const message = error.message || 'An error occurred during registration';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
