import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const data = await query('SELECT * FROM archive_locations WHERE is_active = true ORDER BY level, sort_order');
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { name, code, location_type, parent_id } = await request.json();
    if (!name || !location_type) return errorResponse('Nume și tip obligatorii.', 400);
    const id = uuidv4();
    const level = parent_id ? (await query<{level:number}>('SELECT level FROM archive_locations WHERE id=$1',[parent_id])).rows[0]?.level + 1 || 2 : 1;
    await query('INSERT INTO archive_locations (id, name, code, location_type, parent_id, level) VALUES ($1,$2,$3,$4,$5,$6)', [id, name, code, location_type, parent_id, level]);
    return createdResponse({ id }, 'Locație arhivă creată.');
  } catch (e: any) { return errorResponse(e.message); }
}