import { createClient } from '@libsql/client/web';
import 'dotenv/config';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

if (!TURSO_DATABASE_URL) {
  console.error('ERROR: TURSO_DATABASE_URL (or DATABASE_URL) environment variable is required.');
  console.error('Set it in your .env file or pass it as an environment variable.');
  process.exit(1);
}

const c = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Minimal schemas without DEFAULT datetime() - app handles timestamps
const tables: Record<string, string> = {
  organizational_structure: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT, parent_id TEXT, level INTEGER, sort_order INTEGER, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  positions: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT, description TEXT, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  locations: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT, location_type TEXT, parent_id TEXT, address TEXT, city TEXT, county TEXT, postal_code TEXT, level INTEGER, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  archive_locations: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT, location_type TEXT, parent_id TEXT, level INTEGER, sort_order INTEGER, capacity INTEGER, status TEXT, observations TEXT, metadata TEXT, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  document_types: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT, description TEXT, retention_period TEXT, is_active INTEGER, sort_order INTEGER, created_at TEXT, updated_at TEXT`,
  nomenclatures: `id TEXT PRIMARY KEY, company_id TEXT, category TEXT NOT NULL, name TEXT NOT NULL, code TEXT, description TEXT, is_active INTEGER, sort_order INTEGER, metadata TEXT, created_at TEXT, updated_at TEXT`,
  archival_funds: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, description TEXT, start_year INTEGER, end_year INTEGER, creator TEXT, parent_id TEXT, department_id TEXT, status TEXT, observations TEXT, is_active INTEGER, metadata TEXT, created_at TEXT, updated_at TEXT`,
  document_series: `id TEXT PRIMARY KEY, fund_id TEXT, parent_id TEXT, name TEXT NOT NULL, code TEXT NOT NULL, description TEXT, retention_period_id TEXT, confidentiality_level TEXT, sort_order INTEGER, is_active INTEGER, observations TEXT, created_at TEXT, updated_at TEXT, UNIQUE(fund_id,code)`,
  archive_classification: `id TEXT PRIMARY KEY, company_id TEXT, parent_id TEXT, name TEXT NOT NULL, code TEXT NOT NULL, description TEXT, level TEXT, retention_period_id TEXT, retention_type TEXT, is_active INTEGER, sort_order INTEGER, observations TEXT, created_at TEXT, updated_at TEXT`,
  retention_periods: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, code TEXT NOT NULL, years INTEGER, is_permanent INTEGER, description TEXT, sort_order INTEGER, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  documents: `id TEXT PRIMARY KEY, unit_id TEXT, fund_id TEXT, series_id TEXT, classification_id TEXT, department_id TEXT, created_by TEXT, responsible_id TEXT, title TEXT NOT NULL, code TEXT, number TEXT, document_type TEXT, description TEXT, category TEXT, subcategory TEXT, pages INTEGER, language TEXT, format TEXT, file_url TEXT, file_size INTEGER, checksum TEXT, access_level TEXT, status TEXT, issue_date TEXT, registration_date TEXT, expiry_date TEXT, retention_period_id TEXT, confidentiality_level TEXT, observations TEXT, custom_fields TEXT, archive_location_id TEXT, barcode TEXT, qr_code TEXT, ocr_text TEXT, ocr_status TEXT, metadata TEXT, created_at TEXT, updated_at TEXT`,
  document_attachments: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, file_name TEXT NOT NULL, file_url TEXT NOT NULL, file_size INTEGER, mime_type TEXT, checksum TEXT, is_primary INTEGER, sort_order INTEGER, uploaded_by TEXT, created_at TEXT`,
  document_tags: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, tag TEXT NOT NULL, created_at TEXT`,
  document_relations: `id TEXT PRIMARY KEY, source_id TEXT NOT NULL, target_id TEXT NOT NULL, relation_type TEXT, created_at TEXT, UNIQUE(source_id,target_id)`,
  document_comments: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT NOT NULL, parent_id TEXT, created_at TEXT, updated_at TEXT`,
  document_favorites: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT, UNIQUE(document_id,user_id)`,
  request_messages: `id TEXT PRIMARY KEY, request_id TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT`,
  request_attachments: `id TEXT PRIMARY KEY, request_id TEXT NOT NULL, file_name TEXT NOT NULL, file_url TEXT NOT NULL, file_size INTEGER, mime_type TEXT, uploaded_by TEXT, created_at TEXT`,
  request_timeline: `id TEXT PRIMARY KEY, request_id TEXT NOT NULL, action TEXT NOT NULL, description TEXT, user_id TEXT, metadata TEXT, created_at TEXT`,
  request_documents: `id TEXT PRIMARY KEY, request_id TEXT NOT NULL, document_id TEXT NOT NULL, added_at TEXT, UNIQUE(request_id,document_id)`,
  requests: `id TEXT PRIMARY KEY, user_id TEXT NOT NULL, number TEXT, request_type TEXT NOT NULL, status TEXT, motivation TEXT, priority TEXT, department_id TEXT, assigned_to TEXT, assigned_at TEXT, approved_by TEXT, approved_at TEXT, rejected_by TEXT, rejected_at TEXT, rejection_reason TEXT, completed_at TEXT, deadline TEXT, notes TEXT, delivery_method TEXT, download_limit INTEGER, download_count INTEGER, download_expiry TEXT, metadata TEXT, created_at TEXT, updated_at TEXT`,
  location_history: `id TEXT PRIMARY KEY, document_id TEXT, from_location_id TEXT, to_location_id TEXT NOT NULL, moved_by TEXT, movement_type TEXT, reason TEXT, notes TEXT, created_at TEXT`,
  document_loans: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, user_id TEXT NOT NULL, requested_by TEXT, approved_by TEXT, status TEXT, loan_date TEXT, due_date TEXT, extended_count INTEGER, returned_at TEXT, return_condition TEXT, return_notes TEXT, notes TEXT, created_at TEXT, updated_at TEXT`,
  document_waitlist: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, user_id TEXT NOT NULL, notified INTEGER, created_at TEXT, UNIQUE(document_id,user_id)`,
  inventory_sessions: `id TEXT PRIMARY KEY, name TEXT NOT NULL, location_id TEXT, fund_id TEXT, department_id TEXT, status TEXT, started_at TEXT, completed_at TEXT, created_by TEXT, notes TEXT, created_at TEXT, updated_at TEXT`,
  inventory_items: `id TEXT PRIMARY KEY, session_id TEXT NOT NULL, document_id TEXT, expected_location_id TEXT, found_location_id TEXT, status TEXT, condition TEXT, scanned_code TEXT, verified_by TEXT, verified_at TEXT, notes TEXT, created_at TEXT`,
  disposal_proposals: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, reason TEXT NOT NULL, proposed_by TEXT, approved_by TEXT, status TEXT, process_number TEXT, proposed_at TEXT, approved_at TEXT, eliminated_at TEXT, notes TEXT, created_at TEXT, updated_at TEXT`,
  generated_labels: `id TEXT PRIMARY KEY, label_type TEXT NOT NULL, reference_type TEXT NOT NULL, reference_id TEXT NOT NULL, qr_code TEXT, barcode TEXT, content TEXT, generated_by TEXT, created_at TEXT`,
  ocr_jobs: `id TEXT PRIMARY KEY, document_id TEXT NOT NULL, attachment_id TEXT, status TEXT, result_text TEXT, error_message TEXT, started_at TEXT, completed_at TEXT, created_at TEXT`,
  audit_logs: `id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, old_values TEXT, new_values TEXT, ip_address TEXT, user_agent TEXT, created_at TEXT`,
  notifications: `id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, type TEXT, is_read INTEGER, read_at TEXT, link TEXT, metadata TEXT, created_at TEXT`,
  email_templates: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, subject TEXT NOT NULL, body_html TEXT NOT NULL, body_text TEXT, variables TEXT, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  communication_history: `id TEXT PRIMARY KEY, company_id TEXT, from_address TEXT NOT NULL, to_address TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT, initiated_by TEXT, reference_type TEXT, reference_id TEXT, sent_at TEXT, error_message TEXT, metadata TEXT`,
  document_templates: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, template_type TEXT, content TEXT, variables TEXT, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  report_definitions: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, type TEXT NOT NULL, config TEXT, is_active INTEGER, created_at TEXT, updated_at TEXT`,
  automation_rules: `id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, description TEXT, trigger_type TEXT NOT NULL, trigger_config TEXT, action_type TEXT NOT NULL, action_config TEXT, is_active INTEGER, last_run_at TEXT, created_at TEXT, updated_at TEXT`,
  signature_requests: `id TEXT PRIMARY KEY, document_id TEXT, requested_by TEXT, signer_name TEXT, signer_email TEXT, status TEXT, provider TEXT, external_id TEXT, signed_at TEXT, metadata TEXT, created_at TEXT, updated_at TEXT`,
  scheduled_jobs: `id TEXT PRIMARY KEY, name TEXT NOT NULL, job_type TEXT NOT NULL, config TEXT, cron_expression TEXT, is_active INTEGER, last_run_at TEXT, next_run_at TEXT, created_at TEXT, updated_at TEXT`,
  generated_documents: `id TEXT PRIMARY KEY, template_id TEXT, generated_by TEXT, file_url TEXT, file_name TEXT, metadata TEXT, created_at TEXT`,
  licenses: `id TEXT PRIMARY KEY, company_id TEXT NOT NULL, type TEXT, status TEXT, max_users INTEGER, max_documents INTEGER, max_storage_mb INTEGER, features TEXT, started_at TEXT, expires_at TEXT, created_at TEXT, updated_at TEXT`,
  subscriptions: `id TEXT PRIMARY KEY, company_id TEXT NOT NULL, plan TEXT, status TEXT, started_at TEXT, next_billing_at TEXT, cancelled_at TEXT, metadata TEXT, created_at TEXT`,
  transfer_orders: `id TEXT PRIMARY KEY, created_by TEXT, division TEXT, department TEXT, geographic_zone TEXT, address TEXT, transport_method TEXT, organization_type TEXT, quantity INTEGER, status TEXT, notes TEXT, assigned_to TEXT, created_at TEXT, updated_at TEXT`,
  transfer_order_items: `id TEXT PRIMARY KEY, order_id TEXT NOT NULL, archival_unit_code TEXT, description TEXT, quantity INTEGER, created_at TEXT`,
  withdrawal_orders: `id TEXT PRIMARY KEY, created_by TEXT, division TEXT, department TEXT, geographic_zone TEXT, delivery_address TEXT, transport_method TEXT, archival_unit_number TEXT, urgency TEXT, status TEXT, notes TEXT, assigned_to TEXT, created_at TEXT, updated_at TEXT`,
  evidence_registry: `id TEXT PRIMARY KEY, user_id TEXT, operation TEXT NOT NULL, fund_name TEXT, file_name TEXT, document_code TEXT, entry_type TEXT, exit_type TEXT, return_type TEXT, permanent_withdrawal INTEGER, previous_status TEXT, new_status TEXT, division TEXT, department TEXT, geographic_zone TEXT, notes TEXT, created_at TEXT`,
  process_verbals: `id TEXT PRIMARY KEY, type TEXT NOT NULL, reference_type TEXT, reference_id TEXT, content TEXT NOT NULL, generated_by TEXT, created_at TEXT`,
  verifications: `id TEXT PRIMARY KEY, document_id TEXT, code TEXT NOT NULL, valid INTEGER, created_at TEXT`,
};


async function main() {
  let ok = 0, err = 0;
  for (const [name, cols] of Object.entries(tables)) {
    try {
      await c.execute(`CREATE TABLE IF NOT EXISTS ${name}(${cols})`);
      ok++;
    } catch (e: any) {
      console.error(`FAILED: ${name}:`, e.message);
      err++;
    }
  }
  console.log(`Done: ${ok} tables created, ${err} errors`);
}

main();