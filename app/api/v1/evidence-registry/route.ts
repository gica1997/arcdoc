import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, successPaginatedResponse, unauthorizedResponse, buildPaginationMeta, parsePaginationParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { searchParams } = new URL(request.url);
  const { page, limit, sort, order } = parsePaginationParams(searchParams);
  const operation = searchParams.get('operation');
  const search = searchParams.get('search') || '';
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (operation) { conditions.push(`operation = $${i}`); params.push(operation); i++; }
  if (search) { conditions.push(`(fund_name LIKE $${i} OR file_name LIKE $${i} OR document_code LIKE $${i})`); params.push(`%${search}%`); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM evidence_registry ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT e.*, u.first_name || ' ' || u.last_name as user_name
     FROM evidence_registry e LEFT JOIN users u ON u.id = e.user_id
     ${where} ORDER BY e.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}