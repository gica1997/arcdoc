import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-handler';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

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
