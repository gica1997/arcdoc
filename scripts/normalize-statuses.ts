// Normalize request statuses to match UI conventions
// UI uses: draft, submitted, approved, rejected, completed
// Legacy seed data used: pending, in_progress
import { query } from '../lib/db';

async function main() {
  console.log('Normalizing request statuses...');

  const result = await query(`UPDATE requests SET status = 'submitted', updated_at = updated_at WHERE status = 'pending'`);
  console.log(`pending -> submitted: ${result.rowCount} rows`);

  const result2 = await query(`UPDATE requests SET status = 'completed', updated_at = updated_at WHERE status = 'in_progress'`);
  console.log(`in_progress -> completed: ${result2.rowCount} rows`);

  // Verify
  const statuses = await query(`SELECT status, COUNT(*) as count FROM requests GROUP BY status`);
  console.log('Current statuses:', statuses.rows);
}

main().catch(e => { console.error(e); process.exit(1); });
