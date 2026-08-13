// ============================================
// ArcDoc Enterprise - Public Request Tracking
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    if (!code) return notFoundResponse('Cod de urmărire lipsă.');

    const result = await query<any>(
      `SELECT r.id, r.number, r.request_type, r.status, r.priority, r.motivation, r.created_at, r.deadline,
              u.first_name || ' ' || u.last_name as user_name
       FROM requests r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.number = $1 OR r.id = $1
       LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      return notFoundResponse('Codul de urmărire nu a fost găsit.');
    }

    const row = result.rows[0];

    // Also fetch timeline for richer tracking info
    const timeline = await query<any>(
      `SELECT tm.action, tm.description, tm.created_at,
              u.first_name || ' ' || u.last_name as user_name
       FROM request_timeline tm
       LEFT JOIN users u ON u.id = tm.user_id
       WHERE tm.request_id = $1
       ORDER BY tm.created_at DESC`,
      [row.id]
    );

    return successResponse({
      ...row,
      timeline: timeline.rows,
    });
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/requests/track', method: 'GET' });
    return serverErrorResponse();
  }
}
