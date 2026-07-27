-- ============================================
-- ArcDoc Enterprise - Etapa 5 Migration
-- ============================================

-- Enhance documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS number VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS fund_id UUID REFERENCES archival_funds(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES document_series(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classification_id UUID REFERENCES archive_classification(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES organizational_structure(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_period_id UUID REFERENCES retention_periods(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidentiality_level VARCHAR(30) DEFAULT 'public';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archive_location_id UUID REFERENCES archive_locations(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Document attachments (files)
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  checksum VARCHAR(64),
  is_primary BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_da_document ON document_attachments(document_id);

-- Document tags
CREATE TABLE IF NOT EXISTS document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dt_tag ON document_tags(tag);
CREATE INDEX IF NOT EXISTS idx_dt_document ON document_tags(document_id);

-- Document relations (linked documents)
CREATE TABLE IF NOT EXISTS document_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) DEFAULT 'related',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_dr_source ON document_relations(source_id);

-- Document comments
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES document_comments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dc_document ON document_comments(document_id);

-- Document favorites
CREATE TABLE IF NOT EXISTS document_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Document OCR jobs
CREATE TABLE IF NOT EXISTS ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attachment_id UUID REFERENCES document_attachments(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  result_text TEXT,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add permissions for documents module
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000000-0000-0000-0000-000000000056', 'Documente - Încărcare Fișiere', 'documents.upload', 'documents'),
  ('20000000-0000-0000-0000-000000000057', 'Documente - Versiuni', 'documents.version', 'documents'),
  ('20000000-0000-0000-0000-000000000058', 'Documente - OCR', 'documents.ocr', 'documents'),
  ('20000000-0000-0000-0000-000000000059', 'Documente - Comentarii', 'documents.comment', 'documents')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions WHERE module = 'documents'
ON CONFLICT DO NOTHING;