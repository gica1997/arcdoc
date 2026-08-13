// ============================================
// ArcDoc Enterprise - Complete Cleanup
// ============================================
// Wipes ALL data (transactional + configuration/reference demo data)
// and ALL demo/test users. Keeps ONLY:
//   - the admin account (admin@arcdoc.ro / Admin123!) so login works
//   - roles, permissions, role_permissions, companies, settings (RBAC structure)
//   - the database schema (no DROP TABLE)
//
// After running this, the platform is completely empty and ready to
// receive ONLY real data.
//
// Run: npx tsx scripts/clean-complete.ts

import { createClient } from '@libsql/client/web';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
const token = process.env.TURSO_AUTH_TOKEN || '';

if (!url) {
  console.error('ERROR: TURSO_DATABASE_URL (or DATABASE_URL) environment variable is required.');
  process.exit(1);
}

const c = createClient({ url, authToken: token });

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

// All transactional tables (mockup/demo records)
const TRANSACTIONAL_TABLES = [
  'audit_logs',
  'request_timeline',
  'request_documents',
  'request_messages',
  'request_attachments',
  'requests',
  'document_loans',
  'document_waitlist',
  'document_favorites',
  'document_comments',
  'document_relations',
  'document_tags',
  'document_attachments',
  'documents',
  'verifications',
  'generated_labels',
  'generated_documents',
  'signature_requests',
  'ocr_jobs',
  'inventory_items',
  'inventory_sessions',
  'disposal_proposals',
  'evidence_registry',
  'transfer_order_items',
  'transfer_orders',
  'withdrawal_orders',
  'location_history',
  'automation_rules',
  'report_definitions',
  'document_templates',
  'email_templates',
  'communication_history',
  'notifications',
  'scheduled_jobs',
  'process_verbals',
  'refresh_tokens',
];

// All configuration/reference demo tables (dummy nomenclatures etc.)
const CONFIG_TABLES = [
  'document_series',
  'archive_classification',
  'archival_funds',
  'retention_periods',
  'document_types',
  'nomenclatures',
  'archive_locations',
  'locations',
  'positions',
  'organizational_structure',
];

// Tables we KEEP (auth/RBAC structure + platform settings)
// users, roles, permissions, role_permissions, companies, settings

async function main() {
  console.warn('🧹 Cleaning ALL fictional data...');

  // 1. Delete transactional tables
  let deleted = 0;
  for (const t of TRANSACTIONAL_TABLES) {
    try {
      const r = await c.execute(`DELETE FROM "${t}"`);
      deleted += Number(r.rowsAffected) || 0;
    } catch { /* table may not exist */ }
  }

  // 2. Delete configuration/reference demo tables
  for (const t of CONFIG_TABLES) {
    try {
      const r = await c.execute(`DELETE FROM "${t}"`);
      deleted += Number(r.rowsAffected) || 0;
    } catch { /* table may not exist */ }
  }

  // 3. Delete all demo/test users EXCEPT the admin
  const ur = await c.execute('SELECT id FROM users WHERE id != ?', [ADMIN_ID]);
  const demoUserIds = ur.rows.map(r => String((r as any).id));
  for (const uid of demoUserIds) {
    // remove their role links first
    await c.execute('DELETE FROM user_roles WHERE user_id = ?', [uid]).catch(() => {});
    const r = await c.execute('DELETE FROM users WHERE id = ?', [uid]);
    deleted += Number(r.rowsAffected) || 0;
  }

  // 4. Reset auto-increment sequences (SQLite AUTOINCREMENT)
  const allTables = [...TRANSACTIONAL_TABLES, ...CONFIG_TABLES];
  try {
    await c.execute(
      `DELETE FROM sqlite_sequence WHERE name IN (${allTables.map(() => '?').join(',')})`,
      allTables as any
    );
  } catch { /* ignore */ }

  // 5. Verify counts afterwards
  console.warn(`✅ Deleted ${deleted} rows total.`);
  console.warn('');

  const remaining = await c.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  let grand = 0;
  for (const r of remaining.rows) {
    const name = String((r as any).name || '');
    const cnt = await c.execute(`SELECT COUNT(*) as n FROM "${name}"`);
    const n = Number(cnt.rows[0]?.n) || 0;
    if (n > 0) console.warn(`  ${name} = ${n}`);
    grand += n;
  }
  console.warn(`TOTAL remaining rows: ${grand}`);
  console.warn('');
  console.warn('✅ KEPT (RBAC/settings structure): users(admin only), roles, permissions, role_permissions, companies, settings');
  console.warn('Login: admin@arcdoc.ro / Admin123!');
  console.warn('Platform is now 100% empty — only real data can be entered.');
}

main().catch(e => {
  console.error('❌ Cleanup failed:', e.message);
  process.exit(1);
});
