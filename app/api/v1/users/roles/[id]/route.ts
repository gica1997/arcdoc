import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, noContentResponse } from '@/lib/api-response';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    const { name, description, permissionIds } = await request.json();
    if (name) await query('UPDATE roles SET name=$1, updated_at=NOW() WHERE id=$2', [name, id]);
    if (description !== undefined) await query('UPDATE roles SET description=$1, updated_at=NOW() WHERE id=$2', [description, id]);
    if (permissionIds !== undefined) {
      await query('DELETE FROM role_permissions WHERE role_id=$1', [id]);
      for (const pid of permissionIds) {
        await query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, pid]);
      }
    }
    return successResponse(null, 'Rol actualizat.');
  } catch { return errorResponse('Eroare actualizare rol.'); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    await query('DELETE FROM roles WHERE id=$1 AND is_system=false', [id]);
    return noContentResponse();
  } catch { return errorResponse('Eroare ștergere rol.'); }
}