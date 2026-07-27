import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const data = await query('SELECT * FROM companies WHERE id = $1', ['00000000-0000-0000-0000-000000000001']);
  return successResponse(data.rows[0] || null);
}

export async function PUT(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const body = await request.json();
    const fields = ['name','cui','reg_com','address','county','city','postal_code','phone','email','website','contact_person','contact_position','logo_url'];
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of fields) {
      if (body[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(body[f]); }
    }
    if (sets.length) { sets.push('updated_at = NOW()'); vals.push('00000000-0000-0000-0000-000000000001'); await query(`UPDATE companies SET ${sets.join(', ')} WHERE id = $${i}`, vals); }
    return successResponse(null, 'Companie actualizată.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}