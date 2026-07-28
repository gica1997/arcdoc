import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader) || request.cookies.get('arcdoc_session')?.value || null;
  if (!token) return unauthorizedResponse();

  try {
    verifyAccessToken(token);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const limit = 20;
    const data = await query<any>(
      `(SELECT 'login' as action, u.first_name || ' ' || u.last_name as user_name, u.last_login_at as created_at, NULL as entity_type, NULL as entity_name, u.id as user_id
        FROM users u WHERE u.last_login_at IS NOT NULL ORDER BY u.last_login_at DESC LIMIT $1)
       UNION ALL
       (SELECT 'document_created' as action, us.first_name || ' ' || us.last_name as user_name, d.created_at, 'document' as entity_type, d.title as entity_name, d.created_by as user_id
        FROM documents d LEFT JOIN users us ON us.id = d.created_by ORDER BY d.created_at DESC LIMIT $2)
       UNION ALL
       (SELECT 'request_created' as action, us.first_name || ' ' || us.last_name as user_name, r.created_at, 'request' as entity_type, r.number as entity_name, r.user_id
        FROM requests r LEFT JOIN users us ON us.id = r.user_id ORDER BY r.created_at DESC LIMIT $3)
       UNION ALL
       (SELECT 'loan_active' as action, us.first_name || ' ' || us.last_name as user_name, dl.loan_date as created_at, 'loan' as entity_type, d.title as entity_name, dl.user_id
        FROM document_loans dl LEFT JOIN documents d ON d.id = dl.document_id LEFT JOIN users us ON us.id = dl.user_id WHERE dl.status='active' ORDER BY dl.loan_date DESC LIMIT $4)
       UNION ALL
       (SELECT 'disposal_proposed' as action, us.first_name || ' ' || us.last_name as user_name, dp.proposed_at as created_at, 'disposal' as entity_type, d.title as entity_name, dp.proposed_by as user_id
        FROM disposal_proposals dp LEFT JOIN documents d ON d.id = dp.document_id LEFT JOIN users us ON us.id = dp.proposed_by ORDER BY dp.proposed_at DESC LIMIT $5)
       ORDER BY created_at DESC LIMIT $6`,
      [limit, limit, limit, limit, limit, limit]
    );

    return successResponse(data.rows);
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/dashboard/activity', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
