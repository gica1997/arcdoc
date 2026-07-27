import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  const [docs, files, users, requests, loans, disposal] = await Promise.all([
    query('SELECT COUNT(*)::int as total FROM documents WHERE status != \'deleted\''),
    query('SELECT COUNT(*)::int as total FROM documents WHERE format = \'physical\''),
    query('SELECT COUNT(*)::int as total FROM users WHERE is_active = true'),
    query('SELECT COUNT(*)::int as total FROM requests WHERE status = \'submitted\''),
    query('SELECT COUNT(*)::int as total FROM document_loans WHERE status = \'active\''),
    query('SELECT COUNT(*)::int as total FROM disposal_proposals WHERE status = \'proposed\''),
  ]);

  return successResponse({
    totalDocuments: docs.rows[0]?.total || 0,
    totalPhysicalFiles: files.rows[0]?.total || 0,
    totalUsers: users.rows[0]?.total || 0,
    activeRequests: requests.rows[0]?.total || 0,
    activeLoans: loans.rows[0]?.total || 0,
    pendingDisposals: disposal.rows[0]?.total || 0,
  });
}