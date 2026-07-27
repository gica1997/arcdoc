// ============================================
// ArcDoc Enterprise - Turso Database Seeder
// ============================================
// Run: npx tsx scripts/turso-seed.ts

import { createClient } from '@libsql/client';
import * as argon2 from 'argon2';

const TURSO_URL = 'libsql://arcdoc-arcdoc.aws-us-east-2.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1NTQxNjAsImlkIjoiMDE5ZjdmYjctMWEwMS03NDJiLTk3Y2QtOTFhODliNDNjZDkxIiwia2lkIjoia3M2Rm9XSkZLcVdlWVBhMVdhaU5OVEV0dlc1eDdUQzNQTkZBSzR0NjJLYyIsInJpZCI6ImZjZGYzOWM5LTM5MDctNDc2ZS05ZWYxLTdlOTk1OGE2YWY2NCJ9.lW7Wu5jyCS_ZRqLbEG-0nUKMIPE0RKKm6d7BZTrvB2xmJN6Y1dykuM9686ZCHL-G2FWOz8u2OFMf6IZJ5xCUCw';

async function seed() {
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  console.warn('Seeding Turso database...');

  // Create tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, cui TEXT UNIQUE NOT NULL, address TEXT, phone TEXT,
      email TEXT, logo_url TEXT, is_active INTEGER DEFAULT 1, reg_com TEXT, county TEXT, city TEXT,
      postal_code TEXT, website TEXT, contact_person TEXT, contact_position TEXT,
      primary_color TEXT DEFAULT '#1a73e8', favicon_url TEXT, custom_domain TEXT,
      settings TEXT DEFAULT '{}', white_label_settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      phone TEXT, cnp TEXT, user_type TEXT DEFAULT 'intern', is_active INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 0, refresh_token TEXT, last_login_at TEXT,
      password_changed_at TEXT, reset_token TEXT, reset_token_expires TEXT,
      login_attempts INTEGER DEFAULT 0, locked_until TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      description TEXT, is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at TEXT DEFAULT (datetime('now')), assigned_by TEXT,
      UNIQUE(user_id, role_id)
    )`,
    `CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      description TEXT, module TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY, role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      granted_at TEXT DEFAULT (datetime('now')), UNIQUE(role_id, permission_id)
    )`,
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL, expires_at TEXT NOT NULL, is_revoked INTEGER DEFAULT 0,
      revoked_at TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY, company_id TEXT, key TEXT NOT NULL, value TEXT NOT NULL,
      description TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(company_id, key)
    )`,
  ];

  for (const sql of tables) {
    await client.execute(sql);
  }

  // Generate admin password hash
  const adminHash = await argon2.hash('Admin123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  console.warn('Admin hash:', adminHash);

  // Seed company
  await client.execute(`INSERT OR IGNORE INTO companies (id, name, cui) VALUES ('00000000-0000-0000-0000-000000000001', 'ArcDoc Enterprise', 'RO12345678')`);

  // Seed admin user
  await client.execute(
    `INSERT OR IGNORE INTO users (id, company_id, email, password_hash, first_name, last_name, user_type, is_active, is_verified)
     VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@arcdoc.ro', ?, 'Admin', 'ArcDoc', 'intern', 1, 1)`,
    [adminHash]
  );

  // Seed roles
  const roles = [
    ['10000000-0000-0000-0000-000000000001', 'Administrator', 'administrator', 'Acces complet la toate modulele', 1],
    ['10000000-0000-0000-0000-000000000002', 'Arhivar', 'arhivar', 'Gestionează arhiva și documentele', 1],
    ['10000000-0000-0000-0000-000000000003', 'Operator', 'operator', 'Operează solicitări și consultări', 1],
    ['10000000-0000-0000-0000-000000000004', 'Solicitant', 'solicitant', 'Utilizator extern - depune cereri', 1],
  ];

  for (const [id, name, slug, desc, isSystem] of roles) {
    await client.execute(
      `INSERT OR IGNORE INTO roles (id, name, slug, description, is_system) VALUES (?, ?, ?, ?, ?)`,
      [id, name, slug, desc, isSystem]
    );
  }

  // Seed permissions (essential ones)
  const perms = [
    ['20000001','Dashboard - Vizualizare','dashboard.view','dashboard'],
    ['20000002','Utilizatori - Vizualizare','users.view','users'],
    ['20000003','Utilizatori - Creare','users.create','users'],
    ['20000004','Utilizatori - Editare','users.update','users'],
    ['20000005','Utilizatori - Ștergere','users.delete','users'],
    ['20000006','Roluri - Vizualizare','roles.view','roles'],
    ['20000007','Roluri - Creare','roles.create','roles'],
    ['20000008','Roluri - Editare','roles.update','roles'],
    ['20000009','Permisiuni - Vizualizare','permissions.view','permissions'],
    ['20000010','Fonduri - Vizualizare','funds.view','funds'],
    ['20000011','Fonduri - Creare','funds.create','funds'],
    ['20000012','Fonduri - Editare','funds.update','funds'],
    ['20000013','Documente - Vizualizare','documents.view','documents'],
    ['20000014','Documente - Creare','documents.create','documents'],
    ['20000015','Documente - Editare','documents.update','documents'],
    ['20000016','Solicitări - Vizualizare','requests.view','requests'],
    ['20000017','Solicitări - Creare','requests.create','requests'],
    ['20000018','Solicitări - Aprobare','requests.approve','requests'],
    ['20000019','Rapoarte - Vizualizare','reports.view','reports'],
    ['20000020','Audit - Vizualizare','audit.view','audit'],
    ['20000021','Setări - Vizualizare','settings.view','settings'],
    ['20000022','Notificări - Vizualizare','notifications.view','notifications'],
  ];

  for (const [id, name, slug, module] of perms) {
    await client.execute(
      `INSERT OR IGNORE INTO permissions (id, name, slug, module) VALUES (?, ?, ?, ?)`,
      [id, name, slug, module]
    );
  }

  // Assign admin role to admin user
  await client.execute(
    `INSERT OR IGNORE INTO user_roles (id, user_id, role_id) VALUES ('ur-admin-1', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')`
  );

  // Assign all permissions to Administrator role
  for (const [id] of perms) {
    await client.execute(
      `INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id) VALUES ('rp-' || ?, '10000000-0000-0000-0000-000000000001', ?)`,
      [id, id]
    );
  }

  console.warn('✅ Turso database seeded successfully!');
  console.warn('Admin login: admin@arcdoc.ro / Admin123!');
}

seed().catch(console.error);