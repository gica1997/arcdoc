// ============================================
// ArcDoc Enterprise - Database Seed Script
// ============================================
// Run: npx tsx scripts/seed.ts

import { hashPassword } from '@/lib/auth';

async function seed() {
  // Generate admin password hash
  const adminHash = await hashPassword('Admin123!');
  console.log('Admin password hash:', adminHash);
  console.log('Use this in your MIGRATION_V2.sql or to insert directly.');
  console.log('Admin email: admin@arcdoc.ro');
  console.log('Admin password: Admin123!');
}

seed();