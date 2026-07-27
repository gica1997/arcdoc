import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const { id } = await params;
  const body = await request.json();
  const { action, return_condition, return_notes, due_date } = body;

  if (action === 'return') {
    await query('UPDATE document_loans SET status=$1, returned_at=NOW(), return_condition=$2, return_notes=$3 WHERE id=$4',
      ['returned', return_condition, return_notes, id]);
    const loan = await query('SELECT document_id FROM document_loans WHERE id=$1', [id]);
    if (loan.rows[0]) {
      await query('UPDATE documents SET status=\'available\' WHERE id=$1', [loan.rows[0].document_id]);
      // Notify waitlist
      await query('INSERT INTO notifications (user_id, title, body, type, link) SELECT user_id, \'Document disponibil\', \'Un document din lista de așteptare este acum disponibil.\', \'info\', \'/arhiva/documente/\'||$1 FROM document_waitlist WHERE document_id=$1 AND notified=false', [loan.rows[0].document_id]);
      await query('UPDATE document_waitlist SET notified=true WHERE document_id=$1', [loan.rows[0].document_id]);
    }
    return successResponse(null, 'Document restituit.');
  }
  if (action === 'extend' && due_date) {
    await query('UPDATE document_loans SET due_date=$1, extended_count=extended_count+1, updated_at=NOW() WHERE id=$2', [due_date, id]);
    return successResponse(null, 'Termen prelungit.');
  }
  return errorResponse('Acțiune necunoscută.', 400);
}