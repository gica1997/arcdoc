// ============================================
// ArcDoc Enterprise - Public Request Submission (Portal)
// ============================================

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { createdResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, requestType, details } = body;

    if (!name || !email || !requestType) {
      return errorResponse('Nume, email și tipul solicitării sunt obligatorii.', 400);
    }

    // Find or create the user by email (portal - public submission)
    let userResult = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    let userId: string;

    if (userResult.rows.length === 0) {
      // Create a temporary external user account
      const newUserId = uuidv4();
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      await query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, user_type, is_active, is_verified, password_changed_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'extern', 1, 1, datetime('now'))`,
        [newUserId, email.toLowerCase(), '', firstName, lastName, phone || null]
      );


      // Assign Solicitant role
      const roleResult = await query('SELECT id FROM roles WHERE slug = \'solicitant\' LIMIT 1');
      if (roleResult.rows.length > 0) {
        await query(
          `INSERT INTO user_roles (id, user_id, role_id, assigned_by)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [uuidv4(), newUserId, (roleResult.rows[0] as { id: string }).id, newUserId]
        );
      }
      userId = newUserId;
    } else {
      userId = (userResult.rows[0] as { id: string }).id;
    }

    // Create the request
    const id = uuidv4();
    const number = `REQ-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO requests (id, user_id, number, request_type, motivation, priority, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'normal', 'submitted', $6, datetime('now'), datetime('now'))`,
      [id, userId, number, requestType, details || '', `${details || ''} — Solicitare publică din portal.`]
    );

    // Timeline entry
    await query(
      'INSERT INTO request_timeline (id, request_id, action, user_id, description, created_at) VALUES ($1, $2, $3, $4, $5, datetime(\'now\'))',
      [uuidv4(), id, 'created', userId, 'Solicitare publică înregistrată']
    );

    // Notification to admins (all active intern users with requests.view permission)
    try {
      await query(
        `INSERT INTO notifications (id, user_id, title, body, type, link, created_at)
         SELECT uuid(), id, 'Solicitare nouă', 'O nouă solicitare publică a fost înregistrată: ' || $2, 'info', '/solicitari/' || $1, datetime('now')
         FROM users
         WHERE is_active = 1 AND user_type = 'intern'`,
        [id, number]
      );
    } catch {
      // best-effort
    }

    return createdResponse({ id, number, trackingCode: number }, 'Solicitare trimisă cu succes.');
  } catch (e: any) {
    return errorResponse(e.message || 'Eroare la trimiterea solicitării.', 500);
  }
}
