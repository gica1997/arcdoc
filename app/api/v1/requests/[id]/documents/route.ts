// ============================================
// ArcDoc Enterprise - Request Documents
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(r.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const { id } = await params;
    const result = await query<any>(
      `SELECT d.id, d.code, d.title, d.document_type, d.format, d.pages, d.status,
              d.confidentiality_level, d.created_at
       FROM request_documents rd
       JOIN documents d ON d.id = rd.document_id
       WHERE rd.request_id = $1
       ORDER BY d.created_at DESC`,
      [id]
    );
    return successResponse(result.rows);
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/requests/[id]/documents', method: 'GET' });
    return serverErrorResponse();
  }
}
