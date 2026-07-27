import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const data = await query('SELECT * FROM locations WHERE is_active = true ORDER BY location_type, name');
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const { name, code, location_type, parent_id, address, city, county, postal_code } = body;
    if (!name || !location_type) return errorResponse('Nume și tip obligatorii.', 400);
    const id = uuidv4();
    await query('INSERT INTO locations (id, name, code, location_type, parent_id, address, city, county, postal_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, name, code, location_type, parent_id, address, city, county, postal_code]);
    return createdResponse({ id }, 'Locație creată.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}