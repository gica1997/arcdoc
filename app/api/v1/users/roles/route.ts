import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';

export async function GET() {
  const data = await query<any>(
    `SELECT r.id, r.name, r.slug, r.description, r.is_system, r.created_at,
     (SELECT json_group_array(json_object('id', p2.id, 'name', p2.name, 'slug', p2.slug, 'module', p2.module))
      FROM role_permissions rp2 JOIN permissions p2 ON p2.id = rp2.permission_id WHERE rp2.role_id = r.id) as permissions
     FROM roles r ORDER BY r.name`
  );
  // Parse permissions JSON string to array for each role (SQLite returns JSON as text)
  const parsed = data.rows.map((r: any) => ({
    ...r,
    permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions || '[]') : (r.permissions || []),
  }));
  return successResponse(parsed);
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { name, slug, description, permissionIds } = await request.json();
    if (!name || !slug) return errorResponse('Nume și slug obligatorii.', 400);
    const rid = uuidv4();
    await query('INSERT INTO roles (id, name, slug, description) VALUES ($1,$2,$3,$4)', [rid, name, slug, description]);
    if (permissionIds?.length) {
      for (const pid of permissionIds) {
        await query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rid, pid]);
      }
    }
    return createdResponse({ id: rid }, 'Rol creat.');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.message?.includes('unique')) return errorResponse('Slug duplicat.', 409);
    return errorResponse('Eroare la creare rol.');
  }
}