import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = extractBearerToken(_r.headers.get('authorization'));
  if (!t) return unauthorizedResponse();
  try { verifyAccessToken(t); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query<any>(
    `SELECT d.*, al.name as location_name,
     (SELECT COALESCE(json_group_array(json_object('id',lh.id,'from_name',fal.name,'to_name',tal.name,'movement_type',lh.movement_type,'reason',lh.reason,'created_at',lh.created_at,'user_name',u.first_name||' '||u.last_name)), '[]')
      FROM location_history lh LEFT JOIN archive_locations fal ON fal.id=lh.from_location_id LEFT JOIN archive_locations tal ON tal.id=lh.to_location_id LEFT JOIN users u ON u.id=lh.moved_by
      WHERE lh.document_id=d.id) as location_history
     FROM documents d LEFT JOIN archive_locations al ON al.id=d.archive_location_id WHERE d.id=?`, [id]);
  if (data.rowCount === 0) return notFoundResponse('Dosar negăsit.');
  return successResponse(data.rows[0]);
}

export async function PUT(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = extractBearerToken(_r.headers.get('authorization'));
  if (!t) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(t); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  try {
    const body = await _r.json();
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of ['title','code','number','archive_location_id','status','observations']) {
      if (body[f] !== undefined) { sets.push(`${f}=$${i++}`); vals.push(body[f]); }
    }
    if (body.archive_location_id) {
      const oldLoc = await query('SELECT archive_location_id FROM documents WHERE id=$1', [id]);
      if (oldLoc.rows[0]) {
        await query('INSERT INTO location_history (document_id, from_location_id, to_location_id, moved_by, movement_type, reason) VALUES ($1,$2,$3,$4,$5,$6)',
          [id, oldLoc.rows[0].archive_location_id, body.archive_location_id, payload.sub, body.movement_type || 'move', body.move_reason || '']);
      }
    }
    if (sets.length) { sets.push('updated_at=NOW()'); vals.push(id); await query(`UPDATE documents SET ${sets.join(',')} WHERE id=$${i}`, vals); }
    return successResponse(null, 'Actualizat.');
  } catch (e: any) { return errorResponse(e.message); }
}