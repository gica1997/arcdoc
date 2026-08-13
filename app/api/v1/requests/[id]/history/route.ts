// ============================================
// ArcDoc Enterprise - Request History (Timeline)
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(r.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const { id } = await params;
    const result = await query<any>(
      `SELECT tm.id, tm.action as event_type, tm.description, tm.created_at,
              u.first_name || ' ' || u.last_name as user_name, tm.metadata
       FROM request_timeline tm
       LEFT JOIN users u ON u.id = tm.user_id
       WHERE tm.request_id = $1
       ORDER BY tm.created_at ASC`,
      [id]
    );
    return successResponse(result.rows);
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/requests/[id]/history', method: 'GET' });
    return serverErrorResponse();
  }
}
