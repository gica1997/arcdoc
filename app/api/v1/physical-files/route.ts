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
  const locationId = searchParams.get('location_id');
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  conditions.push(`(d.format = 'physical' OR d.format IS NULL)`);
  if (search) { conditions.push(`(d.title ILIKE $${i} OR d.code ILIKE $${i})`); params.push(`%${search}%`); i++; }
  if (locationId) { conditions.push(`d.archive_location_id = $${i}`); params.push(locationId); i++; }
  const where = 'WHERE ' + conditions.join(' AND ');
  const countResult = await query<{total:string}>(`SELECT COUNT(*) as total FROM documents d ${where}`, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  const data = await query<any>(
    `SELECT d.id, d.title, d.code, d.number, d.status, d.archive_location_id, d.barcode, d.qr_code,
      al.name as location_name, d.format, d.created_at
     FROM documents d LEFT JOIN archive_locations al ON al.id = d.archive_location_id
     ${where} ORDER BY d.${sort} ${order} LIMIT ${limit} OFFSET ${(page-1)*limit}`, params);
  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { title, code, number, archive_location_id, fund_id, notes } = body;
    if (!title || !code) return errorResponse('Titlu și cod obligatorii.', 400);
    const id = uuidv4();
    await query(`INSERT INTO documents (id, title, code, number, archive_location_id, fund_id, format, status, observations, created_by) VALUES ($1,$2,$3,$4,$5,$6,'physical','available',$7,$8)`,
      [id, title, code, number, archive_location_id, fund_id, notes, payload.sub]);
    if (archive_location_id) {
      await query('INSERT INTO location_history (document_id, to_location_id, moved_by, movement_type, reason) VALUES ($1,$2,$3,$4,$5)',
        [id, archive_location_id, payload.sub, 'initial', 'Depunere inițială']);
    }
    return createdResponse({ id }, 'Dosar fizic creat.');
  } catch (e: any) { return errorResponse(e.message); }
}