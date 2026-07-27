-- ============================================
-- ArcDoc Enterprise - Etapa 8 Migration
-- ============================================

-- Physical file location history (tracks all movements)
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES archive_locations(id),
  to_location_id UUID REFERENCES archive_locations(id) NOT NULL,
  moved_by UUID REFERENCES users(id),
  movement_type VARCHAR(30) DEFAULT 'move',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lh_document ON location_history(document_id);

-- Loans
CREATE TABLE IF NOT EXISTS document_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'requested',
  loan_date TIMESTAMP,
  due_date TIMESTAMP,
  extended_count INT DEFAULT 0,
  returned_at TIMESTAMP,
  return_condition VARCHAR(50),
  return_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dl_document ON document_loans(document_id);
CREATE INDEX IF NOT EXISTS idx_dl_user ON document_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_dl_status ON document_loans(status);

-- Waitlist for unavailable documents
CREATE TABLE IF NOT EXISTS document_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Inventory sessions
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location_id UUID REFERENCES archive_locations(id),
  fund_id UUID REFERENCES archival_funds(id),
  department_id UUID REFERENCES organizational_structure(id),
  status VARCHAR(30) DEFAULT 'draft',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  expected_location_id UUID REFERENCES archive_locations(id),
  found_location_id UUID REFERENCES archive_locations(id),
  status VARCHAR(30) DEFAULT 'pending',
  condition VARCHAR(50),
  scanned_code VARCHAR(100),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ii_session ON inventory_items(session_id);

-- Disposal proposals
CREATE TABLE IF NOT EXISTS disposal_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  proposed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'draft',
  process_number VARCHAR(50),
  proposed_at TIMESTAMP,
  approved_at TIMESTAMP,
  eliminated_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dp_document ON disposal_proposals(document_id);

-- Labels generated
CREATE TABLE IF NOT EXISTS generated_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  qr_code TEXT,
  barcode VARCHAR(100),
  content JSONB DEFAULT '{}',
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add permissions
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000000-0000-0000-0000-000000000072', 'Dosare Fizice - Vizualizare', 'physical_files.view', 'physical_files'),
  ('20000000-0000-0000-0000-000000000073', 'Dosare Fizice - Mutare', 'physical_files.move', 'physical_files'),
  ('20000000-0000-0000-0000-000000000074', 'Împrumuturi - Vizualizare', 'loans.view', 'loans'),
  ('20000000-0000-0000-0000-000000000075', 'Împrumuturi - Gestionare', 'loans.manage', 'loans'),
  ('20000000-0000-0000-0000-000000000076', 'Inventariere - Vizualizare', 'inventory.view', 'inventory'),
  ('20000000-0000-0000-0000-000000000077', 'Inventariere - Gestionare', 'inventory.manage', 'inventory'),
  ('20000000-0000-0000-0000-000000000078', 'Casare - Vizualizare', 'disposal.view', 'disposal'),
  ('20000000-0000-0000-0000-000000000079', 'Casare - Gestionare', 'disposal.manage', 'disposal'),
  ('20000000-0000-0000-0000-000000000080', 'Etichete - Generare', 'labels.generate', 'labels')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions WHERE module IN ('physical_files','loans','inventory','disposal','labels')
ON CONFLICT DO NOTHING;