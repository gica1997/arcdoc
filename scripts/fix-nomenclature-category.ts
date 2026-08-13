// ============================================
// ArcDoc Enterprise - Fix nomenclature category
// ============================================
// Renames the 'request_types' category to 'request_type' (singular)
// to match what the frontend pages request.
//
// Run: npx tsx scripts/fix-nomenclature-category.ts
// ============================================

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
  // Check what categories exist
  const check = await c.execute({ sql: `SELECT category, COUNT(*) as cnt FROM nomenclatures GROUP BY category ORDER BY category` });
  console.log('Current categories:');
  for (const row of check.rows) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }

  // Rename request_types -> request_type
  const res = await c.execute({
    sql: `UPDATE nomenclatures SET category = 'request_type' WHERE category = 'request_types'`,
  });
  console.log(`\nUpdated ${res.rowsAffected} row(s) from 'request_types' to 'request_type'.`);

  // Verify
  const verify = await c.execute({ sql: `SELECT category, COUNT(*) as cnt FROM nomenclatures GROUP BY category ORDER BY category` });
  console.log('Categories after fix:');
  for (const row of verify.rows) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }
}

main().then(() => {
  c.close();
  process.exit(0);
}).catch((err) => {
  console.error('Fix failed:', err);
  c.close();
  process.exit(1);
});
