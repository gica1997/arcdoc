-- ============================================
-- ArcDoc Enterprise - Etapa 3 Migration
-- ============================================

-- Departamente (ierarhice)
CREATE TABLE IF NOT EXISTS organizational_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  parent_id UUID REFERENCES organizational_structure(id),
  level INT NOT NULL DEFAULT 1,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_parent ON organizational_structure(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_company ON organizational_structure(company_id);

-- Funcții / Poziții
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_company ON positions(company_id);

-- Asociere utilizatori cu structura organizatorică
CREATE TABLE IF NOT EXISTS employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organizational_unit_id UUID REFERENCES organizational_structure(id),
  position_id UUID REFERENCES positions(id),
  manager_id UUID REFERENCES users(id),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_user ON employee_assignments(user_id);

-- Locații (sedii, clădiri, etaje, camere)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  location_type VARCHAR(50) NOT NULL DEFAULT 'building',
  parent_id UUID REFERENCES locations(id),
  address TEXT,
  city VARCHAR(100),
  county VARCHAR(100),
  postal_code VARCHAR(20),
  level INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_company ON locations(company_id);

-- Structura arhivei (depozite, camere, rafturi, polițe, cutii)
CREATE TABLE IF NOT EXISTS archive_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  location_type VARCHAR(50) DEFAULT 'room',
  parent_id UUID REFERENCES archive_locations(id),
  level INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arch_loc_company ON archive_locations(company_id);

-- Tipuri de documente (nomenclator)
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  retention_period VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctypes_company ON document_types(company_id);

-- Nomenclatoare generice (key-value lists)
CREATE TABLE IF NOT EXISTS nomenclatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nom_category ON nomenclatures(company_id, category);

-- Adaugă coloane noi la companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reg_com VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS county VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_position VARCHAR(255);

-- Seed nomenclatures
INSERT INTO nomenclatures (category, name, code, description, sort_order) VALUES
  ('request_type', 'Consultare', 'consultation', 'Consultare documente în sala de studiu', 1),
  ('request_type', 'Copie', 'copy', 'Obținere copii documente', 2),
  ('request_type', 'Eliminare', 'elimination', 'Solicitare eliminare document', 3),
  ('document_status', 'Disponibil', 'available', 'Documentul este disponibil', 1),
  ('document_status', 'Împrumutat', 'borrowed', 'Documentul este împrumutat', 2),
  ('document_status', 'Eliminat', 'eliminated', 'Documentul a fost eliminat', 3),
  ('confidentiality', 'Public', 'public', 'Acces public', 1),
  ('confidentiality', 'Restricționat', 'restricted', 'Acces restricționat', 2),
  ('confidentiality', 'Confidențial', 'confidential', 'Acces confidențial', 3),
  ('document_format', 'Fizic', 'physical', 'Document pe suport fizic', 1),
  ('document_format', 'Digital', 'digital', 'Document digital', 2)
ON CONFLICT DO NOTHING;