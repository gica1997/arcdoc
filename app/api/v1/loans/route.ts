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
  const status = searchParams.get('status');
  const userId = searchParams.get('user_id');
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (status) { conditions.push(`dl.status = $${i}`); params.push(status); i++; }
  if (userId) { conditions.push(`dl.user_id = $${i}`); params.push(userId); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM document_loans dl ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT dl.*, d.title as document_title, d.code as document_code, d.barcode,
      u.first_name || ' ' || u.last_name as user_name, a.first_name || ' ' || a.last_name as approved_name
     FROM document_loans dl
     LEFT JOIN documents d ON d.id = dl.document_id
     LEFT JOIN users u ON u.id = dl.user_id
     LEFT JOIN users a ON a.id = dl.approved_by
     ${where} ORDER BY dl.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { document_id, user_id, due_date, notes } = body;
    if (!document_id || !user_id) return errorResponse('Document și utilizator obligatorii.', 400);
    const existing = await query('SELECT id FROM document_loans WHERE document_id=$1 AND status IN (\'requested\',\'active\')', [document_id]);
    if (existing.rowCount > 0) return errorResponse('Documentul este deja împrumutat.', 409);
    const id = uuidv4();
    await query('INSERT INTO document_loans (id, document_id, user_id, requested_by, status, due_date, notes) VALUES ($1,$2,$3,$4,\'active\',$5,$6)',
      [id, document_id, user_id, payload.sub, due_date, notes]);
    await query('UPDATE documents SET status=\'borrowed\' WHERE id=$1', [document_id]);
    await query('INSERT INTO request_timeline (request_id, action, user_id, description) VALUES ((SELECT id FROM requests WHERE user_id=$2 AND document_id=$3 LIMIT 1), \'loaned\', $1, \'Document împrumutat\')',
      [payload.sub, user_id, document_id]);
    return createdResponse({ id }, 'Împrumut înregistrat.');
  } catch (e: any) { return errorResponse(e.message); }
}