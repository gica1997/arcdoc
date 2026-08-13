import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const { id } = await params;
    const body = await request.json();
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['name', 'description', 'trigger_type', 'trigger_config', 'action_type', 'action_config', 'is_active', 'last_run_at'];
    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = $${values.length + 1}`);
        values.push(key === 'trigger_config' || key === 'action_config' ? JSON.stringify(body[key]) : body[key]);
      }
    }
    if (!fields.length) return errorResponse('Niciun câmp de actualizat.', 400);
    fields.push('updated_at = $' + (values.length + 1));
    values.push(new Date().toISOString());
    values.push(id);
    await query(`UPDATE automation_rules SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    return successResponse({ id }, 'Automatizare actualizată.');
  } catch (e: any) {
    logger.apiError(e, { path: '/api/v1/automation/[id]', method: 'PUT' });
    return errorResponse(e.message);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const { id } = await params;
    const existing = await query('SELECT id FROM automation_rules WHERE id = $1', [id]);
    if (!existing.rows.length) return notFoundResponse('Automatizare nu a fost găsită.');
    await query('DELETE FROM automation_rules WHERE id = $1', [id]);
    return successResponse({ id }, 'Automatizare ștearsă.');
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/automation/[id]', method: 'DELETE' });
    return serverErrorResponse('Internal Server Error');
  }
}
