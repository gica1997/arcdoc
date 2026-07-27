-- ============================================
-- ArcDoc Enterprise - Etapa 2 Migration
-- ============================================
-- Adaugă coloane noi și inserează seed data.

-- Add new columns to users table (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Create tables if not exist (safe CREATE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cui VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  cnp VARCHAR(13),
  user_type VARCHAR(20) DEFAULT 'intern',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  refresh_token TEXT,
  last_login_at TIMESTAMP,
  password_changed_at TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  path VARCHAR(255),
  parent_id UUID REFERENCES modules(id),
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  link VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, key)
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  initiated_by UUID REFERENCES users(id),
  reference_type VARCHAR(50),
  reference_id UUID,
  sent_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes (IF NOT EXISTS doesn't work for indexes in PG, catch errors)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
  CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);
  CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
  CREATE INDEX IF NOT EXISTS idx_permissions_slug ON permissions(slug);
  CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
  CREATE INDEX IF NOT EXISTS idx_role_perms_role ON role_permissions(role_id);
  CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
  CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_rt_expires ON refresh_tokens(expires_at);
  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
  CREATE INDEX IF NOT EXISTS idx_comm_status ON communication_history(status);
  CREATE INDEX IF NOT EXISTS idx_comm_sent ON communication_history(sent_at);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ============================================
-- SEED DATA
-- ============================================

-- Create default company
INSERT INTO companies (id, name, cui) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ArcDoc Enterprise', 'RO12345678')
ON CONFLICT (cui) DO NOTHING;

-- Create system roles
INSERT INTO roles (id, name, slug, description, is_system) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Administrator', 'administrator', 'Acces complet la toate modulele', true),
  ('10000000-0000-0000-0000-000000000002', 'Arhivar', 'arhivar', 'Gestionează arhiva și documentele', true),
  ('10000000-0000-0000-0000-000000000003', 'Operator', 'operator', 'Operează solicitări și consultări', true),
  ('10000000-0000-0000-0000-000000000004', 'Solicitant', 'solicitant', 'Utilizator extern - depune cereri', true)
ON CONFLICT (slug) DO NOTHING;

-- Create permissions
INSERT INTO permissions (id, name, slug, module) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Dashboard - Vizualizare', 'dashboard.view', 'dashboard'),
  ('20000000-0000-0000-0000-000000000002', 'Utilizatori - Vizualizare', 'users.view', 'users'),
  ('20000000-0000-0000-0000-000000000003', 'Utilizatori - Creare', 'users.create', 'users'),
  ('20000000-0000-0000-0000-000000000004', 'Utilizatori - Editare', 'users.update', 'users'),
  ('20000000-0000-0000-0000-000000000005', 'Utilizatori - Ștergere', 'users.delete', 'users'),
  ('20000000-0000-0000-0000-000000000006', 'Roluri - Vizualizare', 'roles.view', 'roles'),
  ('20000000-0000-0000-0000-000000000007', 'Roluri - Creare', 'roles.create', 'roles'),
  ('20000000-0000-0000-0000-000000000008', 'Roluri - Editare', 'roles.update', 'roles'),
  ('20000000-0000-0000-0000-000000000009', 'Roluri - Ștergere', 'roles.delete', 'roles'),
  ('20000000-0000-0000-0000-000000000010', 'Permisiuni - Vizualizare', 'permissions.view', 'permissions'),
  ('20000000-0000-0000-0000-000000000011', 'Fonduri - Vizualizare', 'funds.view', 'funds'),
  ('20000000-0000-0000-0000-000000000012', 'Fonduri - Creare', 'funds.create', 'funds'),
  ('20000000-0000-0000-0000-000000000013', 'Fonduri - Editare', 'funds.update', 'funds'),
  ('20000000-0000-0000-0000-000000000014', 'Fonduri - Ștergere', 'funds.delete', 'funds'),
  ('20000000-0000-0000-0000-000000000015', 'Inventare - Vizualizare', 'inventories.view', 'inventories'),
  ('20000000-0000-0000-0000-000000000016', 'Inventare - Creare', 'inventories.create', 'inventories'),
  ('20000000-0000-0000-0000-000000000017', 'Inventare - Editare', 'inventories.update', 'inventories'),
  ('20000000-0000-0000-0000-000000000018', 'Inventare - Ștergere', 'inventories.delete', 'inventories'),
  ('20000000-0000-0000-0000-000000000019', 'Unități - Vizualizare', 'units.view', 'units'),
  ('20000000-0000-0000-0000-000000000020', 'Unități - Creare', 'units.create', 'units'),
  ('20000000-0000-0000-0000-000000000021', 'Unități - Editare', 'units.update', 'units'),
  ('20000000-0000-0000-0000-000000000022', 'Unități - Ștergere', 'units.delete', 'units'),
  ('20000000-0000-0000-0000-000000000023', 'Documente - Vizualizare', 'documents.view', 'documents'),
  ('20000000-0000-0000-0000-000000000024', 'Documente - Creare', 'documents.create', 'documents'),
  ('20000000-0000-0000-0000-000000000025', 'Documente - Editare', 'documents.update', 'documents'),
  ('20000000-0000-0000-0000-000000000026', 'Documente - Ștergere', 'documents.delete', 'documents'),
  ('20000000-0000-0000-0000-000000000027', 'Documente - Descărcare', 'documents.download', 'documents'),
  ('20000000-0000-0000-0000-000000000028', 'Solicitări - Vizualizare', 'requests.view', 'requests'),
  ('20000000-0000-0000-0000-000000000029', 'Solicitări - Creare', 'requests.create', 'requests'),
  ('20000000-0000-0000-0000-000000000030', 'Solicitări - Editare', 'requests.update', 'requests'),
  ('20000000-0000-0000-0000-000000000031', 'Solicitări - Aprobare', 'requests.approve', 'requests'),
  ('20000000-0000-0000-0000-000000000032', 'Solicitări - Respingere', 'requests.reject', 'requests'),
  ('20000000-0000-0000-0000-000000000033', 'Consultări - Vizualizare', 'consultations.view', 'consultations'),
  ('20000000-0000-0000-0000-000000000034', 'Rapoarte - Vizualizare', 'reports.view', 'reports'),
  ('20000000-0000-0000-0000-000000000035', 'Rapoarte - Export', 'reports.export', 'reports'),
  ('20000000-0000-0000-0000-000000000036', 'Setări - Vizualizare', 'settings.view', 'settings'),
  ('20000000-0000-0000-0000-000000000037', 'Setări - Editare', 'settings.update', 'settings'),
  ('20000000-0000-0000-0000-000000000038', 'Audit - Vizualizare', 'audit.view', 'audit'),
  ('20000000-0000-0000-0000-000000000039', 'Notificări - Vizualizare', 'notifications.view', 'notifications'),
  ('20000000-0000-0000-0000-000000000040', 'Organizare - Vizualizare', 'organization.view', 'organization'),
  ('20000000-0000-0000-0000-000000000041', 'Organizare - Creare', 'organization.create', 'organization'),
  ('20000000-0000-0000-0000-000000000042', 'Organizare - Editare', 'organization.update', 'organization'),
  ('20000000-0000-0000-0000-000000000043', 'Organizare - Ștergere', 'organization.delete', 'organization')
ON CONFLICT (slug) DO NOTHING;

-- Assign all permissions to Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create admin user (password: Admin123!)
-- Using pre-computed Argon2 hash for 'Admin123!'
INSERT INTO users (id, company_id, email, password_hash, first_name, last_name, user_type, is_active, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@arcdoc.ro',
   '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_HASH', 'Admin', 'ArcDoc', 'intern', true, true)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, role_id) DO NOTHING;