import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-handler';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const [docs, files, users, requests, loans, disposal] = await Promise.all([
      query('SELECT COUNT(*) as total FROM documents WHERE status != $1', ['deleted']),
      query('SELECT COUNT(*) as total FROM documents WHERE format = $1', ['physical']),
      query('SELECT COUNT(*) as total FROM users WHERE is_active = 1'),
      query('SELECT COUNT(*) as total FROM requests WHERE status = $1', ['submitted']),
      query('SELECT COUNT(*) as total FROM document_loans WHERE status = $1', ['active']),
      query('SELECT COUNT(*) as total FROM disposal_proposals WHERE status = $1', ['proposed']),
    ]);

    return successResponse({
      totalDocuments: docs.rows[0]?.total ?? 0,
      totalPhysicalFiles: files.rows[0]?.total ?? 0,
      totalUsers: users.rows[0]?.total ?? 0,
      activeRequests: requests.rows[0]?.total ?? 0,
      activeLoans: loans.rows[0]?.total ?? 0,
      pendingDisposals: disposal.rows[0]?.total ?? 0,
    });
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/dashboard/stats', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
