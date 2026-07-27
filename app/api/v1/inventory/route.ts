import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, successPaginatedResponse, createdResponse, errorResponse, unauthorizedResponse, buildPaginationMeta, parsePaginationParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { searchParams } = new URL(request.url);
  const { page, limit } = parsePaginationParams(searchParams);
  const status = searchParams.get('status');
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (status) { conditions.push(`status = $${i}`); params.push(status); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM inventory_sessions ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT s.*, u.first_name || ' ' || u.last_name as created_by_name,
     (SELECT COUNT(*) FROM inventory_items ii WHERE ii.session_id = s.id) as item_count,
     (SELECT COUNT(*) FROM inventory_items ii WHERE ii.session_id = s.id AND ii.status = 'verified') as verified_count
     FROM inventory_sessions s LEFT JOIN users u ON u.id = s.created_by ${where} ORDER BY s.created_at DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { name, location_id, fund_id, department_id, notes } = body;
    if (!name) return errorResponse('Nume obligatoriu.', 400);
    const id = uuidv4();
    await query('INSERT INTO inventory_sessions (id, name, location_id, fund_id, department_id, status, created_by, notes) VALUES ($1,$2,$3,$4,$5,\'draft\',$6,$7)',
      [id, name, location_id, fund_id, department_id, payload.sub, notes]);
    return createdResponse({ id }, 'Sesiune inventariere creată.');
  } catch (e: any) { return errorResponse(e.message); }
}