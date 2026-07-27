import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query<any>(
    `SELECT dc.*, u.first_name || ' ' || u.last_name as user_name FROM document_comments dc
     JOIN users u ON u.id = dc.user_id WHERE dc.document_id = $1 ORDER BY dc.created_at`, [id]
  );
  return successResponse(data.rows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const { content, parent_id } = await request.json();
  const cid = uuidv4();
  await query('INSERT INTO document_comments (id, document_id, user_id, content, parent_id) VALUES ($1,$2,$3,$4,$5)', [cid, id, payload.sub, content, parent_id]);
  return createdResponse({ id: cid }, 'Comentariu adăugat.');
}