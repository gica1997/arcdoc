# ArcDoc Enterprise - Database Schema

## Overview

ArcDoc Enterprise uses **PostgreSQL** as the primary database. The schema is designed for managing physical and digital archives, supporting both internal users (admins, archivists, operators) and external users (individuals, legal entities, institutions).

---

## Entity Relationship Summary

```
companies (1) ──────< users (N)
users (N) >────────── roles (N)        [via user_roles]
roles (N) >────────── permissions (N)   [via role_permissions]
permissions (N) >──── modules (N)       [via permission_modules]
users (1) ──────< requests (N)
requests (N) >────── documents (N)      [via request_documents]
archival_funds (1) ─< inventories (N)
inventories (1) ────< archival_units (N)
archival_units (1) ─< documents (N)
documents (1) ──────< document_versions (N)
organizational_structure (hierarchical)
users (1) ──────< audit_logs (N)
users (1) ──────< notifications (N)
requests (1) ──────< communication_history (N)
```

---

## Tables

### 1. `companies`
Stores multi-tenant company information for enterprise scalability.

| Column        | Type         | Constraints        | Description                    |
|---------------|-------------|---------------------|--------------------------------|
| id            | UUID        | PK, NOT NULL        | Unique identifier              |
| name          | VARCHAR(255)| NOT NULL            | Company name                   |
| cui           | VARCHAR(20) | UNIQUE, NOT NULL    | Company tax ID (Romanian CUI)  |
| address       | TEXT        | NULL                | Physical address               |
| phone         | VARCHAR(50) | NULL                | Contact phone                  |
| email         | VARCHAR(255)| NULL                | Contact email                  |
| logo_url      | TEXT        | NULL                | Company logo URL               |
| is_active     | BOOLEAN     | NOT NULL, DEFAULT true | Active status               |
| settings      | JSONB       | DEFAULT '{}'       | Flexible company settings      |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() | Creation timestamp        |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() | Last update timestamp     |

**Indexes:**
- `idx_companies_cui` on `cui`
- `idx_companies_is_active` on `is_active`

---

### 2. `users`
Central user table for all internal and external users.

| Column            | Type         | Constraints            | Description                      |
|-------------------|-------------|-------------------------|----------------------------------|
| id                | UUID        | PK, NOT NULL            | Unique identifier                |
| company_id        | UUID        | FK → companies(id), NULL | Company (NULL for external users)|
| email             | VARCHAR(255)| UNIQUE, NOT NULL        | Email (login identifier)         |
| password_hash     | VARCHAR(255)| NOT NULL                | Argon2 hashed password           |
| first_name        | VARCHAR(100)| NOT NULL                | First name                       |
| last_name         | VARCHAR(100)| NOT NULL                | Last name                        |
| phone             | VARCHAR(50) | NULL                    | Phone number                     |
| cnp               | VARCHAR(13) | NULL                    | Romanian personal numeric code   |
| user_type         | VARCHAR(20) | NOT NULL, DEFAULT 'intern' | 'intern' or 'extern'         |
| is_active         | BOOLEAN     | NOT NULL, DEFAULT true  | Active status                    |
| is_verified       | BOOLEAN     | NOT NULL, DEFAULT false | Email verification status        |
| refresh_token     | TEXT        | NULL                    | Current refresh token            |
| last_login_at     | TIMESTAMP   | NULL                    | Last successful login            |
| password_changed_at| TIMESTAMP  | NULL                    | Last password change             |
| created_at        | TIMESTAMP   | NOT NULL, DEFAULT NOW() | Creation timestamp               |
| updated_at        | TIMESTAMP   | NOT NULL, DEFAULT NOW() | Last update timestamp            |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_company_id` on `company_id`
- `idx_users_user_type` on `user_type`
- `idx_users_is_active` on `is_active`

---

### 3. `roles`
Dynamic role definitions (not hardcoded).

| Column        | Type         | Constraints        | Description                    |
|---------------|-------------|---------------------|--------------------------------|
| id            | UUID        | PK, NOT NULL        | Unique identifier              |
| company_id    | UUID        | FK → companies(id), NULL | Company (NULL = system role)|
| name          | VARCHAR(100)| NOT NULL            | Role name (e.g., Administrator)|
| slug          | VARCHAR(100)| UNIQUE, NOT NULL    | Machine-readable identifier    |
| description   | TEXT        | NULL                | Role description               |
| is_system     | BOOLEAN     | DEFAULT false        | System role flag               |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                            |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                            |

**Indexes:**
- `idx_roles_slug` on `slug`
- `idx_roles_company_id` on `company_id`

---

### 4. `user_roles`
Many-to-many relationship: Users ↔ Roles.

| Column        | Type         | Constraints            | Description        |
|---------------|-------------|-------------------------|--------------------|
| id            | UUID        | PK, NOT NULL            |                    |
| user_id       | UUID        | FK → users(id), NOT NULL |                    |
| role_id       | UUID        | FK → roles(id), NOT NULL |                    |
| assigned_at   | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                    |
| assigned_by   | UUID        | FK → users(id), NULL    | Who assigned       |

**Indexes:**
- `idx_user_roles_user_id` on `user_id`
- `idx_user_roles_role_id` on `role_id`
- UNIQUE on `(user_id, role_id)`

---

### 5. `permissions`
Granular permission definitions.

| Column        | Type         | Constraints        | Description                    |
|---------------|-------------|---------------------|--------------------------------|
| id            | UUID        | PK, NOT NULL        |                                |
| name          | VARCHAR(100)| NOT NULL            | Permission name                |
| slug          | VARCHAR(100)| UNIQUE, NOT NULL    | e.g., 'users.create'          |
| description   | TEXT        | NULL                |                                |
| module        | VARCHAR(100)| NOT NULL            | Module (users, archive, etc.)  |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                            |

**Indexes:**
- `idx_permissions_slug` on `slug`
- `idx_permissions_module` on `module`

---

### 6. `role_permissions`
Many-to-many: Roles ↔ Permissions.

| Column        | Type         | Constraints                  | Description |
|---------------|-------------|-------------------------------|-------------|
| id            | UUID        | PK, NOT NULL                  |             |
| role_id       | UUID        | FK → roles(id), NOT NULL      |             |
| permission_id | UUID        | FK → permissions(id), NOT NULL |            |
| granted_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |             |

**Indexes:**
- UNIQUE on `(role_id, permission_id)`

---

### 7. `modules`
Application modules for menu and permission grouping.

| Column        | Type         | Constraints        | Description          |
|---------------|-------------|---------------------|----------------------|
| id            | UUID        | PK, NOT NULL        |                      |
| name          | VARCHAR(100)| NOT NULL            | Module name          |
| slug          | VARCHAR(100)| UNIQUE, NOT NULL    | e.g., 'dashboard'   |
| icon          | VARCHAR(50) | NULL                | Tabler icon name     |
| path          | VARCHAR(255)| NULL                | Frontend route       |
| parent_id     | UUID        | FK → modules(id), NULL | Parent module     |
| sort_order    | INTEGER     | DEFAULT 0            | Display order        |
| is_visible    | BOOLEAN     | DEFAULT true         | Visibility in menu   |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                   |

**Indexes:**
- `idx_modules_slug` on `slug`
- `idx_modules_parent_id` on `parent_id`

---

### 8. `module_permissions`
Which modules require which permissions.

| Column        | Type         | Constraints                   | Description |
|---------------|-------------|--------------------------------|-------------|
| id            | UUID        | PK, NOT NULL                   |             |
| module_id     | UUID        | FK → modules(id), NOT NULL     |             |
| permission_id | UUID        | FK → permissions(id), NOT NULL |             |

---

### 9. `organizational_structure`
Hierarchical organization units (departments, services, offices).

| Column        | Type         | Constraints            | Description           |
|---------------|-------------|-------------------------|-----------------------|
| id            | UUID        | PK, NOT NULL            |                       |
| company_id    | UUID        | FK → companies(id), NOT NULL |                  |
| name          | VARCHAR(255)| NOT NULL                | Unit name             |
| code          | VARCHAR(50) | NULL                    | Unit code             |
| parent_id     | UUID        | FK → organizational_structure(id), NULL | Parent unit |
| level         | INTEGER     | NOT NULL                | Hierarchy level       |
| sort_order    | INTEGER     | DEFAULT 0               |                       |
| is_active     | BOOLEAN     | DEFAULT true            |                       |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                       |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                       |

**Indexes:**
- `idx_org_struct_company` on `company_id`
- `idx_org_struct_parent` on `parent_id`

---

### 10. `archival_funds`
Top-level archival fund collections.

| Column        | Type         | Constraints            | Description              |
|---------------|-------------|-------------------------|--------------------------|
| id            | UUID        | PK, NOT NULL            |                          |
| company_id    | UUID        | FK → companies(id), NOT NULL |                     |
| name          | VARCHAR(255)| NOT NULL                | Fund name                |
| code          | VARCHAR(50) | UNIQUE, NOT NULL        | Fund code                |
| description   | TEXT        | NULL                    |                          |
| start_year    | INTEGER     | NULL                    |                          |
| end_year      | INTEGER     | NULL                    |                          |
| creator       | VARCHAR(255)| NULL                    | Fund creator institution |
| is_active     | BOOLEAN     | DEFAULT true            |                          |
| metadata      | JSONB       | DEFAULT '{}'            |                          |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                          |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                          |

**Indexes:**
- `idx_funds_company` on `company_id`
- `idx_funds_code` on `code`

---

### 11. `inventories`
Inventory registers within archival funds.

| Column          | Type         | Constraints                | Description        |
|-----------------|-------------|-----------------------------|--------------------|
| id              | UUID        | PK, NOT NULL                |                    |
| fund_id         | UUID        | FK → archival_funds(id), NOT NULL |             |
| name            | VARCHAR(255)| NOT NULL                    |                    |
| code            | VARCHAR(50) | NOT NULL                    |                    |
| description     | TEXT        | NULL                        |                    |
| total_units     | INTEGER     | DEFAULT 0                   |                    |
| metadata        | JSONB       | DEFAULT '{}'               |                    |
| created_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()     |                    |
| updated_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()     |                    |

**Indexes:**
- `idx_inventories_fund` on `fund_id`
- UNIQUE on `(fund_id, code)`

---

### 12. `archival_units`
Individual archival units within inventories.

| Column          | Type         | Constraints                  | Description            |
|-----------------|-------------|-------------------------------|------------------------|
| id              | UUID        | PK, NOT NULL                  |                        |
| inventory_id    | UUID        | FK → inventories(id), NOT NULL |                       |
| title           | VARCHAR(500)| NOT NULL                      |                        |
| code            | VARCHAR(50) | NOT NULL                      |                        |
| description     | TEXT        | NULL                          |                        |
| start_date      | DATE        | NULL                          |                        |
| end_date        | DATE        | NULL                          |                        |
| quantity        | INTEGER     | DEFAULT 1                     | Number of physical files|
| location        | VARCHAR(255)| NULL                          | Physical location      |
| status          | VARCHAR(30) | DEFAULT 'active'              | active, archived, etc. |
| metadata        | JSONB       | DEFAULT '{}'                  |                        |
| created_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                        |
| updated_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                        |

**Indexes:**
- `idx_units_inventory` on `inventory_id`
- `idx_units_status` on `status`
- UNIQUE on `(inventory_id, code)`

---

### 13. `documents`
Individual documents within archival units.

| Column          | Type         | Constraints                    | Description           |
|-----------------|-------------|---------------------------------|-----------------------|
| id              | UUID        | PK, NOT NULL                    |                       |
| unit_id         | UUID        | FK → archival_units(id), NOT NULL |                     |
| title           | VARCHAR(500)| NOT NULL                        |                       |
| code            | VARCHAR(50) | NOT NULL                        |                       |
| document_type   | VARCHAR(50) | DEFAULT 'file'                  | file, registry, etc.  |
| description     | TEXT        | NULL                            |                       |
| pages           | INTEGER     | NULL                            |                       |
| language        | VARCHAR(50) | DEFAULT 'ro'                    |                       |
| format          | VARCHAR(20) | DEFAULT 'physical'              | physical or digital   |
| file_url        | TEXT        | NULL                            | Digital file location |
| file_size       | BIGINT      | NULL                            | In bytes              |
| checksum        | VARCHAR(64) | NULL                            | SHA-256 for integrity |
| access_level    | VARCHAR(20) | DEFAULT 'public'                | public, restricted, confidential |
| status          | VARCHAR(30) | DEFAULT 'available'             | available, borrowed, eliminated |
| metadata        | JSONB       | DEFAULT '{}'                    |                       |
| created_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()         |                       |
| updated_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()         |                       |

**Indexes:**
- `idx_documents_unit` on `unit_id`
- `idx_documents_status` on `status`
- `idx_documents_access` on `access_level`
- UNIQUE on `(unit_id, code)`

---

### 14. `document_versions`
Version history for digital documents.

| Column        | Type         | Constraints                  | Description        |
|---------------|-------------|-------------------------------|--------------------|
| id            | UUID        | PK, NOT NULL                  |                    |
| document_id   | UUID        | FK → documents(id), NOT NULL  |                    |
| version       | INTEGER     | NOT NULL                      | Version number     |
| file_url      | TEXT        | NOT NULL                      |                    |
| file_size     | BIGINT      | NULL                          |                    |
| checksum      | VARCHAR(64) | NULL                          |                    |
| change_notes  | TEXT        | NULL                          |                    |
| uploaded_by   | UUID        | FK → users(id), NOT NULL      |                    |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                    |

**Indexes:**
- `idx_doc_versions_document` on `document_id`
- UNIQUE on `(document_id, version)`

---

### 15. `authorized_persons`
External persons authorized to access documents.

| Column        | Type         | Constraints        | Description              |
|---------------|-------------|---------------------|--------------------------|
| id            | UUID        | PK, NOT NULL        |                          |
| first_name    | VARCHAR(100)| NOT NULL            |                          |
| last_name     | VARCHAR(100)| NOT NULL            |                          |
| cnp           | VARCHAR(13) | UNIQUE, NULL        |                          |
| email         | VARCHAR(255)| UNIQUE, NULL        |                          |
| phone         | VARCHAR(50) | NULL                |                          |
| institution   | VARCHAR(255)| NULL                |                          |
| id_type       | VARCHAR(30) | DEFAULT 'ci'        | ci, passport, etc.       |
| id_number     | VARCHAR(50) | NULL                | Identity document number |
| address       | TEXT        | NULL                |                          |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                      |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                      |

**Indexes:**
- `idx_auth_persons_cnp` on `cnp`
- `idx_auth_persons_email` on `email`

---

### 16. `requests`
Document access requests from external or internal users.

| Column            | Type         | Constraints                  | Description                  |
|-------------------|-------------|-------------------------------|------------------------------|
| id                | UUID        | PK, NOT NULL                  |                              |
| user_id           | UUID        | FK → users(id), NOT NULL      | Requester                    |
| request_type      | VARCHAR(30) | NOT NULL                      | consultation, copy, elimination |
| status            | VARCHAR(30) | DEFAULT 'draft'               | draft, submitted, approved, rejected, completed |
| motivation        | TEXT        | NULL                          | Reason for request           |
| priority          | VARCHAR(15) | DEFAULT 'normal'              | low, normal, high, urgent    |
| requested_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                              |
| approved_at       | TIMESTAMP   | NULL                          |                              |
| approved_by       | UUID        | FK → users(id), NULL          | Approving user               |
| rejected_at       | TIMESTAMP   | NULL                          |                              |
| rejected_by       | UUID        | FK → users(id), NULL          |                              |
| rejection_reason  | TEXT        | NULL                          |                              |
| completed_at      | TIMESTAMP   | NULL                          |                              |
| deadline          | TIMESTAMP   | NULL                          |                              |
| metadata          | JSONB       | DEFAULT '{}'                  |                              |
| created_at        | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                              |
| updated_at        | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                              |

**Indexes:**
- `idx_requests_user` on `user_id`
- `idx_requests_status` on `status`
- `idx_requests_type` on `request_type`

---

### 17. `request_documents`
Many-to-many: Requests ↔ Documents.

| Column        | Type         | Constraints                   | Description        |
|---------------|-------------|--------------------------------|--------------------|
| id            | UUID        | PK, NOT NULL                   |                    |
| request_id    | UUID        | FK → requests(id), NOT NULL    |                    |
| document_id   | UUID        | FK → documents(id), NOT NULL   |                    |
| added_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()        |                    |

**Indexes:**
- UNIQUE on `(request_id, document_id)`

---

### 18. `document_consultation`
Tracking document consultations.

| Column            | Type         | Constraints                  | Description               |
|-------------------|-------------|-------------------------------|---------------------------|
| id                | UUID        | PK, NOT NULL                  |                           |
| document_id       | UUID        | FK → documents(id), NOT NULL  |                           |
| user_id           | UUID        | FK → users(id), NOT NULL      | Who consulted             |
| request_id        | UUID        | FK → requests(id), NULL       | Related request           |
| consulted_at      | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                           |
| return_deadline   | TIMESTAMP   | NULL                          |                           |
| returned_at       | TIMESTAMP   | NULL                          |                           |
| status            | VARCHAR(20) | DEFAULT 'consulting'          | consulting, returned, overdue |
| notes             | TEXT        | NULL                          |                           |

**Indexes:**
- `idx_consult_document` on `document_id`
- `idx_consult_user` on `user_id`
- `idx_consult_status` on `status`

---

### 19. `document_elimination`
Tracking document elimination process.

| Column        | Type         | Constraints                  | Description         |
|---------------|-------------|-------------------------------|---------------------|
| id            | UUID        | PK, NOT NULL                  |                     |
| document_id   | UUID        | FK → documents(id), NOT NULL  |                     |
| reason        | TEXT        | NOT NULL                      |                     |
| approved_by   | UUID        | FK → users(id), NOT NULL      |                     |
| eliminated_at | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                     |
| process_number| VARCHAR(50) | NULL                          | Legal process number|
| notes         | TEXT        | NULL                          |                     |

---

### 20. `notifications`
User notification system.

| Column        | Type         | Constraints                  | Description              |
|---------------|-------------|-------------------------------|--------------------------|
| id            | UUID        | PK, NOT NULL                  |                          |
| user_id       | UUID        | FK → users(id), NOT NULL      | Recipient                |
| title         | VARCHAR(255)| NOT NULL                      |                          |
| body          | TEXT        | NOT NULL                      |                          |
| type          | VARCHAR(50) | NOT NULL                      | info, warning, success, error |
| is_read       | BOOLEAN     | DEFAULT false                 |                          |
| read_at       | TIMESTAMP   | NULL                          |                          |
| link          | VARCHAR(500)| NULL                          | Action link              |
| metadata      | JSONB       | DEFAULT '{}'                  |                          |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                          |

**Indexes:**
- `idx_notif_user` on `user_id`
- `idx_notif_read` on `(user_id, is_read)`
- `idx_notif_created` on `created_at`

---

### 21. `audit_logs`
Immutable audit trail for all actions.

| Column        | Type         | Constraints                  | Description              |
|---------------|-------------|-------------------------------|--------------------------|
| id            | UUID        | PK, NOT NULL                  |                          |
| user_id       | UUID        | FK → users(id), NULL          | Actor (NULL if system)   |
| action        | VARCHAR(100)| NOT NULL                      | Action performed         |
| entity_type   | VARCHAR(50) | NOT NULL                      | Entity acted upon        |
| entity_id     | UUID        | NULL                          |                          |
| old_values    | JSONB       | NULL                          | Previous state           |
| new_values    | JSONB       | NULL                          | New state                |
| ip_address    | VARCHAR(45) | NULL                          | IPv4 or IPv6             |
| user_agent    | TEXT        | NULL                          | Browser user agent       |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                          |

**Indexes:**
- `idx_audit_user` on `user_id`
- `idx_audit_entity` on `(entity_type, entity_id)`
- `idx_audit_action` on `action`
- `idx_audit_created` on `created_at`

---

### 22. `email_templates`
HTML email templates for notifications.

| Column        | Type         | Constraints        | Description                    |
|---------------|-------------|---------------------|--------------------------------|
| id            | UUID        | PK, NOT NULL        |                                |
| company_id    | UUID        | FK → companies(id), NULL |                           |
| name          | VARCHAR(100)| NOT NULL            | Template name                  |
| slug          | VARCHAR(100)| UNIQUE, NOT NULL    | e.g., 'account-confirmation'   |
| subject       | VARCHAR(255)| NOT NULL            | Default subject                |
| body_html     | TEXT        | NOT NULL            | HTML template with variables   |
| body_text     | TEXT        | NULL                | Plain text fallback            |
| variables     | JSONB       | DEFAULT '[]'        | Available template variables   |
| is_active     | BOOLEAN     | DEFAULT true        |                                |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                            |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                            |

**Indexes:**
- `idx_email_tpl_slug` on `slug`
- `idx_email_tpl_company` on `company_id`

---

### 23. `communication_history`
Record of all communications sent.

| Column        | Type         | Constraints                  | Description              |
|---------------|-------------|-------------------------------|--------------------------|
| id            | UUID        | PK, NOT NULL                  |                          |
| company_id    | UUID        | FK → companies(id), NULL      |                          |
| from_address  | VARCHAR(255)| NOT NULL                      | Sender email             |
| to_address    | VARCHAR(255)| NOT NULL                      | Recipient email          |
| subject       | VARCHAR(255)| NOT NULL                      |                          |
| body          | TEXT        | NOT NULL                      |                          |
| status        | VARCHAR(20) | DEFAULT 'sent'                | sent, failed, bounced    |
| initiated_by  | UUID        | FK → users(id), NULL          | Who triggered            |
| reference_type| VARCHAR(50) | NULL                          | request, document, etc.  |
| reference_id  | UUID        | NULL                          |                          |
| sent_at       | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                          |
| error_message | TEXT        | NULL                          | If failed                |
| metadata      | JSONB       | DEFAULT '{}'                  |                          |

**Indexes:**
- `idx_comm_status` on `status`
- `idx_comm_initiator` on `initiated_by`
- `idx_comm_reference` on `(reference_type, reference_id)`
- `idx_comm_sent` on `sent_at`

---

### 24. `settings`
Application settings key-value store.

| Column        | Type         | Constraints            | Description         |
|---------------|-------------|-------------------------|---------------------|
| id            | UUID        | PK, NOT NULL            |                     |
| company_id    | UUID        | FK → companies(id), NULL | Company-specific   |
| key           | VARCHAR(100)| NOT NULL                | Setting key         |
| value         | JSONB       | NOT NULL                | Setting value       |
| description   | TEXT        | NULL                    |                     |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                     |
| updated_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW() |                     |

**Indexes:**
- UNIQUE on `(company_id, key)`
- `idx_settings_key` on `key`

---

### 25. `refresh_tokens`
JWT refresh token blacklist/management.

| Column        | Type         | Constraints                  | Description         |
|---------------|-------------|-------------------------------|---------------------|
| id            | UUID        | PK, NOT NULL                  |                     |
| user_id       | UUID        | FK → users(id), NOT NULL      |                     |
| token         | TEXT        | NOT NULL                      | Hashed token        |
| expires_at    | TIMESTAMP   | NOT NULL                      |                     |
| is_revoked    | BOOLEAN     | DEFAULT false                 |                     |
| revoked_at    | TIMESTAMP   | NULL                          |                     |
| created_at    | TIMESTAMP   | NOT NULL, DEFAULT NOW()       |                     |

**Indexes:**
- `idx_rt_user` on `user_id`
- `idx_rt_token` on `token` (hash)
- `idx_rt_expires` on `expires_at`

---

## Seeding Strategy

For MVP, the system will prepopulate:

### System Roles (is_system = true)
- Administrator
- Arhivar
- Operator
- Solicitant (External User)

### System Modules
- Dashboard
- Users
- Roles & Permissions
- Organizational Structure
- Archive (Fonduri, Inventare, Unități Arhivistice, Documente)
- Requests (Solicitări)
- Reports (Rapoarte)
- Settings (Setări)
- Audit (Istoric)

### System Permissions
- CRUD for each module (create, read, update, delete)
- Special actions: approve, reject, export, import

---

## Notes & Future Recommendations

1. **Full-Text Search**: Consider adding `tsvector` columns on `documents.title`, `documents.description`, `archival_units.title` for PostgreSQL full-text search capabilities.
2. **File Storage**: For Vercel deployment, consider using Vercel Blob Storage or AWS S3 for digital document storage instead of local filesystem.
3. **Partitioning**: For tables like `audit_logs` and `communication_history` that will grow large, consider table partitioning by `created_at` date.
4. **Archiving**: Implement a data archiving strategy for old audit logs (>1 year) to maintain performance.
5. **Caching**: Consider Redis for session management and rate limiting in production.