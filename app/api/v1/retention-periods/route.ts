import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  const data = await query('SELECT * FROM retention_periods WHERE is_active = true ORDER BY sort_order');
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { name, code, years, is_permanent, description } = await request.json();
    if (!name) return errorResponse('Nume obligatoriu.', 400);
    const id = uuidv4();
    await query('INSERT INTO retention_periods (id, name, code, years, is_permanent, description) VALUES ($1,$2,$3,$4,$5,$6)', [id, name, code, years, is_permanent, description]);
    return createdResponse({ id }, 'Termen creat.');
  } catch (e: any) { return errorResponse(e.message); }
}