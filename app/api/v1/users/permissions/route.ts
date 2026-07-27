import { query } from '@/lib/db';
import { successResponse } from '@/lib/api-response';

export async function GET() {
  const data = await query<any>('SELECT id, name, slug, module, description FROM permissions ORDER BY module, name');
  return successResponse(data.rows);
}