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
  if (status) { conditions.push(`t.status = $${i}`); params.push(status); i++; }
  if (search) { conditions.push(`(t.division LIKE $${i} OR t.department LIKE $${i} OR t.notes LIKE $${i})`); params.push(`%${search}%`); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM transfer_orders t ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT t.*, u.first_name || ' ' || u.last_name as created_by_name, a.first_name || ' ' || a.last_name as assigned_name
     FROM transfer_orders t LEFT JOIN users u ON u.id = t.created_by LEFT JOIN users a ON a.id = t.assigned_to
     ${where} ORDER BY t.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { division, department, geographic_zone, address, transport_method, organization_type, quantity, notes, items } = body;
    if (!division || !department) return errorResponse('Divizia și departamentul sunt obligatorii.', 400);
    const id = uuidv4();
    await query(`INSERT INTO transfer_orders (id, created_by, division, department, geographic_zone, address, transport_method, organization_type, quantity, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10)`,
      [id, payload.sub, division, department, geographic_zone, address, transport_method, organization_type, quantity, notes]);
    if (items?.length) for (const it of items) {
      await query('INSERT INTO transfer_order_items (id, order_id, archival_unit_code, description, quantity) VALUES ($1,$2,$3,$4,$5)', [uuidv4(), id, it.code, it.description, it.quantity]);
    }
    await query('INSERT INTO evidence_registry (id, user_id, operation, fund_name, file_name, document_code, entry_type, previous_status, new_status, division, department) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [uuidv4(), payload.sub, 'transfer_created', null, null, null, 'transfer', null, 'pending', division, department]);
    return createdResponse({ id }, 'Comandă de transfer creată.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}