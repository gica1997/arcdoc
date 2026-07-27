import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const data = await query<any>(
      `SELECT id, name, code, parent_id, level, sort_order, is_active, created_at
       FROM organizational_structure WHERE is_active = true ORDER BY level, sort_order`
    );
    return successResponse(data.rows);
  } catch { return errorResponse('Eroare listare departamente.'); }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { name, code, parent_id } = await request.json();
    if (!name) return errorResponse('Nume obligatoriu.', 400);
    const level = parent_id ? (await query<{level:number}>('SELECT level FROM organizational_structure WHERE id=$1',[parent_id])).rows[0]?.level + 1 || 2 : 1;
    const id = uuidv4();
    await query('INSERT INTO organizational_structure (id, name, code, parent_id, level) VALUES ($1,$2,$3,$4,$5)', [id, name, code, parent_id, level]);
    return createdResponse({ id }, 'Departament creat.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}