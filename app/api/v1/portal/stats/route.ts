// ============================================
// ArcDoc Enterprise - Portal Stats API
// ============================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  const userId = payload.sub;

  const [activeResult, completedResult, pendingResult, rejectedResult, urgentResult, totalResult, docsResult] = await Promise.all([
    query('SELECT COUNT(*) as val FROM requests WHERE user_id = $1 AND status IN (\'submitted\',\'approved\',\'in_progress\')', [userId]),
    query('SELECT COUNT(*) as val FROM requests WHERE user_id = $1 AND status = \'completed\'', [userId]),
    query('SELECT COUNT(*) as val FROM requests WHERE user_id = $1 AND status = \'draft\'', [userId]),
    query('SELECT COUNT(*) as val FROM requests WHERE user_id = $1 AND status = \'rejected\'', [userId]),
    query('SELECT COUNT(*) as val FROM requests WHERE user_id = $1 AND priority = \'urgent\' AND status NOT IN (\'completed\',\'cancelled\',\'rejected\')', [userId]),
    query('SELECT COUNT(*) as val FROM requests WHERE user_id = $1', [userId]),
    query(`SELECT COUNT(*) as val FROM request_documents rd
      JOIN requests r ON r.id = rd.request_id
      WHERE r.user_id = $1`, [userId]),
  ]);

  const recentResult = await query(
    `SELECT r.id, r.number, r.request_type, r.status, r.priority, r.created_at,
            r.assigned_to, r.deadline,
            a.first_name || ' ' || a.last_name as assigned_name
     FROM requests r
     LEFT JOIN users a ON a.id = r.assigned_to
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC LIMIT 5`, [userId]
  );

  const notificationsResult = await query(
    `SELECT id, title, body, type, is_read, created_at, link
     FROM notifications WHERE user_id = $1 AND is_read = 0
     ORDER BY created_at DESC LIMIT 10`, [userId]
  );

  return successResponse({
    stats: {
      active: parseInt(activeResult.rows[0]?.val as string || '0'),
      completed: parseInt(completedResult.rows[0]?.val as string || '0'),
      pending: parseInt(pendingResult.rows[0]?.val as string || '0'),
      rejected: parseInt(rejectedResult.rows[0]?.val as string || '0'),
      urgent: parseInt(urgentResult.rows[0]?.val as string || '0'),
      total: parseInt(totalResult.rows[0]?.val as string || '0'),
      documents: parseInt(docsResult.rows[0]?.val as string || '0'),
    },
    recentRequests: recentResult.rows,
    notifications: notificationsResult.rows,
  });
}
