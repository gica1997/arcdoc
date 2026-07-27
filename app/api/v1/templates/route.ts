import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const type = new URL(request.url).searchParams.get('type');
  const data = await query('SELECT * FROM document_templates WHERE is_active = true' + (type ? ' AND template_type = $1' : '') + ' ORDER BY name', type ? [type] : []);
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { name, slug, template_type, content, variables } = await request.json();
    if (!name || !slug || !template_type) return errorResponse('Nume, slug și tip obligatorii.', 400);
    const id = uuidv4();
    await query('INSERT INTO document_templates (id, name, slug, template_type, content, variables) VALUES ($1,$2,$3,$4,$5,$6)', [id, name, slug, template_type, content, JSON.stringify(variables || [])]);
    return createdResponse({ id }, 'Șablon creat.');
  } catch (e: any) { return errorResponse(e.message); }
}