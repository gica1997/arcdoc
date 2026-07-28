import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader) || request.cookies.get('arcdoc_session')?.value || null;
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const result = await query(
      `SELECT
        (SELECT COUNT(*) FROM documents) as docs,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM document_loans WHERE status = 'active') as loans,
        (SELECT COUNT(*) FROM requests WHERE status = 'submitted') as reqs`
    );
    return successResponse(result.rows[0]);
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/dashboard/kpi', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
