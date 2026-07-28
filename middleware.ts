// ============================================
// ArcDoc Enterprise - Next.js Middleware
// ============================================
// Handles authentication, authorization, and security headers.
// NOTE: API routes are auth-protected. Pages are protected client-side.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { securityHeaders } from '@/lib/security';

/**
 * Public paths that don't require authentication.
 */
const PUBLIC_API_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh-token',
  '/api/v1/portal/register',
  '/api/v1/admin/health',
];

/**
 * Static asset patterns to skip entirely (no security headers either).
 */
const STATIC_PATTERNS = [
  /^\/_next\/.+/,
  /^\/static\/.+/,
  /^\/images\/.+/,
  /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|ttf|eot)$/,
];

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_PATTERNS.some(p => p.test(pathname));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip middleware for static assets entirely ──
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // ─── API Route Authentication ────────────────────
  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }

    // Check Authorization header first, then cookie fallback
    let token: string | null = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    // Cookie fallback for server-side requests
    if (!token) {
      token = request.cookies.get('arcdoc_session')?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // ─── Security Headers ────────────────────────────
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // CSP: font-src 'self' data: for self-hosted fonts (no Google Fonts CDN)
  // connect-src https: for Turso DB API
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  );

  if (appConfig.app.isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|public/).*)',
  ],
};

