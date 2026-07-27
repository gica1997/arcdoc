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
    const fields = ['name','code','description','parent_id','department_id','start_year','end_year','creator','status','observations'];
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of fields) { if (body[f] !== undefined) { sets.push(`${f}=$${i++}`); vals.push(body[f]); } }
    if (sets.length) { sets.push('updated_at=NOW()'); vals.push(id); await query(`UPDATE archival_funds SET ${sets.join(',')} WHERE id=$${i}`, vals); }
    return successResponse(null, 'Actualizat.');
  } catch (e: any) { return errorResponse(e.message); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { id } = await params;
    const hasDocs = await query('SELECT id FROM documents WHERE unit_id IN (SELECT id FROM archival_units WHERE inventory_id IN (SELECT id FROM inventories WHERE fund_id=$1)) LIMIT 1', [id]);
    if (hasDocs.rowCount > 0) return errorResponse('Fondul conține documente. Nu poate fi șters.', 400);
    await query('UPDATE archival_funds SET is_active=false WHERE id=$1', [id]);
    return noContentResponse();
  } catch { return errorResponse('Eroare.'); }
}