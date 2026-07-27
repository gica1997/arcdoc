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
  '/',
  '/login',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm-account',
  '/portal',
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
  /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|ttf|eot)$/,
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (STATIC_PATTERNS.some((pattern) => pattern.test(pathname))) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ─── Security Headers ──────────────────

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  );

  // Strict Transport Security (HSTS) - only in production
  if (appConfig.app.isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // ─── Authentication Check ──────────────

  // Skip auth check for public paths and static assets
  if (isPublicPath(pathname)) {
    return response;
  }

  // Check for authentication on API routes
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Token verification is done at the route handler level
    // Middleware just checks for the presence of the Authorization header
  }

  // Check for authentication on protected pages
  if (!isPublicPath(pathname) && !pathname.startsWith('/api/')) {
    const sessionToken = request.cookies.get('arcdoc_session')?.value;
    const authHeader = request.headers.get('authorization');

    // If no session cookie and no auth header on a protected page, redirect to login
    if (!sessionToken && !authHeader) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── CORS for API Routes ──────────────

  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      appConfig.app.url,
      'https://arcdoc.vercel.app',
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Vary', 'Origin');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // ─── Rate Limiting (API Only) ──────────

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/docs')) {
    // Rate limiting is handled at the route handler level for more granularity
    response.headers.set('X-RateLimit-Limit', String(appConfig.rateLimit.max));
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