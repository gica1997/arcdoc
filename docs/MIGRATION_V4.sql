-- ============================================
-- ArcDoc Enterprise - Etapa 4 Migration
-- ============================================

-- Subfonduri (parent_id on archival_funds already exists conceptually)
ALTER TABLE archival_funds ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES archival_funds(id);
ALTER TABLE archival_funds ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES organizational_structure(id);
ALTER TABLE archival_funds ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';
ALTER TABLE archival_funds ADD COLUMN IF NOT EXISTS observations TEXT;

-- Serii documentare
CREATE TABLE IF NOT EXISTS document_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES archival_funds(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES document_series(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  retention_period_id UUID,
  confidentiality_level VARCHAR(30) DEFAULT 'public',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(fund_id, code)
);

CREATE INDEX IF NOT EXISTS idx_ds_fund ON document_series(fund_id);

-- Nomenclator arhivistic (chapters, subchapters, positions)
CREATE TABLE IF NOT EXISTS archive_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  parent_id UUID REFERENCES archive_classification(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  level VARCHAR(20) DEFAULT 'chapter',
  retention_period_id UUID,
  retention_type VARCHAR(30) DEFAULT 'temporary',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ac_parent ON archive_classification(parent_id);
CREATE INDEX IF NOT EXISTS idx_ac_company ON archive_classification(company_id);

-- Termene de păstrare
CREATE TABLE IF NOT EXISTS retention_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  years INT,
  is_permanent BOOLEAN DEFAULT false,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rp_company ON retention_periods(company_id);

-- Enhance archive_locations with more fields
ALTER TABLE archive_locations ADD COLUMN IF NOT EXISTS capacity INT;
ALTER TABLE archive_locations ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';
ALTER TABLE archive_locations ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE archive_locations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Seed retention periods
INSERT INTO retention_periods (id, name, code, years, is_permanent, sort_order) VALUES
  ('50000000-0000-0000-0000-000000000001', '1 an', '1y', 1, false, 1),
  ('50000000-0000-0000-0000-000000000002', '3 ani', '3y', 3, false, 2),
  ('50000000-0000-0000-0000-000000000003', '5 ani', '5y', 5, false, 3),
  ('50000000-0000-0000-0000-000000000004', '10 ani', '10y', 10, false, 4),
  ('50000000-0000-0000-0000-000000000005', '25 ani', '25y', 25, false, 5),
  ('50000000-0000-0000-0000-000000000006', 'Permanent', 'permanent', NULL, true, 6)
ON CONFLICT DO NOTHING;

-- Add permissions for archive modules
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000000-0000-0000-0000-000000000044', 'Fonduri - Export', 'funds.export', 'funds'),
  ('20000000-0000-0000-0000-000000000045', 'Serii Documentare - Vizualizare', 'series.view', 'series'),
  ('20000000-0000-0000-0000-000000000046', 'Serii Documentare - Creare', 'series.create', 'series'),
  ('20000000-0000-0000-0000-000000000047', 'Serii Documentare - Editare', 'series.update', 'series'),
  ('20000000-0000-0000-0000-000000000048', 'Serii Documentare - Ștergere', 'series.delete', 'series'),
  ('20000000-0000-0000-0000-000000000049', 'Nomenclator Arhivistic - Vizualizare', 'classification.view', 'classification'),
  ('20000000-0000-0000-0000-000000000050', 'Nomenclator Arhivistic - Creare', 'classification.create', 'classification'),
  ('20000000-0000-0000-0000-000000000051', 'Nomenclator Arhivistic - Editare', 'classification.update', 'classification'),
  ('20000000-0000-0000-0000-000000000052', 'Termene Păstrare - Vizualizare', 'retention.view', 'retention'),
  ('20000000-0000-0000-0000-000000000053', 'Termene Păstrare - Creare', 'retention.create', 'retention'),
  ('20000000-0000-0000-0000-000000000054', 'Locații Arhivă - Vizualizare', 'archive_locations.view', 'archive_locations'),
  ('20000000-0000-0000-0000-000000000055', 'Locații Arhivă - Creare', 'archive_locations.create', 'archive_locations')
ON CONFLICT (slug) DO NOTHING;

-- Grant new permissions to Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions WHERE slug LIKE 'funds.export' OR slug LIKE 'series.%' OR slug LIKE 'classification.%' OR slug LIKE 'retention.%' OR slug LIKE 'archive_locations.%'
ON CONFLICT DO NOTHING;