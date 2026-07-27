import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query('SELECT * FROM document_tags WHERE document_id = $1', [id]);
  return successResponse(data.rows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const { tags } = await request.json();
  if (tags?.length) {
    await query('DELETE FROM document_tags WHERE document_id = $1', [id]);
    for (const tag of tags) {
      await query('INSERT INTO document_tags (document_id, tag) VALUES ($1,$2)', [id, tag]);
    }
  }
  return successResponse(null, 'Tag-uri actualizate.');
}