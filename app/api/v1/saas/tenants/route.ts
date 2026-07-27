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
  const { page, limit, sort, order } = parsePaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (search) { conditions.push(`(c.name ILIKE $${i} OR c.cui ILIKE $${i})`); params.push(`%${search}%`); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM companies c ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT c.*, l.type as license_type, l.status as license_status,
     (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count,
     (SELECT COUNT(*) FROM documents WHERE status != 'deleted') as doc_count
     FROM companies c
     LEFT JOIN licenses l ON l.company_id = c.id AND l.status = 'active'
     ${where} ORDER BY c.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { name, cui, email, address, phone, license_type } = await request.json();
    if (!name || !cui) return errorResponse('Nume și CUI obligatorii.', 400);
    const id = uuidv4();
    await query('INSERT INTO companies (id, name, cui, email, address, phone) VALUES ($1,$2,$3,$4,$5,$6)', [id, name, cui, email, address, phone]);
    if (license_type) {
      await query('INSERT INTO licenses (company_id, type, status, max_users, max_documents) VALUES ($1,$2,\'active\',CASE $2 WHEN \'starter\' THEN 5 WHEN \'professional\' THEN 50 WHEN \'enterprise\' THEN 500 ELSE 10 END,CASE $2 WHEN \'starter\' THEN 100 WHEN \'professional\' THEN 5000 WHEN \'enterprise\' THEN 100000 ELSE 100 END)', [id, license_type]);
    }
    return createdResponse({ id }, 'Tenant creat.');
  } catch (e: any) { return errorResponse(e.message); }
}