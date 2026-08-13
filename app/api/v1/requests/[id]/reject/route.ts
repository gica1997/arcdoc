import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(r.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const { reason } = await r.json();
  await query("UPDATE requests SET status=$1, rejected_by=$2, rejected_at=datetime('now'), rejection_reason=$3, updated_at=datetime('now') WHERE id=$4", ['rejected', payload.sub, reason, id]);

  await query('INSERT INTO request_timeline (request_id, action, user_id, description) VALUES ($1,$2,$3,$4)', [id, 'rejected', payload.sub, reason || 'Cerere respinsă']);
  await query(`INSERT INTO notifications (user_id, title, body, type, link) SELECT user_id, 'Cerere respinsă', COALESCE($2,'Cererea dvs. a fost respinsă.'), 'warning', '/solicitari/'||$1 FROM requests WHERE id=$1`, [id, reason]);
  return successResponse(null, 'Cerere respinsă.');
}