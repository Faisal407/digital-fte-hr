/**
 * NextAuth Middleware
 * Protects routes that require authentication
 */

import { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Middleware code is only invoked when the route matches
  // Routes in authConfig.pages are never protected
  return;
}

// Matcher: apply middleware to all routes except
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
