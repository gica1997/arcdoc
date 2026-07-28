import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-handler';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const [docsMonth, byDept, byFund, byStatus, byConf, requestsByMonth] = await Promise.all([
      query(`
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM documents
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `),
      query(`
        SELECT COALESCE(dep.name, 'Fără departament') as name, COUNT(*) as value
        FROM documents d
        LEFT JOIN organizational_structure dep ON dep.id = d.department_id
        WHERE d.status != 'deleted'
        GROUP BY dep.name
        ORDER BY value DESC
        LIMIT 10
      `),
      query(`
        SELECT COALESCE(f.name, 'Fără fond') as name, COUNT(*) as value
        FROM documents d
        LEFT JOIN archival_funds f ON f.id = d.fund_id
        WHERE d.status != 'deleted'
        GROUP BY f.name
        ORDER BY value DESC
        LIMIT 10
      `),
      query(`
        SELECT COALESCE(status, 'unknown') as name, COUNT(*) as value
        FROM documents
        GROUP BY status
      `),
      query(`
        SELECT COALESCE(confidentiality_level, 'public') as name, COUNT(*) as value
        FROM documents
        WHERE status != 'deleted'
        GROUP BY confidentiality_level
      `),
      query(`
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM requests
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `),
    ]);

    return successResponse({
      documentsByMonth: docsMonth.rows,
      documentsByDepartment: byDept.rows,
      documentsByFund: byFund.rows,
      documentsByStatus: byStatus.rows,
      documentsByConfidentiality: byConf.rows,
      requestsByMonth: requestsByMonth.rows,
    });
  } catch (error) {
    logger.apiError(error, { path: '/api/v1/dashboard/charts', method: 'GET' });
    return serverErrorResponse('Internal Server Error');
  }
}
