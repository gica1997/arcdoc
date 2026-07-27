import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, noContentResponse } from '@/lib/api-response';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    const { name, code, is_active } = await request.json();
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name); }
    if (code !== undefined) { sets.push(`code = $${i++}`); vals.push(code); }
    if (is_active !== undefined) { sets.push(`is_active = $${i++}`); vals.push(is_active); }
    if (sets.length) { sets.push('updated_at = NOW()'); vals.push(id); await query(`UPDATE organizational_structure SET ${sets.join(', ')} WHERE id = $${i}`, vals); }
    return successResponse(null, 'Actualizat.');
  } catch (e: any) { return errorResponse(e.message || 'Eroare.'); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    await query('UPDATE organizational_structure SET is_active = false WHERE id = $1', [id]);
    return noContentResponse();
  } catch { return errorResponse('Eroare ștergere.'); }
}