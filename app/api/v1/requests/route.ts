import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query, buildPaginationClause } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, successPaginatedResponse, createdResponse, errorResponse, unauthorizedResponse, buildPaginationMeta, parsePaginationParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { searchParams } = new URL(request.url);
  const { page, limit, sort, order } = parsePaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const userId = searchParams.get('user_id');
  const type = searchParams.get('type');
  const priority = searchParams.get('priority');
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (search) { conditions.push(`(r.number ILIKE $${i} OR r.motivation ILIKE $${i})`); params.push(`%${search}%`); i++; }
  if (status) { conditions.push(`r.status = $${i}`); params.push(status); i++; }
  if (userId) { conditions.push(`r.user_id = $${i}`); params.push(userId); i++; }
  if (type) { conditions.push(`r.request_type = $${i}`); params.push(type); i++; }
  if (priority) { conditions.push(`r.priority = $${i}`); params.push(priority); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM requests r ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT r.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email,
      a.first_name || ' ' || a.last_name as assigned_name
     FROM requests r LEFT JOIN users u ON u.id = r.user_id LEFT JOIN users a ON a.id = r.assigned_to
     ${where} ORDER BY r.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { request_type, motivation, priority, deadline, document_ids, notes } = body;
    if (!request_type) return errorResponse('Tip solicitare obligatoriu.', 400);
    const id = uuidv4();
    const number = `REQ-${Date.now().toString(36).toUpperCase()}`;
    await query(`INSERT INTO requests (id, user_id, number, request_type, motivation, priority, status, deadline, notes) VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8)`,
      [id, payload.sub, number, request_type, motivation, priority || 'normal', deadline, notes]);
    if (document_ids?.length) {
      for (const docId of document_ids) {
        await query('INSERT INTO request_documents (request_id, document_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, docId]);
      }
    }
    await query('INSERT INTO request_timeline (request_id, action, user_id, description) VALUES ($1,$2,$3,$4)', [id, 'created', payload.sub, 'Cerere înregistrată']);
    return createdResponse({ id, number }, 'Cerere creată.');
  } catch (e: any) { return errorResponse(e.message); }
}