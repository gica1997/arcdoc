import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, noContentResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(_request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query<any>(
    `SELECT r.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email,
     a.first_name || ' ' || a.last_name as assigned_name,
     COALESCE(json_agg(DISTINCT jsonb_build_object('id', d.id, 'title', d.title, 'code', d.code)) FILTER (WHERE d.id IS NOT NULL), '[]') as documents,
     (SELECT json_agg(jsonb_build_object('id', tm.id, 'action', tm.action, 'description', tm.description, 'created_at', tm.created_at, 'user_name', us.first_name || ' ' || us.last_name)
      FROM request_timeline tm LEFT JOIN users us ON us.id = tm.user_id WHERE tm.request_id = r.id ORDER BY tm.created_at) as timeline,
     (SELECT json_agg(jsonb_build_object('id', rm.id, 'content', rm.content, 'created_at', rm.created_at, 'user_name', um.first_name || ' ' || um.last_name)
      FROM request_messages rm LEFT JOIN users um ON um.id = rm.user_id WHERE rm.request_id = r.id ORDER BY rm.created_at) as messages
     FROM requests r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN users a ON a.id = r.assigned_to
     LEFT JOIN request_documents rd ON rd.request_id = r.id
     LEFT JOIN documents d ON d.id = rd.document_id
     WHERE r.id = $1 GROUP BY r.id, u.first_name, u.last_name, u.email, a.first_name, a.last_name`, [id]
  );
  if (data.rowCount === 0) return notFoundResponse('Cerere negăsită.');
  return successResponse(data.rows[0]);
}

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(_request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  try {
    const body = await _request.json();
    const fields = ['request_type','motivation','priority','deadline','status','notes'];
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of fields) { if (body[f] !== undefined) { sets.push(`${f}=$${i++}`); vals.push(body[f]); } }
    if (sets.length) { sets.push('updated_at=NOW()'); vals.push(id); await query(`UPDATE requests SET ${sets.join(',')} WHERE id=$${i}`, vals); }
    return successResponse(null, 'Cerere actualizată.');
  } catch (e: any) { return errorResponse(e.message); }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(_request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  await query('UPDATE requests SET status=\'cancelled\' WHERE id=$1', [id]);
  return noContentResponse();
}