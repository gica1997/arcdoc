-- ============================================
-- ArcDoc Enterprise - Etapa 9 Migration
-- ============================================

-- Authorized persons extended
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS service TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS geographic_zone TEXT;

-- Transfer orders (preluare documente)
CREATE TABLE IF NOT EXISTS transfer_orders (
  id TEXT PRIMARY KEY,
  created_by TEXT REFERENCES users(id),
  division TEXT,
  department TEXT,
  geographic_zone TEXT,
  address TEXT,
  transport_method TEXT,
  organization_type TEXT,
  quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  assigned_to TEXT REFERENCES users(id),
  created_at TEXT DEFAULT(datetime('now')),
  updated_at TEXT DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_to_status ON transfer_orders(status);

-- Transfer order items (unități arhivistice în comandă)
CREATE TABLE IF NOT EXISTS transfer_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  archival_unit_code TEXT,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT(datetime('now'))
);

-- Withdrawal orders (retragere pentru consultare)
CREATE TABLE IF NOT EXISTS withdrawal_orders (
  id TEXT PRIMARY KEY,
  created_by TEXT REFERENCES users(id),
  division TEXT,
  department TEXT,
  geographic_zone TEXT,
  delivery_address TEXT,
  transport_method TEXT,
  archival_unit_number TEXT,
  urgency TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  assigned_to TEXT REFERENCES users(id),
  created_at TEXT DEFAULT(datetime('now')),
  updated_at TEXT DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wo_status ON withdrawal_orders(status);

-- Registry of evidence (registrul de evidență)
CREATE TABLE IF NOT EXISTS evidence_registry (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  operation TEXT NOT NULL,
  fund_name TEXT,
  file_name TEXT,
  document_code TEXT,
  entry_type TEXT,
  exit_type TEXT,
  return_type TEXT,
  permanent_withdrawal INTEGER DEFAULT 0,
  previous_status TEXT,
  new_status TEXT,
  division TEXT,
  department TEXT,
  geographic_zone TEXT,
  notes TEXT,
  created_at TEXT DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_er_date ON evidence_registry(created_at);
CREATE INDEX IF NOT EXISTS idx_er_operation ON evidence_registry(operation);

-- Process-verbal templates
CREATE TABLE IF NOT EXISTS process_verbals (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  content TEXT NOT NULL,
  generated_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT(datetime('now'))
);

-- Add permissions
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000100','Transfer - Vizualizare','transfer.view','transfer'),
  ('20000101','Transfer - Creare','transfer.create','transfer'),
  ('20000102','Transfer - Aprobare','transfer.approve','transfer'),
  ('20000103','Retragere - Vizualizare','withdrawal.view','withdrawal'),
  ('20000104','Retragere - Creare','withdrawal.create','withdrawal'),
  ('20000105','Retragere - Aprobare','withdrawal.approve','withdrawal'),
  ('20000106','Registru Evidență - Vizualizare','evidence.view','evidence'),
  ('20000107','Procese Verbale - Generare','process_verbal.generate','process_verbal')
ON CONFLICT (slug) DO NOTHING;

INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT 'rp-new-' || p.id, '10000000-0000-0000-0000-000000000001', p.id
FROM permissions p WHERE p.slug IN ('transfer.view','transfer.create','transfer.approve','withdrawal.view','withdrawal.create','withdrawal.approve','evidence.view','process_verbal.generate');