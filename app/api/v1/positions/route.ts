import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const data = await query('SELECT * FROM positions WHERE is_active = true ORDER BY name');
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { name, code, description } = await request.json();
    if (!name) return errorResponse('Nume obligatoriu.', 400);
    const id = uuidv4();
    await query('INSERT INTO positions (id, name, code, description) VALUES ($1,$2,$3,$4)', [id, name, code, description]);
    return createdResponse({ id }, 'Funcție creată.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}