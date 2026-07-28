// ============================================
// ArcDoc Enterprise - Next.js Middleware
// ============================================
// Handles authentication, authorization, and security headers.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { securityHeaders } from '@/lib/security';

/**
 * Public paths that don't require authentication.
 */
const PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh-token',
  '/api/v1/portal/register',
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm-account',
  '/portal',
  '/portal/dashboard',
  '/portal/register',
  '/favicon.ico',
];

/**
 * Static assets that should bypass authentication.
 */
const STATIC_PATTERNS = [
  /^\/_next\//,
  /^\/static\//,
  /^\/images\//,
  /^\/api\/docs/,
  /^\/_next\/data\//,
  /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|ttf|eot)$/,
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (STATIC_PATTERNS.some((pattern) => pattern.test(pathname))) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ONLY protect API routes - pages are protected client-side via AppLayout
  if (pathname.startsWith('/api/')) {
    // Skip auth for public API endpoints
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // ─── Security Headers ──────────────────
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  );

  if (appConfig.app.isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/**
 * Configure which paths the middleware runs on.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|public/).*)',
  ],
};