// ============================================
// ArcDoc Enterprise - Registration API
// ============================================

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createdResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, cnp, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return errorResponse('Nume, prenume, email și parola sunt obligatorii.', 400);
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return errorResponse('Există deja un cont cu această adresă de email.', 409);
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, cnp, user_type,
        is_active, is_verified, password_changed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'extern', 1, 0, datetime('now'))`,
      [id, email.toLowerCase(), passwordHash, firstName, lastName, phone || null, cnp || null]
    );


    // Assign Solicitant role
    const roleResult = await query('SELECT id FROM roles WHERE slug = \'solicitant\' LIMIT 1');
    if (roleResult.rows.length > 0) {
      await query(
        `INSERT INTO user_roles (id, user_id, role_id, assigned_by)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [uuidv4(), id, (roleResult.rows[0] as { id: string }).id, id]
      );
    }

    // Assign permissions inherited from role are automatic via role_permissions

    return createdResponse({ id }, 'Cont creat cu succes. Verificați emailul pentru confirmare.');
  } catch (e: any) {
    return errorResponse(e.message || 'Eroare la înregistrare.', 500);
  }
}
