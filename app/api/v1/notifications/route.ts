import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const data = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [payload.sub]);
  return successResponse(data.rows);
}

export async function PUT(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  await query('UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false', [payload.sub]);
  return successResponse(null, 'Notificări citite.');
}