// ============================================
// ArcDoc Enterprise - Full Demo Data Seeder
// ============================================
// Populates the Turso database with realistic demo data:
// departments, positions, locations, archive locations, document types,
// nomenclatures, archival funds, series, retention periods, classification,
// documents, requests, loans, transfers, withdrawals, inventory, audit, etc.
//
// Run: npx tsx scripts/full-seed.ts

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
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const NOW = () => new Date().toISOString();
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
  const r = (Math.random() * 16) | 0;
  const v = ch === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
});

function q(sql: string, params?: unknown[]) {
  return c.execute({ sql, args: params as any });
}

async function insert(table: string, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const vals = keys.map(k => data[k]);
  await c.execute({ sql: `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, args: vals as any });
}

let inserted = 0;

async function seedDepartments() {
  const depts = [
    { name: 'Direcția Generală', code: 'DG', level: 0 },
    { name: 'Resurse Umane', code: 'RU', level: 1, parent: 'DG' },
    { name: 'Financiar-Contabil', code: 'FC', level: 1, parent: 'DG' },
    { name: 'Juridic', code: 'JR', level: 1, parent: 'DG' },
    { name: 'Arhivă Centrală', code: 'AR', level: 1, parent: 'DG' },
    { name: 'Tehnologia Informației', code: 'IT', level: 1, parent: 'DG' },
    { name: 'Secretariat', code: 'SC', level: 1, parent: 'DG' },
  ];
  const idMap: Record<string, string> = {};
  for (const d of depts) {
    const id = uuid();
    idMap[d.code] = id;
    await insert('organizational_structure', {
      id, company_id: COMPANY_ID, name: d.name, code: d.code,
      parent_id: d.parent ? idMap[d.parent] : null, level: d.level, sort_order: 0, is_active: 1,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedPositions() {
  const positions = [
    'Director General', 'Director Economic', 'Șef Serviciu Resurse Umane',
    'Șef Birou Arhivă', 'Arhivar Principal', 'Arhivar', 'Consilier Juridic',
    'Inspector Resurse Umane', 'Contabil Șef', 'Referent',
  ];
  for (const name of positions) {
    await insert('positions', {
      id: uuid(), company_id: COMPANY_ID, name, code: name.split(' ').map(w => w[0]).join('').toUpperCase(),
      description: '', is_active: 1, created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedLocations() {
  const locs = [
    { name: 'Sediul Central', code: 'SC', type: 'building', level: 0 },
    { name: 'Birouri', code: 'BIR', type: 'floor', parent: 'SC', level: 1 },
    { name: 'Arhivă fizică - Sala 1', code: 'ARH1', type: 'room', parent: 'SC', level: 1 },
    { name: 'Arhivă fizică - Sala 2', code: 'ARH2', type: 'room', parent: 'SC', level: 1 },
    { name: 'Depozit documente', code: 'DEP', type: 'storage', parent: 'SC', level: 1 },
    { name: 'Raft A1', code: 'RA1', type: 'shelf', parent: 'ARH1', level: 2 },
    { name: 'Raft A2', code: 'RA2', type: 'shelf', parent: 'ARH1', level: 2 },
    { name: 'Raft B1', code: 'RB1', type: 'shelf', parent: 'ARH2', level: 2 },
    { name: 'Raft B2', code: 'RB2', type: 'shelf', parent: 'ARH2', level: 2 },
    { name: 'Raft D1', code: 'RD1', type: 'shelf', parent: 'DEP', level: 2 },
  ];
  const idMap: Record<string, string> = {};
  for (const l of locs) {
    const id = uuid();
    idMap[l.code] = id;
    await insert('locations', {
      id, company_id: COMPANY_ID, name: l.name, code: l.code, location_type: l.type,
      parent_id: l.parent ? idMap[l.parent] : null, level: l.level, is_active: 1,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedArchiveLocations() {
  const rows = [
    { name: 'Sala 1 - Raft A1', code: 'S1-A1', type: 'shelf', level: 2 },
    { name: 'Sala 1 - Raft A2', code: 'S1-A2', type: 'shelf', level: 2 },
    { name: 'Sala 2 - Raft B1', code: 'S2-B1', type: 'shelf', level: 2 },
    { name: 'Sala 2 - Raft B2', code: 'S2-B2', type: 'shelf', level: 2 },
    { name: 'Depozit - Raft D1', code: 'DEP-D1', type: 'shelf', level: 2 },
    { name: 'Depozit - Raft D2', code: 'DEP-D2', type: 'shelf', level: 2 },
  ];
  for (const l of rows) {
    await insert('archive_locations', {
      id: uuid(), company_id: COMPANY_ID, name: l.name, code: l.code, location_type: l.type,
      level: l.level, sort_order: 0, capacity: 500, status: 'active', is_active: 1,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedDocumentTypes() {
  const types = [
    { name: 'Contract de muncă', code: 'CM', retention: 'Permanent' },
    { name: 'Decizie internă', code: 'DI', retention: '5 ani' },
    { name: 'Proces-verbal', code: 'PV', retention: '10 ani' },
    { name: 'Factură', code: 'FA', retention: '5 ani' },
    { name: 'Correspondență', code: 'CO', retention: '3 ani' },
    { name: 'Raport', code: 'RP', retention: '5 ani' },
    { name: 'Adeverință', code: 'AD', retention: '10 ani' },
    { name: 'Situație financiară', code: 'SF', retention: 'Permanent' },
    { name: 'Cerere', code: 'CE', retention: '3 ani' },
    { name: 'Ordin de serviciu', code: 'OS', retention: '5 ani' },
  ];
  for (const t of types) {
    await insert('document_types', {
      id: uuid(), company_id: COMPANY_ID, name: t.name, code: t.code,
      description: t.name, retention_period: t.retention, is_active: 1, sort_order: 0,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedNomenclatures() {
  const noms: Array<[string, string]> = [
    ['priorities', 'Normal'], ['priorities', 'Urgent'], ['priorities', 'Foarte urgent'],
    ['request_type', 'Consultare document'], ['request_type', 'Împrumut dosar'],

    ['request_type', 'Copie după document'], ['request_type', 'Certificare document'],

    ['document_status', 'Disponibil'], ['document_status', 'Împrumutat'],
    ['document_status', 'Arhivat'], ['document_status', 'În casare'],
    ['formats', 'Fizic'], ['formats', 'Digital'],
    ['confidentiality', 'Public'], ['confidentiality', 'Intern'],
    ['confidentiality', 'Confidențial'], ['confidentiality', 'Secret de serviciu'],
    ['loans_status', 'Activ'], ['loans_status', 'Returnat'], ['loans_status', 'Întârziat'],
    ['transport_method', 'Curier'], ['transport_method', 'Poștă'], ['transport_method', 'Predare personală'],
    ['organization_type', 'Instituție publică'], ['organization_type', 'Societate comercială'],
    ['organization_type', 'ONG'], ['organization_type', 'Persoană fizică'],
  ];
  let i = 0;
  for (const [cat, name] of noms) {
    await insert('nomenclatures', {
      id: uuid(), company_id: COMPANY_ID, category: cat, name, code: `${cat.toUpperCase()}-${++i}`,
      is_active: 1, sort_order: i, created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedRetentionPeriods() {
  const periods = [
    { name: 'Permanent', code: 'PERM', years: null, is_permanent: 1 },
    { name: '3 ani', code: '3A', years: 3, is_permanent: 0 },
    { name: '5 ani', code: '5A', years: 5, is_permanent: 0 },
    { name: '10 ani', code: '10A', years: 10, is_permanent: 0 },
    { name: '25 ani', code: '25A', years: 25, is_permanent: 0 },
  ];
  for (const p of periods) {
    await insert('retention_periods', {
      id: uuid(), company_id: COMPANY_ID, name: p.name, code: p.code,
      years: p.years, is_permanent: p.is_permanent, sort_order: 0, is_active: 1,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedFunds() {
  const funds = [
    { name: 'Fondul Administrativ', code: 'F-ADM', start: 1995, end: 2025, dept: 'DG' },
    { name: 'Fondul Personal', code: 'F-RU', start: 1998, end: 2025, dept: 'RU' },
    { name: 'Fondul Financiar', code: 'F-FC', start: 2000, end: 2025, dept: 'FC' },
    { name: 'Fondul Juridic', code: 'F-JR', start: 2005, end: 2025, dept: 'JR' },
    { name: 'Fondul Tehnic', code: 'F-IT', start: 2008, end: 2025, dept: 'IT' },
  ];
  const rows = await c.execute('SELECT id, code FROM organizational_structure');
  const deptMap: Record<string, string> = {};
  for (const r of rows.rows) deptMap[r.code as string] = r.id as string;

  const fundIds: string[] = [];
  for (const f of funds) {
    const id = uuid();
    fundIds.push(id);
    await insert('archival_funds', {
      id, company_id: COMPANY_ID, name: f.name, code: f.code,
      description: `Fond arhivistic ${f.name}`,
      start_year: f.start, end_year: f.end, creator: 'Arhiva Centrală',
      department_id: deptMap[f.dept] || null, status: 'active', is_active: 1,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
  return fundIds;
}

async function seedSeries(fundIds: string[]) {
  const seriesDefs: Array<[number, string, string, string]> = [
    [0, 'Seria Registre de evidență', 'SR-ADM', 'Permanent'],
    [0, 'Seria Corespondență', 'SC-ADM', '3 ani'],
    [1, 'Dosare de personal', 'SD-RU', 'Permanent'],
    [1, 'Contracte de muncă', 'SC-RU', 'Permanent'],
    [2, 'Situații financiare anuale', 'SF-FC', 'Permanent'],
    [2, 'Facturi și deconturi', 'SF-FC2', '5 ani'],
    [3, 'Contracte și litigii', 'SJ-JR', '10 ani'],
    [4, 'Proiecte IT', 'SI-IT', '10 ani'],
  ];
  for (const [fi, name, code, retention] of seriesDefs) {
    await insert('document_series', {
      id: uuid(), fund_id: fundIds[fi], name, code, description: name,
      retention_period_id: null, confidentiality_level: 'intern', sort_order: 0, is_active: 1,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedClassification() {
  const cats = [
    { name: 'Documente administrative', code: 'CL-ADM', level: 'clasa' },
    { name: 'Documente de personal', code: 'CL-RU', level: 'clasa' },
    { name: 'Documente financiar-contabile', code: 'CL-FC', level: 'clasa' },
    { name: 'Documente juridice', code: 'CL-JR', level: 'clasa' },
  ];
  for (const cl of cats) {
    await insert('archive_classification', {
      id: uuid(), company_id: COMPANY_ID, name: cl.name, code: cl.code,
      level: cl.level, retention_type: 'permanent', is_active: 1, sort_order: 0,
      created_at: NOW(), updated_at: NOW(),
    });
    inserted++;
  }
}

async function seedDocuments(fundIds: string[]) {
  const docs: Array<Record<string, unknown>> = [];
  const now = new Date();

  // Generate documents across last 12 months
  for (let m = 0; m < 12; m++) {
    const count = 5 + Math.floor(Math.random() * 8); // 5-12 docs per month
    for (let i = 0; i < count; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - m);
      d.setDate(1 + Math.floor(Math.random() * 27));
      d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
      const created = d.toISOString();
      const fundIdx = Math.floor(Math.random() * fundIds.length);
      const status = m === 0 ? 'available' : (Math.random() > 0.3 ? 'archived' : 'available');
      const format = Math.random() > 0.35 ? 'physical' : 'digital';
      const conf = ['public', 'intern', 'confidential'][Math.floor(Math.random() * 3)];
      const title = `${['Contract de colaborare', 'Decizie internă', 'Proces-verbal ședință', 'Raport anual', 'Factură decont', 'Adeverință salariat', 'Notă internă', 'Cerere înregistrată', 'Ordin de serviciu'][Math.floor(Math.random() * 9)]} ${i + 1}/${m + 1}/${now.getFullYear()}`;
      docs.push({
        id: uuid(), fund_id: fundIds[fundIdx], department_id: null, created_by: ADMIN_ID,
        title, code: `DOC-${(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        number: String(1000 + Math.floor(Math.random() * 9000)),
        document_type: ['CM', 'DI', 'PV', 'RP', 'FA', 'AD', 'CO', 'CE', 'OS'][Math.floor(Math.random() * 9)],
        description: `Document generat automat pentru demonstrație — ${title}`,
        category: 'administrativ', subcategory: '', pages: 1 + Math.floor(Math.random() * 20),
        language: 'ro', format, file_url: format === 'digital' ? '/uploads/sample.pdf' : null,
        file_size: format === 'digital' ? 50000 + Math.floor(Math.random() * 500000) : null,
        status, issue_date: created, registration_date: created,
        expiry_date: null, retention_period_id: null,
        confidentiality_level: conf, observations: '',
        archive_location_id: null, barcode: `BC-${Math.floor(100000 + Math.random() * 899999)}`,
        created_at: created, updated_at: created,
      });
    }
  }

  for (const doc of docs) {
    await insert('documents', doc);
    inserted++;
  }
}

async function seedRequests() {
  const reqTypes = ['Consultare document', 'Împrumut dosar', 'Copie după document', 'Certificare document'];
  const statuses = ['pending', 'approved', 'approved', 'completed', 'rejected'];
  const rows = await c.execute('SELECT id FROM users WHERE id != ?', [ADMIN_ID]);
  const userIds = rows.rows.map(r => r.id as string);
  if (userIds.length === 0) userIds.push(ADMIN_ID);

  for (let i = 0; i < 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 30));
    d.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    await insert('requests', {
      id: uuid(), user_id: userIds[Math.floor(Math.random() * userIds.length)],
      number: `REQ-${d.getFullYear()}-${String(1000 + i)}`,
      request_type: reqTypes[Math.floor(Math.random() * reqTypes.length)],
      status, motivation: 'Motivație pentru solicitare demonstrativă',
      priority: ['normal', 'urgent', 'foarte_urgent'][Math.floor(Math.random() * 3)],
      department_id: null, assigned_to: status !== 'pending' ? ADMIN_ID : null,
      approved_by: status === 'rejected' ? ADMIN_ID : (status === 'approved' || status === 'completed' ? ADMIN_ID : null),
      approved_at: (status === 'approved' || status === 'completed') ? d.toISOString() : null,
      rejected_at: status === 'rejected' ? d.toISOString() : null,
      rejection_reason: status === 'rejected' ? 'Documentul nu este disponibil în arhivă' : null,
      completed_at: status === 'completed' ? d.toISOString() : null,
      deadline: d.toISOString(), created_at: d.toISOString(), updated_at: d.toISOString(),
    });
    inserted++;
  }
}

async function seedLoans() {
  const rows = await c.execute('SELECT id FROM documents LIMIT 50');
  const docIds = rows.rows.map(r => r.id as string);
  const users = await c.execute('SELECT id FROM users WHERE id != ?', [ADMIN_ID]);
  const userIds = users.rows.map(r => r.id as string);
  if (userIds.length === 0) userIds.push(ADMIN_ID);

  for (let i = 0; i < 8; i++) {
    const docId = docIds[Math.floor(Math.random() * docIds.length)];
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 15));
    const due = new Date(d);
    due.setDate(due.getDate() + 7 + Math.floor(Math.random() * 15));
    const returned = Math.random() > 0.5;
    await insert('document_loans', {
      id: uuid(), document_id: docId, user_id: userIds[Math.floor(Math.random() * userIds.length)],
      requested_by: userIds[Math.floor(Math.random() * userIds.length)],
      approved_by: ADMIN_ID,
      status: returned ? 'returned' : 'active',
      loan_date: d.toISOString(), due_date: due.toISOString(),
      returned_at: returned ? due.toISOString() : null,
      return_condition: returned ? 'buna' : null, notes: '',
      created_at: d.toISOString(), updated_at: d.toISOString(),
    });
    inserted++;
  }
}

async function seedTransfers() {
  const statuses = ['pending', 'approved', 'completed'];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 20));
    await insert('transfer_orders', {
      id: uuid(), created_by: ADMIN_ID, division: 'Arhivă',
      department: 'Arhiva Centrală', geographic_zone: 'București',
      address: 'Str. Arhivelor nr. 1', transport_method: 'Curier',
      organization_type: 'Instituție publică', quantity: 10 + Math.floor(Math.random() * 50),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: 'Transfer ordonat pentru demonstrație',
      assigned_to: ADMIN_ID, created_at: d.toISOString(), updated_at: d.toISOString(),
    });
    inserted++;
  }
}

async function seedWithdrawals() {
  const statuses = ['pending', 'approved', 'completed'];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 20));
    await insert('withdrawal_orders', {
      id: uuid(), created_by: ADMIN_ID, division: 'Arhivă',
      department: 'Arhiva Centrală', geographic_zone: 'București',
      delivery_address: 'Str. Arhivelor nr. 1', transport_method: 'Curier',
      archival_unit_number: `AU-${1000 + i}`, urgency: ['normal', 'urgent'][Math.floor(Math.random() * 2)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: 'Retragere pentru consultare', assigned_to: ADMIN_ID,
      created_at: d.toISOString(), updated_at: d.toISOString(),
    });
    inserted++;
  }
}

async function seedEvidenceRegistry() {
  const ops = ['intrare', 'iesire', 'returnare', 'consultare'];
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 15));
    await insert('evidence_registry', {
      id: uuid(), user_id: ADMIN_ID, operation: ops[Math.floor(Math.random() * ops.length)],
      fund_name: 'Fondul Administrativ', file_name: `Dosar ${i + 1}`,
      document_code: `DOC-2026-${String(i + 1).padStart(3, '0')}`,
      division: 'Arhivă', department: 'Arhiva Centrală', geographic_zone: 'București',
      previous_status: 'available', new_status: 'borrowed', notes: '',
      created_at: d.toISOString(),
    });
    inserted++;
  }
}

async function seedInventory() {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  await insert('inventory_sessions', {
    id: uuid(), name: 'Inventariere anuală 2026', status: 'in_progress',
    started_at: d.toISOString(), created_by: ADMIN_ID, notes: 'Inventariere demonstrativă',
    created_at: d.toISOString(), updated_at: d.toISOString(),
  });
  inserted++;
}

async function seedAudit() {
  const actions = ['documents.create', 'documents.update', 'requests.create', 'users.update', 'loans.create', 'transfers.create'];
  for (let i = 0; i < 20; i++) {
    const d = new Date();
    d.setHours(d.getHours() - Math.floor(Math.random() * 72));
    await insert('audit_logs', {
      id: uuid(), user_id: ADMIN_ID, action: actions[Math.floor(Math.random() * actions.length)],
      entity_type: 'document', entity_id: null, old_values: null, new_values: '{}',
      ip_address: '192.168.1.1', user_agent: 'Mozilla/5.0 (Demo)',
      created_at: d.toISOString(),
    });
    inserted++;
  }
}

async function seedNotifications() {
  const msgs = [
    'Bine ați venit în platforma ArcDoc Enterprise',
    'Solicitarea dumneavoastră a fost aprobată',
    'Un document a fost returnat în arhivă',
    'Aveți o nouă solicitare de consultare',
    'Inventarierea anuală a început',
  ];
  for (const msg of msgs) {
    await insert('notifications', {
      id: uuid(), user_id: ADMIN_ID, title: 'Notificare ArcDoc', body: msg,
      type: 'info', is_read: Math.random() > 0.5 ? 1 : 0,
      created_at: NOW(),
    });
    inserted++;
  }
}

const CLEAR_ORDER = [
  // Operational data (safe to wipe on reseed)
  'audit_logs', 'request_timeline', 'request_documents', 'request_messages', 'request_attachments',
  'requests', 'document_loans', 'document_waitlist', 'document_favorites', 'document_comments',
  'document_relations', 'document_tags', 'document_attachments', 'documents', 'verifications',
  'generated_labels', 'generated_documents', 'signature_requests', 'ocr_jobs',
  'inventory_items', 'inventory_sessions', 'disposal_proposals', 'evidence_registry',
  'transfer_order_items', 'transfer_orders', 'withdrawal_orders', 'location_history',
  'document_series', 'archive_classification', 'archival_funds', 'retention_periods',
  'document_types', 'nomenclatures', 'archive_locations', 'locations', 'positions',
  'organizational_structure', 'automation_rules', 'report_definitions', 'document_templates',
  'email_templates', 'communication_history', 'notifications', 'scheduled_jobs', 'process_verbals',
  // NOTE: users, roles, permissions, companies and other auth/RBAC tables are deliberately
  // NOT cleared here — they are seeded by scripts/seed.ts (admin, roles, permissions).
  // Wiping them would break login. Only operational data above is re-seeded.
];


async function clearDatabase(c: any) {
  console.warn('🧹 Clearing existing data...');
  for (const t of CLEAR_ORDER) {
    try {
      await c.execute(`DELETE FROM ${t}`);
    } catch {
      // table may not exist — ignore
    }
  }
  // Reset auto-increment sequences if any (SQLite AUTOINCREMENT)
  try { await c.execute(`DELETE FROM sqlite_sequence WHERE name IN (${CLEAR_ORDER.map(() => '?').join(',')})`, CLEAR_ORDER.map(t => t) as any); } catch { /* ignore */ }
  console.warn('✅ Database cleared.');
}

async function main() {
  console.warn('🌱 ArcDoc Full Seed — starting...');

  // Create tables first
  const { execSync } = await import('node:child_process');
  try { execSync('npx tsx scripts/create-all-tables.ts', { stdio: 'inherit' }); }
  catch { /* tables may already exist */ }

  await clearDatabase(c);

  await seedDepartments();

  await seedPositions();
  await seedLocations();
  await seedArchiveLocations();
  await seedDocumentTypes();
  await seedNomenclatures();
  await seedRetentionPeriods();
  const fundIds = await seedFunds();
  await seedSeries(fundIds);
  await seedClassification();
  await seedDocuments(fundIds);
  await seedRequests();
  await seedLoans();
  await seedTransfers();
  await seedWithdrawals();
  await seedEvidenceRegistry();
  await seedInventory();
  await seedAudit();
  await seedNotifications();

  console.warn(`✅ Full seed complete! Inserted ${inserted} records.`);
  console.warn('Login: admin@arcdoc.ro / Admin123!');
}

main().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
