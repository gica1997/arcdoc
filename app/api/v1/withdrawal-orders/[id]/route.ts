import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = extractBearerToken(_r.headers.get('authorization'));
  if (!t) return unauthorizedResponse();
  try { verifyAccessToken(t); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query<any>('SELECT w.*,u.first_name||\' \'||u.last_name as created_by_name FROM withdrawal_orders w LEFT JOIN users u ON u.id=w.created_by WHERE w.id=$1', [id]);
  if (data.rowCount===0) return notFoundResponse('Cerere negăsită.');
  return successResponse(data.rows[0]);
}

export async function PUT(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = extractBearerToken(_r.headers.get('authorization'));
  if (!t) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(t); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  try {
    const body = await _r.json();
    const { status, assigned_to, notes } = body;
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    if (status) { sets.push(`status=$${i++}`); vals.push(status); }
    if (assigned_to) { sets.push(`assigned_to=$${i++}`); vals.push(assigned_to); }
    if (notes!==undefined) { sets.push(`notes=$${i++}`); vals.push(notes); }
    if (sets.length>0) { sets.push("updated_at=datetime('now')"); vals.push(id); await query(`UPDATE withdrawal_orders SET ${sets.join(',')} WHERE id=$${i}`, vals); }
    if (status) {
      await query('INSERT INTO evidence_registry (id,user_id,operation,exit_type,previous_status,new_status) VALUES ($1,$2,$3,$4,$5,$6)', [uuidv4(),payload.sub,'withdrawal_status_changed','consultation',null,status]);
      if (status==='approved') await query('INSERT INTO process_verbals (id,type,reference_type,reference_id,content,generated_by) VALUES ($1,\'withdrawal\',\'withdrawal_order\',$2,\'Proces verbal retragere #\'||$2,$3)', [uuidv4(),id,payload.sub]);
    }
    return successResponse(null,'Actualizat.');
  } catch (e:any) { return errorResponse(e.message); }
}