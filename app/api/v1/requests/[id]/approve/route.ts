import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(r.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  await query('UPDATE requests SET status=$1, approved_by=$2, approved_at=NOW(), updated_at=NOW() WHERE id=$3', ['approved', payload.sub, id]);
  await query('INSERT INTO request_timeline (request_id, action, user_id, description) VALUES ($1,$2,$3,$4)', [id, 'approved', payload.sub, 'Cerere aprobată']);
  await query(`INSERT INTO notifications (user_id, title, body, type, link) SELECT user_id, 'Cerere aprobată', 'Cererea dvs. a fost aprobată.', 'success', '/solicitari/'||$1 FROM requests WHERE id=$1`, [id]);
  return successResponse(null, 'Cerere aprobată.');
}