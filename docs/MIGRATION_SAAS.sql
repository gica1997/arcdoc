-- ============================================
-- ArcDoc Enterprise - SaaS Complete Migration
-- ============================================

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  max_users INTEGER DEFAULT 10,
  max_documents INTEGER DEFAULT 100,
  max_storage_mb INTEGER DEFAULT 500,
  features TEXT DEFAULT '[]',
  started_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_licenses_company ON licenses(company_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  started_at TEXT DEFAULT (datetime('now')),
  next_billing_at TEXT,
  cancelled_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  number TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'RON',
  status TEXT DEFAULT 'pending',
  issued_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  metric_type TEXT NOT NULL,
  value INTEGER DEFAULT 0,
  recorded_at TEXT DEFAULT (datetime('now'))
);

-- White label
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1a73e8';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS white_label_settings TEXT DEFAULT '{}';

-- Document templates
CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'pdf',
  content TEXT,
  variables TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config TEXT DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  last_run_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Report definitions
CREATE TABLE IF NOT EXISTS report_definitions (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Signature requests
CREATE TABLE IF NOT EXISTS signature_requests (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id),
  requested_by TEXT REFERENCES users(id),
  signer_name TEXT,
  signer_email TEXT,
  status TEXT DEFAULT 'pending',
  provider TEXT DEFAULT 'digisign',
  external_id TEXT,
  signed_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Scheduled jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  cron_expression TEXT,
  is_active INTEGER DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);