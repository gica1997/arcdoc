import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const data = await query('SELECT * FROM settings');
  return successResponse(data.rows);
}

export async function PUT(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    for (const [key, value] of Object.entries(body)) {
      await query(
        'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (company_id, key) DO UPDATE SET value=$2, updated_at=NOW()',
        [key, JSON.stringify(value)]
      );
    }
    return successResponse(null, 'Setări actualizate.');
  } catch (e: any) { return errorResponse(e.message); }
}