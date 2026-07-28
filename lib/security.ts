// ============================================
// ArcDoc Enterprise - Security Utilities
// ============================================

/**
 * Input sanitization utilities to prevent XSS and injection attacks.
 */

/**
 * Sanitize a string by removing HTML tags and dangerous characters.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      switch (char) {
        case '<':
          return '<';
        case '>':
          return '>';
        case '"':
          return '"';
        case "'":
          return '&#x27;';
        case '&':
          return '&';
        default:
          return char;
      }
    })
    .trim();
}

/**
 * Sanitize an object recursively.
 * All string values will be sanitized.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate that a string only contains safe characters for SQL identifiers.
 * This prevents SQL injection through column/table names in dynamic queries.
 */
export function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Escape a string for safe use in LIKE clauses.
 * Prevents wildcard injection attacks.
 */
export function escapeLikeString(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Generate a cryptographically secure random token.
 * Uses Web Crypto API when available, falls back to Node.js crypto.
 */
export function generateSecureToken(length: number = 32): string {
  // Use Node.js crypto module (always available in Node.js runtime)
  try {
    // Dynamic require to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(length).toString('hex');
  } catch {
    // Fallback for browser environments
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Validate and sanitize a URL to prevent open redirect attacks.
 */
export function isValidRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsed = new URL(url);

    // Only allow relative paths
    if (!url.startsWith('/') && !url.startsWith('http')) {
      return false;
    }

    // If absolute URL, check against allowed domains
    if (parsed.hostname) {
      if (allowedDomains.length === 0) {
        // If no allowed domains specified, only allow same origin
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const appHostname = new URL(appUrl).hostname;
        return parsed.hostname === appHostname;
      }

      return allowedDomains.some(
        (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Simple in-memory rate limiter for API routes.
 * For production, use Vercel KV or Upstash Redis.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if a request exceeds the rate limit.
 * Returns true if the request should be allowed, false if rate limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (now - (record?.resetTime || 0) > 0) {
    rateLimitStore.delete(key);
  }

  if (!record || now > record.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * Generate CORS headers for API routes.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://arcdoc.vercel.app',
  ];

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }

  return headers;
}

/**
 * Content Security Policy header value.
 * - style-src: 'unsafe-inline' needed for Mantine/Tailwind dynamic styles
 * - font-src: 'self' data: for self-hosted fonts
 * - connect-src: 'self' https: for API calls and Turso
 * - img-src: 'self' data: blob: for images
 */
export const CSP_HEADER =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';";

/**
 * Security headers to add to all responses.
 */
export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-DNS-Prefetch-Control': 'off',
};

/**
 * Mask sensitive data for logging.
 */
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'password_hash', 'refresh_token', 'token', 'secret', 'authorization'];

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      masked[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

export default {
  sanitizeInput,
  sanitizeObject,
  isValidIdentifier,
  escapeLikeString,
  generateSecureToken,
  isValidRedirectUrl,
  checkRateLimit,
  getCorsHeaders,
  CSP_HEADER,
  securityHeaders,
  maskSensitiveData,
};