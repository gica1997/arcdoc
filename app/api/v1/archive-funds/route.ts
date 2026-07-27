import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const s = new URL(request.url).searchParams;
  const search = s.get('search') || '';
  const status = s.get('status');
  const conditions: string[] = []; const params: unknown[] = []; let i = 1;
  if (search) { conditions.push(`(name ILIKE $${i} OR code ILIKE $${i})`); params.push(`%${search}%`); i++; }
  if (status) { conditions.push(`status = $${i}`); params.push(status); i++; }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const data = await query(`SELECT af.*, d.name as department_name FROM archival_funds af LEFT JOIN organizational_structure d ON d.id = af.department_id ${where} ORDER BY af.name`, params);
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { name, code, description, parent_id, department_id, start_year, end_year, creator, observations } = await request.json();
    if (!name || !code) return errorResponse('Nume și cod obligatorii.', 400);
    const id = uuidv4();
    await query(`INSERT INTO archival_funds (id, name, code, description, parent_id, department_id, start_year, end_year, creator, observations) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, name, code, description, parent_id, department_id, start_year, end_year, creator, observations]);
    return createdResponse({ id }, 'Fond creat.');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.message?.includes('unique')) return errorResponse('Cod duplicat.', 409);
    return errorResponse(e.message || 'Eroare.');
  }
}