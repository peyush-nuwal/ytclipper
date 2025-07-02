import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Only allow embedding on same origin
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
  );

  // API route specific security
  if (request.nextUrl.pathname.startsWith('/api/waitlist')) {
    // Add CORS headers for API routes
    response.headers.set(
      'Access-Control-Allow-Origin',
      request.headers.get('origin') || '*'
    );
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }

    // Additional API security headers
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
