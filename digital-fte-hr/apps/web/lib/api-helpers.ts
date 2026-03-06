import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from './db';

/**
 * Get and verify Supabase user from Authorization header
 * Automatically upserts UserProfile on first call
 */
export async function getSupabaseUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: { code: 'MISSING_AUTH', message: 'Missing Authorization header' } };
  }

  const token = authHeader.slice(7);

  try {
    // Verify JWT using Supabase Admin client (service role key)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.admin.getUserById(token);

    if (authError || !supabaseUser) {
      return { user: null, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } };
    }

    // Upsert UserProfile in database
    const userData = await db.userProfile.upsert({
      where: { supabaseId: supabaseUser.id },
      update: { lastActiveAt: new Date() },
      create: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || 'User',
        lastName: supabaseUser.user_metadata?.last_name || '',
        timezone: 'UTC',
        plan: 'free',
      },
    });

    return { user: { id: userData.id, supabaseId: supabaseUser.id, email: userData.email }, error: null };
  } catch (err) {
    console.error('Auth error:', err);
    return {
      user: null,
      error: { code: 'AUTH_ERROR', message: 'Failed to verify user' },
    };
  }
}

/**
 * Response helpers
 */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message } }, { status: 404 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: { code: 'VALIDATION_ERROR', message, details },
    },
    { status: 400 }
  );
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json(
    {
      success: false,
      error: { code: 'SERVER_ERROR', message },
    },
    { status: 500 }
  );
}

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function accepted<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status: 202 }
  );
}
