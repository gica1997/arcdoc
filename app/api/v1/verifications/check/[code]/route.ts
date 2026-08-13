// ============================================
// ArcDoc Enterprise - Document Verification - Check
// ============================================

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';


export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {

    const { code } = await params;
    if (!code) return notFoundResponse('Cod de verificare lipsă.');

    // Look up the document by verification code (qr_code, barcode, or code column)
    const docResult = await query<any>(
      `SELECT id, title, code, qr_code, barcode, registration_date, created_at, confidentiality_level, format
       FROM documents
       WHERE qr_code = $1 OR barcode = $1 OR code = $1 OR id = $1
       LIMIT 1`,
      [code]
    );

    const document = docResult.rows[0];
    const valid = !!document;

    // Log verification attempt
    try {
      await query(
        `INSERT INTO verifications (id, document_id, code, valid, created_at)
         VALUES ($1, $2, $3, $4, datetime('now'))`,
        [uuidv4(), document?.id || null, code, valid ? 1 : 0]
      );
    } catch {
      // Table may not exist yet - log is best-effort
    }

    if (!document) {
      return successResponse({ valid: false, code });
    }

    return successResponse({
      valid: true,
      code,
      document: {
        id: document.id,
        title: document.title,
        code: document.code || document.qr_code || document.barcode,
        date: document.registration_date || document.created_at?.slice(0, 10) || null,
        confidentiality_level: document.confidentiality_level || 'public',
        format: document.format || 'digital',
      },
    });
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/verifications/check', method: 'GET' });
    return serverErrorResponse();
  }
}
