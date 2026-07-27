-- ============================================
-- ArcDoc Enterprise - Etapa 7 Migration
-- ============================================

-- Document templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  template_type VARCHAR(30) NOT NULL DEFAULT 'pdf',
  content TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dt_slug ON document_templates(slug);

-- Report definitions
CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  action_type VARCHAR(50) NOT NULL,
  action_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Signature requests
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  requested_by UUID REFERENCES users(id),
  signer_name VARCHAR(255),
  signer_email VARCHAR(255),
  status VARCHAR(30) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'digisign',
  external_id VARCHAR(255),
  signed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sr_document ON signature_requests(document_id);

-- Generated documents history
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id),
  generated_by UUID REFERENCES users(id),
  file_url TEXT,
  file_name VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  config JSONB DEFAULT '{}',
  cron_expression VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add permissions
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000000-0000-0000-0000-000000000063', 'Șabloane - Vizualizare', 'templates.view', 'templates'),
  ('20000000-0000-0000-0000-000000000064', 'Șabloane - Creare', 'templates.create', 'templates'),
  ('20000000-0000-0000-0000-000000000065', 'Șabloane - Editare', 'templates.update', 'templates'),
  ('20000000-0000-0000-0000-000000000066', 'Rapoarte - Generare', 'reports.generate', 'reports'),
  ('20000000-0000-0000-0000-000000000067', 'Automatizări - Vizualizare', 'automation.view', 'automation'),
  ('20000000-0000-0000-0000-000000000068', 'Automatizări - Creare', 'automation.create', 'automation'),
  ('20000000-0000-0000-0000-000000000069', 'Semnătură - Inițiere', 'signature.initiate', 'signature'),
  ('20000000-0000-0000-0000-000000000070', 'Export - Documente', 'export.documents', 'export'),
  ('20000000-0000-0000-0000-000000000071', 'Export - Rapoarte', 'export.reports', 'export')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions WHERE module IN ('templates','reports','automation','signature','export')
ON CONFLICT DO NOTHING;