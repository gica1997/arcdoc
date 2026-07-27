// ============================================
// ArcDoc Enterprise - API Response Helpers
// ============================================

import { NextResponse } from 'next/server';
import type { ApiResponse, PaginationMeta } from '@/types';

/**
 * Standardized API response builder.
 * All API endpoints should use these helpers for consistent responses.
 */

/**
 * Send a successful response with data.
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Send a successful response with pagination metadata.
 */
export function successPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message?: string
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      message,
    },
    { status: 200 }
  );
}

/**
 * Send an error response.
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Send a 201 Created response.
 */
export function createdResponse<T>(
  data: T,
  message: string = 'Resource created successfully'
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201);
}

/**
 * Send a 204 No Content response.
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Send a 400 Bad Request response.
 */
export function badRequestResponse(
  error: string = 'Bad Request'
): NextResponse<ApiResponse> {
  return errorResponse(error, 400);
}

/**
 * Send a 401 Unauthorized response.
 */
export function unauthorizedResponse(
  error: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(error, 401);
}

/**
 * Send a 403 Forbidden response.
 */
export function forbiddenResponse(
  error: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(error, 403);
}

/**
 * Send a 404 Not Found response.
 */
export function notFoundResponse(
  error: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return errorResponse(error, 404);
}

/**
 * Send a 409 Conflict response.
 */
export function conflictResponse(
  error: string = 'Resource already exists'
): NextResponse<ApiResponse> {
  return errorResponse(error, 409);
}

/**
 * Send a 422 Unprocessable Entity response (validation errors).
 */
export function validationErrorResponse(
  error: string = 'Validation failed',
  details?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 422 }
  );
}

/**
 * Send a 429 Too Many Requests response.
 */
export function tooManyRequestsResponse(
  error: string = 'Too many requests. Please try again later.'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    }
  );
}

/**
 * Send a 500 Internal Server Error response.
 */
export function serverErrorResponse(
  error: string = 'Internal Server Error'
): NextResponse<ApiResponse> {
  return errorResponse(error, 500);
}

/**
 * Build pagination metadata from query results.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse and validate pagination query parameters.
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
  const limit = Math.min(Math.max(1, rawLimit), 100);
  const sort = searchParams.get('sort') || 'created_at';
  const order =
    (searchParams.get('order')?.toLowerCase() as 'asc' | 'desc') || 'desc';

  return { page, limit, sort, order };
}

export default {
  successResponse,
  successPaginatedResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  tooManyRequestsResponse,
  serverErrorResponse,
  buildPaginationMeta,
  parsePaginationParams,
};