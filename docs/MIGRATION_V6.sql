-- ============================================
-- ArcDoc Enterprise - Etapa 6 Migration
-- ============================================

-- Enhance requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS number VARCHAR(50);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES organizational_structure(id);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(30) DEFAULT 'portal';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS download_limit INT DEFAULT 3;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS download_expiry TIMESTAMP;

-- Request messages (communication history)
CREATE TABLE IF NOT EXISTS request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rm_request ON request_messages(request_id);

-- Request attachments (justificative documents)
CREATE TABLE IF NOT EXISTS request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ra_request ON request_attachments(request_id);

-- Request timeline
CREATE TABLE IF NOT EXISTS request_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rtl_request ON request_timeline(request_id);

-- Request documents (many-to-many)
CREATE TABLE IF NOT EXISTS request_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(request_id, document_id)
);
CREATE INDEX IF NOT EXISTS idx_rd_request ON request_documents(request_id);

-- Notifications (ensure table exists with proper structure)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add permissions
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000000-0000-0000-0000-000000000060', 'Solicitări - Atribuire', 'requests.assign', 'requests'),
  ('20000000-0000-0000-0000-000000000061', 'Solicitări - Mesaje', 'requests.message', 'requests'),
  ('20000000-0000-0000-0000-000000000062', 'Solicitări - Trimitere Documente', 'requests.send', 'requests')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions WHERE module = 'requests'
ON CONFLICT DO NOTHING;

-- Seed request type nomenclatures
INSERT INTO nomenclatures (category, name, code, sort_order) VALUES
  ('request_type', 'Eliberare copie', 'copy', 1),
  ('request_type', 'Consultare document', 'consultation', 2),
  ('request_type', 'Împrumut document', 'loan', 3),
  ('request_type', 'Certificat', 'certificate', 4),
  ('request_type', 'Adeverință', 'adeverinta', 5),
  ('request_type', 'Extras', 'extras', 6)
ON CONFLICT DO NOTHING;