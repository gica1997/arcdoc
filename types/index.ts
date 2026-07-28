// ============================================
// ArcDoc Enterprise - Core Type Definitions
// ============================================

// ─── Database Entities ─────────────────────

export interface Company {
  id: string;
  name: string;
  cui: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id?: string | null;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  cnp?: string | null;
  user_type: 'intern' | 'extern';
  is_active: boolean;
  is_verified: boolean;
  refresh_token?: string | null;
  last_login_at?: string | null;
  password_changed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relations (populated)
  roles?: Role[];
  permissions?: Permission[];
}

export interface Role {
  id: string;
  company_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  permissions?: Permission[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string | null;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  module: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
}

export interface Module {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  path?: string | null;
  parent_id?: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  // Relations
  children?: Module[];
  permissions?: Permission[];
}

export interface ModulePermission {
  id: string;
  module_id: string;
  permission_id: string;
}

export interface OrganizationalUnit {
  id: string;
  company_id: string;
  name: string;
  code?: string | null;
  parent_id?: string | null;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  children?: OrganizationalUnit[];
}

export interface ArchivalFund {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  creator?: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  fund_id: string;
  name: string;
  code: string;
  description?: string | null;
  total_units: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ArchivalUnit {
  id: string;
  inventory_id: string;
  title: string;
  code: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  quantity: number;
  location?: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  unit_id: string;
  title: string;
  code: string;
  document_type: string;
  description?: string | null;
  pages?: number | null;
  language: string;
  format: 'physical' | 'digital';
  file_url?: string | null;
  file_size?: number | null;
  checksum?: string | null;
  access_level: 'public' | 'restricted' | 'confidential';
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  file_url: string;
  file_size?: number | null;
  checksum?: string | null;
  change_notes?: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface AuthorizedPerson {
  id: string;
  first_name: string;
  last_name: string;
  cnp?: string | null;
  email?: string | null;
  phone?: string | null;
  institution?: string | null;
  id_type: string;
  id_number?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  request_type: 'consultation' | 'copy' | 'elimination';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  motivation?: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requested_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  completed_at?: string | null;
  deadline?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  documents?: Document[];
}

export interface RequestDocument {
  id: string;
  request_id: string;
  document_id: string;
  added_at: string;
}

export interface DocumentConsultation {
  id: string;
  document_id: string;
  user_id: string;
  request_id?: string | null;
  consulted_at: string;
  return_deadline?: string | null;
  returned_at?: string | null;
  status: 'consulting' | 'returned' | 'overdue';
  notes?: string | null;
}

export interface DocumentElimination {
  id: string;
  document_id: string;
  reason: string;
  approved_by: string;
  eliminated_at: string;
  process_number?: string | null;
  notes?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  read_at?: string | null;
  link?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  company_id?: string | null;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunicationHistory {
  id: string;
  company_id?: string | null;
  from_address: string;
  to_address: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'bounced';
  initiated_by?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  sent_at: string;
  error_message?: string | null;
  metadata: Record<string, unknown>;
}

export interface Setting {
  id: string;
  company_id?: string | null;
  key: string;
  value: unknown;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  revoked_at?: string | null;
  created_at: string;
}

// ─── API Types ─────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// ─── Auth Types ────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  userType: 'intern' | 'extern';
  companyId?: string | null;
  roles: string[];
  permissions: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cnp?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'intern' | 'extern';
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

// ─── Filter Types ──────────────────────────

export interface UserFilters extends PaginationParams {
  userType?: 'intern' | 'extern';
  isActive?: boolean;
  companyId?: string;
  roleId?: string;
}

export interface RequestFilters extends PaginationParams {
  status?: string;
  type?: string;
  userId?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentFilters extends PaginationParams {
  unitId?: string;
  status?: string;
  accessLevel?: string;
  format?: string;
  documentType?: string;
}

// ─── Form Types ────────────────────────────

export interface UserFormValues {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cnp?: string;
  userType: 'intern' | 'extern';
  companyId?: string;
  roleIds: string[];
}

export interface RoleFormValues {
  name: string;
  slug: string;
  description?: string;
  permissionIds: string[];
}

// ─── Sidebar / Navigation ──────────────────

export interface SidebarItem {
  label: string;
  icon: string;
  path?: string;
  module?: string;
  children?: SidebarItem[];
  permissions?: string[];
}

// ─── Theme Types ───────────────────────────

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  primaryColor: string;
}