import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const [total, today, unique, exports] = await Promise.all([
      query('SELECT COUNT(*) as total FROM audit_logs'),
      query("SELECT COUNT(*) as total FROM audit_logs WHERE date(created_at) = date('now')"),
      query('SELECT COUNT(DISTINCT user_id) as total FROM audit_logs'),
      query("SELECT COUNT(*) as total FROM audit_logs WHERE action = 'export'"),
    ]);

    return successResponse({
      total: total.rows[0]?.total ?? 0,
      today: today.rows[0]?.total ?? 0,
      unique_users: unique.rows[0]?.total ?? 0,
      exports: exports.rows[0]?.total ?? 0,
    });
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/audit/stats', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
