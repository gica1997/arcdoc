import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-handler';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const limit = 10;

    const [logins, docs, reqs, loans, disposals] = await Promise.all([
      query<any>('SELECT id as user_id, first_name || \' \' || last_name as user_name, last_login_at as created_at FROM users WHERE last_login_at IS NOT NULL ORDER BY last_login_at DESC LIMIT $1', [limit]),
      query<any>('SELECT d.title as entity_name, d.created_at, d.created_by as user_id FROM documents d WHERE d.status != \'deleted\' ORDER BY d.created_at DESC LIMIT $1', [limit]),
      query<any>('SELECT r.number as entity_name, r.created_at, r.user_id FROM requests r ORDER BY r.created_at DESC LIMIT $1', [limit]),
      query<any>('SELECT d.title as entity_name, dl.loan_date as created_at, dl.user_id FROM document_loans dl LEFT JOIN documents d ON d.id = dl.document_id WHERE dl.status=\'active\' ORDER BY dl.loan_date DESC LIMIT $1', [limit]),
      query<any>('SELECT d.title as entity_name, dp.proposed_at as created_at, dp.proposed_by as user_id FROM disposal_proposals dp LEFT JOIN documents d ON d.id = dp.document_id ORDER BY dp.proposed_at DESC LIMIT $1', [limit]),
    ]);

    const activity = [
      ...logins.rows.map(r => ({ action: 'login', user_name: r.user_name, created_at: r.created_at, entity_type: null, entity_name: null, user_id: r.user_id })),
      ...docs.rows.map(r => ({ action: 'document_created', user_name: null, created_at: r.created_at, entity_type: 'document', entity_name: r.entity_name, user_id: r.user_id })),
      ...reqs.rows.map(r => ({ action: 'request_created', user_name: null, created_at: r.created_at, entity_type: 'request', entity_name: r.entity_name, user_id: r.user_id })),
      ...loans.rows.map(r => ({ action: 'loan_active', user_name: null, created_at: r.created_at, entity_type: 'loan', entity_name: r.entity_name, user_id: r.user_id })),
      ...disposals.rows.map(r => ({ action: 'disposal_proposed', user_name: null, created_at: r.created_at, entity_type: 'disposal', entity_name: r.entity_name, user_id: r.user_id })),
    ];

    activity.sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return b.created_at.localeCompare(a.created_at);
    });

    return successResponse(activity.slice(0, 20));
  } catch (error: any) {
    const detail = error?.message || String(error);
    logger.apiError(detail, { path: '/api/v1/dashboard/activity', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
