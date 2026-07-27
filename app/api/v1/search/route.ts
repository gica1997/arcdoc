import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const q = new URL(request.url).searchParams.get('q') || '';
  if (!q) return successResponse([]);

  const pattern = `%${q}%`;
  const [docs, users, funds, locations, requests] = await Promise.all([
    query('SELECT id, title as name, \'document\' as type, code FROM documents WHERE title ILIKE $1 OR code ILIKE $1 LIMIT 5', [pattern]),
    query('SELECT id, first_name || \' \' || last_name as name, \'user\' as type, email as code FROM users WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 LIMIT 5', [pattern]),
    query('SELECT id, name, \'fund\' as type, code FROM archival_funds WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 3', [pattern]),
    query('SELECT id, name, \'location\' as type, code FROM archive_locations WHERE name ILIKE $1 LIMIT 3', [pattern]),
    query('SELECT id, number as name, \'request\' as type, request_type as code FROM requests WHERE number ILIKE $1 LIMIT 5', [pattern]),
  ]);

  return successResponse([
    ...docs.rows,
    ...users.rows,
    ...funds.rows,
    ...locations.rows,
    ...requests.rows,
  ]);
}