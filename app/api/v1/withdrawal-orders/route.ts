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
  const search = searchParams.get('search') || '';
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (status) { conditions.push(`w.status = $${i}`); params.push(status); i++; }
  if (search) { conditions.push(`(w.division LIKE $${i} OR w.department LIKE $${i} OR w.notes LIKE $${i})`); params.push(`%${search}%`); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM withdrawal_orders w ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT w.*, u.first_name || ' ' || u.last_name as created_by_name, a.first_name || ' ' || a.last_name as assigned_name
     FROM withdrawal_orders w LEFT JOIN users u ON u.id = w.created_by LEFT JOIN users a ON a.id = w.assigned_to
     ${where} ORDER BY w.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { division, department, geographic_zone, delivery_address, transport_method, archival_unit_number, urgency, notes } = body;
    if (!division || !department || !archival_unit_number) return errorResponse('Divizia, departamentul și numărul unității sunt obligatorii.', 400);
    const id = uuidv4();
    await query(`INSERT INTO withdrawal_orders (id, created_by, division, department, geographic_zone, delivery_address, transport_method, archival_unit_number, urgency, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10)`,
      [id, payload.sub, division, department, geographic_zone, delivery_address, transport_method, archival_unit_number, urgency || 'normal', notes]);
    await query('INSERT INTO evidence_registry (id, user_id, operation, exit_type, previous_status, new_status, division, department) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [uuidv4(), payload.sub, 'withdrawal_requested', 'consultation', null, 'pending', division, department]);
    return createdResponse({ id }, 'Cerere de retragere creată.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}