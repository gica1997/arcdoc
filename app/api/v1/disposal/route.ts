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
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (status) { conditions.push(`dp.status = $${i}`); params.push(status); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM disposal_proposals dp ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT dp.*, d.title as document_title, d.code as document_code,
      p.first_name || ' ' || p.last_name as proposed_name, a.first_name || ' ' || a.last_name as approved_name
     FROM disposal_proposals dp
     LEFT JOIN documents d ON d.id = dp.document_id
     LEFT JOIN users p ON p.id = dp.proposed_by
     LEFT JOIN users a ON a.id = dp.approved_by
     ${where} ORDER BY dp.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { document_id, reason, notes } = await request.json();
    if (!document_id || !reason) return errorResponse('Document și motiv obligatorii.', 400);
    const id = uuidv4();
    const processNumber = `CAS-${Date.now().toString(36).toUpperCase()}`;
    await query('INSERT INTO disposal_proposals (id, document_id, reason, proposed_by, status, process_number, notes, proposed_at) VALUES ($1,$2,$3,$4,\'proposed\',$5,$6,NOW())',
      [id, document_id, reason, payload.sub, processNumber, notes]);
    return createdResponse({ id, process_number: processNumber }, 'Propunere casare creată.');
  } catch (e: any) { return errorResponse(e.message); }
}