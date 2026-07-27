import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(r.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query<any>(`SELECT rm.*, u.first_name || ' ' || u.last_name as user_name FROM request_messages rm JOIN users u ON u.id = rm.user_id WHERE rm.request_id = $1 ORDER BY rm.created_at`, [id]);
  return successResponse(data.rows);
}

export async function POST(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(r.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const { content } = await r.json();
  const mid = uuidv4();
  await query('INSERT INTO request_messages (id, request_id, user_id, content) VALUES ($1,$2,$3,$4)', [mid, id, payload.sub, content]);
  return createdResponse({ id: mid }, 'Mesaj trimis.');
}