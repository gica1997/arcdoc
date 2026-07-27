import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const fundId = new URL(request.url).searchParams.get('fund_id');
  const where = fundId ? 'WHERE fund_id = $1' : '';
  const data = await query(`SELECT ds.*, f.name as fund_name FROM document_series ds LEFT JOIN archival_funds f ON f.id = ds.fund_id ${where} ORDER BY ds.sort_order, ds.name`, fundId ? [fundId] : []);
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { fund_id, parent_id, name, code, description, retention_period_id, confidentiality_level, observations } = await request.json();
    if (!fund_id || !name || !code) return errorResponse('Fond, nume și cod obligatorii.', 400);
    const id = uuidv4();
    await query(`INSERT INTO document_series (id, fund_id, parent_id, name, code, description, retention_period_id, confidentiality_level, observations) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, fund_id, parent_id, name, code, description, retention_period_id, confidentiality_level, observations]);
    return createdResponse({ id }, 'Serie creată.');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.message?.includes('unique')) return errorResponse('Cod duplicat.', 409);
    return errorResponse(e.message);
  }
}