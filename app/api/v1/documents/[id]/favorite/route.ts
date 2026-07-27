import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const exists = await query('SELECT id FROM document_favorites WHERE document_id=$1 AND user_id=$2', [id, payload.sub]);
  if (exists.rowCount > 0) {
    await query('DELETE FROM document_favorites WHERE document_id=$1 AND user_id=$2', [id, payload.sub]);
    return successResponse({ favorite: false }, 'Eliminat din favorite.');
  }
  await query('INSERT INTO document_favorites (document_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, payload.sub]);
  return successResponse({ favorite: true }, 'Adăugat la favorite.');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  await query('DELETE FROM document_favorites WHERE document_id=$1 AND user_id=$2', [id, payload.sub]);
  return successResponse(null, 'Eliminat din favorite.');
}