// ============================================
// ArcDoc Enterprise - Portal My Documents API
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, successPaginatedResponse, unauthorizedResponse, buildPaginationMeta, parsePaginationParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { searchParams } = new URL(request.url);
  const { page, limit, sort, order } = parsePaginationParams(searchParams);
  const search = searchParams.get('search') || '';

  const userId = payload.sub;

  const conditions: string[] = ['rd.request_id IN (SELECT id FROM requests WHERE user_id = $1)'];
  const params: unknown[] = [userId];
  let i = 2;

  if (search) {
    conditions.push(`(d.title LIKE $${i} OR d.code LIKE $${i} OR d.document_type LIKE $${i})`);
    params.push(`%${search}%`);
    i++;
  }

  const where = 'WHERE ' + conditions.join(' AND ');

  const countResult = await query(`SELECT COUNT(*) as total FROM request_documents rd JOIN documents d ON d.id = rd.document_id ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total as string || '0', 10);

  const data = await query(
    `SELECT d.id, d.title, d.code, d.document_type, d.description, d.pages, d.language, d.format,
            d.access_level, d.status, d.created_at,
            rd.request_id, r.number as request_number
     FROM request_documents rd
     JOIN documents d ON d.id = rd.document_id
     JOIN requests r ON r.id = rd.request_id
     ${where}
     ORDER BY d.${sort} ${order}
     LIMIT ${limit} OFFSET ${(page - 1) * limit}`, params
  );

  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}
