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
  const { assigned_to } = await r.json();
  await query('UPDATE requests SET assigned_to=$1, assigned_at=NOW() WHERE id=$2', [assigned_to, id]);
  await query('INSERT INTO request_timeline (request_id, action, user_id, description) VALUES ($1,$2,$3,$4)', [id, 'assigned', payload.sub, 'Cerere atribuită']);
  return successResponse(null, 'Cerere atribuită.');
}