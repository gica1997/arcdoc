import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query, buildPaginationClause } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth-handler';
import {
  successResponse, successPaginatedResponse, createdResponse, errorResponse,
  unauthorizedResponse, notFoundResponse, buildPaginationMeta, parsePaginationParams,
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sort, order } = parsePaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType');
    const isActive = searchParams.get('isActive');

    const filters: Record<string, unknown> = {};
    if (userType) filters.user_type = userType;
    if (isActive !== null && isActive !== undefined) filters.is_active = isActive === 'true';

    let whereClause = '';
    const params: unknown[] = [];
    if (Object.keys(filters).length > 0 || search) {
      const conditions: string[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(filters)) {
        conditions.push(`u."${key}" = $${idx++}`);
        params.push(value);
      }
      if (search) {
        conditions.push(`(u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx})`);
        params.push(`%${search}%`);
      }
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const countResult = await query<{ total: string }>(`SELECT COUNT(*) as total FROM users u ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Build pagination with qualified sort column to avoid ambiguous column errors in JOIN queries
    const s = /^[a-zA-Z_]+$/.test(sort) ? sort : 'created_at';
    const o = order === 'asc' ? 'ASC' : 'DESC';
    const l = Math.min(Math.max(1, limit), 100);
    const off = (Math.max(1, page) - 1) * l;
    const paginationClause = `ORDER BY u."${s}" ${o} LIMIT ${l} OFFSET ${off}`;
    const dataParams = [...params];

    const data = await query<any>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.cnp, u.user_type, u.is_active, u.last_login_at, u.created_at,
       COALESCE(json_group_array(DISTINCT json_object('id', r.id, 'name', r.name, 'slug', r.slug)), '[]') as roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${whereClause}
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.cnp, u.user_type, u.is_active, u.last_login_at, u.created_at
       ${paginationClause}`,
      dataParams
    );

    // Turso returns json_group_array as a JSON *string* — parse it into a real array
    const parsed = (data.rows as any[]).map((row: any) => {
      let roles = row.roles;
      if (typeof roles === 'string') {
        try { roles = JSON.parse(roles); } catch { roles = []; }
      }
      if (!Array.isArray(roles)) roles = [];
      return { ...row, roles };
    });

    return successPaginatedResponse(parsed, buildPaginationMeta(total, page, limit));

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('[Users API] GET error:', msg);
    return errorResponse(msg);
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, cnp, userType, roleIds } = body;
    if (!email || !password || !firstName || !lastName) return errorResponse('Câmpurile obligatorii lipsesc.', 400);

    const hash = await hashPassword(password);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, cnp, user_type, is_active, is_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,1)',
      [userId, email.toLowerCase(), hash, firstName, lastName, phone, cnp, userType || 'intern']
    );

    if (roleIds?.length) {
      for (const roleId of roleIds) {
        await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, roleId]);
      }
    }

    return createdResponse({ id: userId }, 'Utilizator creat cu succes.');
  } catch (error: any) {
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return errorResponse('Email-ul este deja folosit.', 409);
    }
    console.error('[Users API] POST error:', error);
    return errorResponse('Eroare la crearea utilizatorului.');
  }
}
