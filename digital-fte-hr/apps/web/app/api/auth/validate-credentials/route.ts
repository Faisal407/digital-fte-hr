import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mockUsers } from '@/lib/auth';

const validateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = validateSchema.parse(body);

    const emailLower = email.toLowerCase();

    // Check if user exists
    const user = mockUsers.get(emailLower);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found. Please create a new account first.',
        },
        { status: 401 }
      );
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json(
        {
          success: false,
          error: 'WRONG_PASSWORD',
          message: 'Wrong password. Please try again.',
        },
        { status: 401 }
      );
    }

    // Credentials are valid
    return NextResponse.json({
      success: true,
      message: 'Credentials validated successfully.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: firstError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'An error occurred while validating credentials.',
      },
      { status: 500 }
    );
  }
}
