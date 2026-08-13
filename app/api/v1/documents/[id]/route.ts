import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, noContentResponse } from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const data = await query<any>(
    `SELECT d.*, f.name as fund_name, ds.name as series_name, dep.name as department_name,
      al.name as archive_location_name, rp.name as retention_period_name,
      (SELECT COALESCE(json_group_array(json_object('id', da.id, 'file_name', da.file_name, 'file_url', da.file_url, 'file_size', da.file_size, 'mime_type', da.mime_type, 'is_primary', da.is_primary)), '[]')
       FROM document_attachments da WHERE da.document_id = d.id) as attachments,
      (SELECT COALESCE(json_group_array(dt.tag), '[]') FROM document_tags dt WHERE dt.document_id = d.id) as tags
    FROM documents d
    LEFT JOIN archival_funds f ON f.id = d.fund_id
    LEFT JOIN document_series ds ON ds.id = d.series_id
    LEFT JOIN organizational_structure dep ON dep.id = d.department_id
    LEFT JOIN archive_locations al ON al.id = d.archive_location_id
    LEFT JOIN retention_periods rp ON rp.id = d.retention_period_id
    WHERE d.id = ?`, [id]
  );
  if (data.rowCount === 0) return notFoundResponse('Document negăsit.');
  return successResponse(data.rows[0]);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  try {
    const body = await request.json();
    const fields = ['title','code','number','document_type','description','category','subcategory','fund_id','series_id','classification_id','department_id','responsible_id','issue_date','registration_date','expiry_date','retention_period_id','confidentiality_level','format','status','observations','custom_fields','archive_location_id'];
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of fields) { if (body[f] !== undefined) { sets.push(`${f}=$${i++}`); vals.push(body[f]); } }
    if (sets.length) { sets.push('updated_at=NOW()'); vals.push(id); await query(`UPDATE documents SET ${sets.join(',')} WHERE id=$${i}`, vals); }
    return successResponse(null, 'Document actualizat.');
  } catch (e: any) { return errorResponse(e.message); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  await query('UPDATE documents SET status = \'deleted\' WHERE id = $1', [id]);
  return noContentResponse();
}