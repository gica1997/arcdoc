// ============================================
// ArcDoc Enterprise - Notification Detail API
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(_request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;

  const result = await query(
    'UPDATE notifications SET is_read = 1, read_at = datetime(\'now\') WHERE id = $1 AND user_id = $2',
    [id, payload.sub]
  );
  if (result.rowCount === 0) return notFoundResponse('Notificare negăsită.');
  return successResponse(null, 'Notificare citită.');
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(_request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;

  await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, payload.sub]);
  return successResponse(null, 'Notificare ștearsă.');
}
