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

type AuthResponse = { ok: true; payload: JwtPayload; token: string } | { ok: false; response: ReturnType<typeof unauthorizedResponse> };

/**
 * Extract and verify the JWT token from a request.
 * Checks Authorization header first, then falls back to arcdoc_session cookie.
 * Returns typed result with discriminated union for type narrowing.
 */
export function getAuthUser(request: NextRequest): AuthResponse {
  const authHeader = request.headers.get('authorization');
  let token = extractBearerToken(authHeader);

  if (!token) {
    token = request.cookies.get('arcdoc_session')?.value || null;
  }

  if (!token) {
    return { ok: false, response: unauthorizedResponse('Autentificare necesară.') };
  }

  const payload = verifyAccessTokenSafe(token);
  if (!payload) {
    return { ok: false, response: unauthorizedResponse('Sesiune expirată. Vă rugăm să vă autentificați din nou.') };
  }

  return { ok: true, payload, token };
}
