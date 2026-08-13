// ============================================
// ArcDoc Enterprise - Inspect Database
// ============================================
// Lists all tables with row counts and all users.
// Run: npx tsx scripts/inspect-db.ts

import { createClient } from '@libsql/client/web';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
const token = process.env.TURSO_AUTH_TOKEN || '';

if (!url) {
  console.error('ERROR: TURSO_DATABASE_URL (or DATABASE_URL) environment variable is required.');
  process.exit(1);
}

const c = createClient({ url, authToken: token });

async function main() {
  const t = await c.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  console.log(`TABLES (${t.rows.length}):`);
  let total = 0;
  for (const r of t.rows) {
    const name = String((r as any).name || '');
    const cnt = await c.execute(`SELECT COUNT(*) as n FROM "${name}"`);
    const n = Number(cnt.rows[0]?.n) || 0;
    total += n;
    if (n > 0) console.log(`  ${name} = ${n}`);
  }

  console.log(`TOTAL ROWS (excluding empty): ${total}`);

  const u = await c.execute('SELECT id, email, first_name, last_name, user_type, is_active FROM users ORDER BY created_at');
  console.log(`\nUSERS (${u.rows.length}):`);
  for (const r of u.rows as any[]) {
    console.log(`  ${r.id} | ${r.email} | ${r.first_name} ${r.last_name} | ${r.user_type} | active=${r.is_active}`);
  }

  const roles = await c.execute('SELECT id, name, slug FROM roles ORDER BY name');
  console.log(`\nROLES (${roles.rows.length}):`);
  for (const r of roles.rows as any[]) {
    console.log(`  ${r.id} | ${r.name} | ${r.slug}`);
  }
}

main().catch(e => {
  console.error('❌ Inspect failed:', e.message);
  process.exit(1);
});
