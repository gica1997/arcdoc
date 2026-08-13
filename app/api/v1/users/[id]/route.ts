import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import {
  successResponse, errorResponse, unauthorizedResponse, notFoundResponse, noContentResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    const data = await query<any>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.cnp, u.user_type, u.is_active, u.last_login_at, u.created_at, u.updated_at,
       (SELECT COALESCE(json_group_array(json_object('id', r.id, 'name', r.name, 'slug', r.slug)), '[]')
        FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) as roles
       FROM users u WHERE u.id = ?`, [id]
    );
    if (data.rowCount === 0) return notFoundResponse('Utilizator negăsit.');
    return successResponse(data.rows[0]);
  } catch { return unauthorizedResponse(); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    const body = await request.json();
    const { email, firstName, lastName, phone, cnp, isActive, userType, roleIds, password } = body;

    const sets: string[] = []; const vals: unknown[] = []; let idx = 1;
    if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email.toLowerCase()); }
    if (firstName !== undefined) { sets.push(`first_name = $${idx++}`); vals.push(firstName); }
    if (lastName !== undefined) { sets.push(`last_name = $${idx++}`); vals.push(lastName); }
    if (phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(phone); }
    if (cnp !== undefined) { sets.push(`cnp = $${idx++}`); vals.push(cnp); }
    if (isActive !== undefined) { sets.push(`is_active = $${idx++}`); vals.push(isActive); }
    if (userType !== undefined) { sets.push(`user_type = $${idx++}`); vals.push(userType); }
    if (password) { sets.push(`password_hash = $${idx++}`); vals.push(await hashPassword(password)); }

    if (sets.length > 0) {
      sets.push('updated_at = NOW()');
      vals.push(id);
      await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
    }

    if (roleIds !== undefined) {
      await query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      for (const roleId of roleIds) {
        await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, roleId]);
      }
    }

    return successResponse({ id }, 'Utilizator actualizat.');
  } catch (error: any) {
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) return errorResponse('Email duplicat.', 409);
    return errorResponse('Eroare la actualizare.');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    verifyAccessToken(token);
    const { id } = await params;
    await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [id]);
    return noContentResponse();
  } catch { return unauthorizedResponse(); }
}