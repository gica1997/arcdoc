import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const rows = await query('SELECT * FROM automation_rules ORDER BY created_at DESC');
    return successResponse(rows.rows);
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/automation', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const { name, description, trigger_type, trigger_config, action_type, action_config, is_active } = await request.json();
    if (!name || !trigger_type || !action_type) return errorResponse('Nume, trigger și acțiune obligatorii.', 400);
    const id = uuidv4();
    await query(
      'INSERT INTO automation_rules (id, name, description, trigger_type, trigger_config, action_type, action_config, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [id, name, description || null, trigger_type, JSON.stringify(trigger_config || null), action_type, JSON.stringify(action_config || null), is_active === false ? 0 : 1, new Date().toISOString(), new Date().toISOString()]
    );
    return createdResponse({ id }, 'Automatizare creată.');
  } catch (e: any) { return errorResponse(e.message); }
}
