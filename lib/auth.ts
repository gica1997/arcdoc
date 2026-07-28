// ============================================
// ArcDoc Enterprise - Authentication Utilities
// ============================================

import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import type { JwtPayload } from '@/types';

/**
 * Hash a password using Argon2id.
 * Argon2 is the recommended password hashing algorithm (winner of PHC).
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: config.argon2.memoryCost,
    timeCost: config.argon2.timeCost,
    parallelism: config.argon2.parallelism,
  });
}

/**
 * Verify a password against its Argon2 hash.
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Generate a JWT access token.
 */
export function generateAccessToken(payload: JwtPayload): string {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string | number,
    algorithm: 'HS256' as const,
  } as jwt.SignOptions);
}

/**
 * Generate a JWT refresh token with longer expiration.
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const tokenId = uuidv4();
  const tokenPayload = {
    ...payload,
    jti: tokenId,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as string | number,
    algorithm: 'HS256' as const,
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT access token.
 * Returns the decoded payload or throws an error.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'],
  });

  return decoded as JwtPayload;
}

/**
 * Verify and decode a JWT refresh token.
 * Returns the decoded payload or throws an error.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  });

  return decoded as JwtPayload;
}

/**
 * Decode a JWT token without verification.
 * Useful for reading token metadata before full verification.
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token, { complete: false });
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a JWT access token and return payload, or null if invalid.
 * Safe version that never throws.
 */
export function verifyAccessTokenSafe(token: string): JwtPayload | null {
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from the Authorization header.
 */
export function extractBearerToken(
  authorizationHeader: string | null
): string | null {
  if (!authorizationHeader) return null;

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Check if a user has the required permission(s).
 * Supports checking single permission or multiple (ANY or ALL mode).
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermissions: string | string[],
  mode: 'any' | 'all' = 'any'
): boolean {
  const required = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  if (required.length === 0) return true;

  if (mode === 'any') {
    return required.some((perm) => userPermissions.includes(perm));
  }

  return required.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if a user has a specific role.
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Create a session cookie configuration for JWT.
 * Used for server-side session management.
 */
export function getSessionCookieOptions(maxAge?: number) {
  const maxAgeMs = maxAge || 7 * 24 * 60 * 60 * 1000; // Default 7 days

  return {
    name: 'arcdoc_session',
    httpOnly: true,
    secure: config.app.isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeMs / 1000, // Convert to seconds
  };
}

/**
 * Mask sensitive data in logs (email, tokens, etc.)
 */
export function maskSensitive(input: string, visibleChars = 4): string {
  if (!input || input.length <= visibleChars) return '***';
  const visiblePart = input.substring(0, visibleChars);
  return `${visiblePart}${'*'.repeat(Math.max(input.length - visibleChars, 3))}`;
}

export default {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyAccessTokenSafe,
  decodeToken,
  extractBearerToken,
  hasPermission,
  hasRole,
  getSessionCookieOptions,
  maskSensitive,
};
