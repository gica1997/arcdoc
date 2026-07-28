// ============================================
// ArcDoc Enterprise - Seed Initial Data
// ============================================
// Run this after setup to create admin user and default roles.
// GET /api/v1/admin/seed?secret=arcDOCsetup2024

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const SETUP_SECRET = process.env.SETUP_SECRET || process.env.NEXT_PUBLIC_SETUP_SECRET || 'arcDOCsetup2024';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== SETUP_SECRET) {
    return Response.json({ success: false, error: 'Invalid secret' }, { status: 401 });
  }

  const results: string[] = [];
  const errors: string[] = [];

  try {
    // 1. Create admin user if not exists
    const existing = await query<any>('SELECT id FROM users WHERE email = $1', ['admin@arcdoc.ro']);
    let adminId = existing.rows[0]?.id;

    if (!adminId) {
      adminId = uuid();
      const hash = await hashPassword('Admin123!');
      await query(
        `INSERT INTO users (id, company_id, email, password_hash, first_name, last_name, user_type, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [adminId, 'company-001', 'admin@arcdoc.ro', hash, 'Admin', 'ArcDoc', 'admin', 1, 1, new Date().toISOString(), new Date().toISOString()]
      );
      results.push('Admin user created (admin@arcdoc.ro / Admin123!)');
    } else {
      results.push('Admin user already exists');
    }

    // 2. Create default roles
    const roles = [
      { name: 'Administrator', slug: 'admin', desc: 'Acces complet la sistem' },
      { name: 'Arhivar', slug: 'archivist', desc: 'Gestionare documente și arhivă' },
      { name: 'Utilizator', slug: 'user', desc: 'Acces limitat la propriile documente' },
      { name: 'Director', slug: 'director', desc: 'Aprobă cereri și rapoarte' },
    ];

    for (const role of roles) {
      const existingRole = await query<any>('SELECT id FROM roles WHERE slug = $1', [role.slug]);
      if (!existingRole.rows[0]) {
        const roleId = uuid();
        await query(
          `INSERT INTO roles (id, company_id, name, slug, description, is_system, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [roleId, 'company-001', role.name, role.slug, role.desc, 1, new Date().toISOString(), new Date().toISOString()]
        );

        // Assign admin role to admin user
        if (role.slug === 'admin') {
          await query(
            `INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [uuid(), adminId, roleId, new Date().toISOString(), adminId]
          );
          results.push(`Role "${role.name}" created and assigned to admin`);
        } else {
          results.push(`Role "${role.name}" created`);
        }
      } else {
        results.push(`Role "${role.name}" already exists`);
      }
    }

    // 3. Create default settings
    const settings = [
      { key: 'company_name', value: 'ArcDoc Enterprise' },
      { key: 'company_cui', value: '' },
      { key: 'company_address', value: '' },
      { key: 'max_document_size_mb', value: '50' },
      { key: 'allowed_file_types', value: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,txt' },
      { key: 'session_timeout_minutes', value: '60' },
      { key: 'max_login_attempts', value: '5' },
      { key: 'lockout_duration_minutes', value: '15' },
    ];

    for (const s of settings) {
      const existingSetting = await query<any>('SELECT id FROM settings WHERE key = $1 AND company_id = $2', [s.key, 'company-001']);
      if (!existingSetting.rows[0]) {
        await query(
          `INSERT INTO settings (id, company_id, key, value, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuid(), 'company-001', s.key, s.value, new Date().toISOString(), new Date().toISOString()]
        );
        results.push(`Setting "${s.key}" created`);
      }
    }

  } catch (e: any) {
    errors.push(e.message);
  }

  return Response.json({
    success: errors.length === 0,
    message: `Seed complete: ${results.length} operations, ${errors.length} errors`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
