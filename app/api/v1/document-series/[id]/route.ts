import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, noContentResponse } from '@/lib/api-response';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { id } = await params;
    const body = await request.json();
    const fields = ['name','code','description','parent_id','retention_period_id','confidentiality_level','observations','is_active'];
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of fields) { if (body[f] !== undefined) { sets.push(`${f}=$${i++}`); vals.push(body[f]); } }
    if (sets.length) { sets.push('updated_at=NOW()'); vals.push(id); await query(`UPDATE document_series SET ${sets.join(',')} WHERE id=$${i}`, vals); }
    return successResponse(null, 'Actualizat.');
  } catch (e: any) { return errorResponse(e.message); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try { const { id } = await params; await query('DELETE FROM document_series WHERE id=$1', [id]); return noContentResponse(); } catch { return errorResponse('Eroare.'); }
}