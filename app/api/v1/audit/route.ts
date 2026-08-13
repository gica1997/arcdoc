import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successPaginatedResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';

import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);
    const search = url.searchParams.get('search') || '';
    const action = url.searchParams.get('action') || '';
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: any[] = [];
    if (search) { params.push(`%${search}%`); where.push(`(a.action LIKE $${params.length} OR a.entity_type LIKE $${params.length} OR u.first_name LIKE $${params.length} OR u.last_name LIKE $${params.length})`); }
    if (action) { params.push(action); where.push(`a.action = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [list, count] = await Promise.all([
      query<any>(`SELECT a.*, u.first_name || ' ' || u.last_name as user_name FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ${whereSql} ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
      query<any>(`SELECT COUNT(*) as total FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ${whereSql}`, params),
    ]);

    return successPaginatedResponse(list.rows, {
      page, limit, total: count.rows[0]?.total || 0,
      totalPages: Math.ceil((count.rows[0]?.total || 0) / limit),
    });

  } catch (error) {
    logger.apiError(error, { path: '/api/v1/audit', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
