import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const [db, docs, users, uptime] = await Promise.all([
    query('SELECT 1 as ok'),
    query('SELECT COUNT(*) as count FROM documents'),
    query('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
    Promise.resolve(process.uptime()),
  ]);
  return successResponse({
    status: 'healthy',
    database: 'connected',
    documents: docs.rows[0]?.count || 0,
    activeUsers: users.rows[0]?.count || 0,
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
  });

}