// ============================================
// ArcDoc Enterprise - Auth Handler Helper
// ============================================
// Centralized auth for API route handlers.
// Extracts token from Authorization header or cookie, verifies JWT.

import { NextRequest } from 'next/server';
import { verifyAccessTokenSafe, extractBearerToken } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import type { JwtPayload } from '@/types';

export interface AuthResult {
  payload: JwtPayload;
  token: string;
}

/**
 * Extract and verify the JWT token from a request.
 * Checks Authorization header first, then falls back to arcdoc_session cookie.
 * Returns the JWT payload or sends a 401 response.
 */
export function getAuthUser(request: NextRequest): AuthResult | ReturnType<typeof unauthorizedResponse> {
  // 1. Try Authorization header
  const authHeader = request.headers.get('authorization');
  let token = extractBearerToken(authHeader);

  // 2. Try cookie fallback
  if (!token) {
    token = request.cookies.get('arcdoc_session')?.value || null;
  }

  if (!token) {
    return unauthorizedResponse('Autentificare necesară.');
  }

  const payload = verifyAccessTokenSafe(token);
  if (!payload) {
    return unauthorizedResponse('Sesiune expirată. Vă rugăm să vă autentificați din nou.');
  }

  return { payload, token };
}
