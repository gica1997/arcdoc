// ============================================
// ArcDoc Enterprise - Document Verification - Recent
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const result = await query<any>(
      `SELECT v.id, v.code, v.valid, v.created_at,
              d.title as document_title, d.code as document_code
       FROM verifications v
       LEFT JOIN documents d ON d.id = v.document_id
       ORDER BY v.created_at DESC
       LIMIT 10`
    );
    return successResponse(result.rows);
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/verifications/recent', method: 'GET' });
    return serverErrorResponse();
  }
}
