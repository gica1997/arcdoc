// ============================================
// ArcDoc Enterprise - Multi-Tenant Context
// ============================================

import { headers } from 'next/headers';
import { query } from '@/lib/db';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  cui: string;
  logo_url?: string;
  primary_color?: string;
  settings: Record<string, unknown>;
  license_type: string;
  license_status: string;
  max_users: number;
  max_documents: number;
  max_storage_mb: number;
}

/**
 * Get current tenant info from request headers or user context.
 * In production, this reads from JWT claims or subdomain.
 */
export async function getCurrentTenant(): Promise<TenantInfo | null> {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id') || process.env.DEFAULT_TENANT_ID;
    if (!tenantId) return null;

    const data = await query<TenantInfo>(
      `SELECT c.*, l.type as license_type, l.status as license_status, l.max_users, l.max_documents, l.max_storage_mb
       FROM companies c
       LEFT JOIN licenses l ON l.company_id = c.id AND l.status = 'active'
       WHERE c.id = $1 AND c.is_active = true`,
      [tenantId]
    );
    return data.rows[0] || null;
  } catch {
    return null;
  }
}

/**
 * Validate tenant has active license for a specific feature.
 */
export function validateLicenseFeature(tenant: TenantInfo, feature: string): boolean {
  if (!tenant) return false;
  // Basic license feature mapping
  const featureMap: Record<string, string[]> = {
    'starter': ['dashboard', 'documents', 'requests'],
    'professional': ['dashboard', 'documents', 'requests', 'reports', 'ocr', 'export'],
    'enterprise': ['dashboard', 'documents', 'requests', 'reports', 'ocr', 'export', 'ai', 'api', 'workflow', 'backup'],
    'government': ['dashboard', 'documents', 'requests', 'reports', 'ocr', 'export', 'ai', 'api', 'workflow', 'backup', 'signature'],
    'custom': ['dashboard', 'documents', 'requests', 'reports', 'ocr', 'export', 'ai', 'api', 'workflow', 'backup', 'signature'],
  };

  const features = featureMap[tenant.license_type] || featureMap.starter;
  return features.includes(feature);
}

/**
 * Check tenant resource limits.
 */
export async function checkTenantLimits(tenant: TenantInfo): Promise<{
  usersOk: boolean;
  documentsOk: boolean;
  storageOk: boolean;
  userCount: number;
  docCount: number;
}> {
  const [users, docs] = await Promise.all([
    query<{count: number}>('SELECT COUNT(*)::int as count FROM users WHERE company_id = $1', [tenant.id]),
    query<{count: number}>('SELECT COUNT(*)::int as count FROM documents WHERE status != \'deleted\'', []),
  ]);

  return {
    usersOk: (users.rows[0]?.count || 0) < (tenant.max_users || 10),
    documentsOk: (docs.rows[0]?.count || 0) < (tenant.max_documents || 1000),
    storageOk: true, // Simplified
    userCount: users.rows[0]?.count || 0,
    docCount: docs.rows[0]?.count || 0,
  };
}

export default { getCurrentTenant, validateLicenseFeature, checkTenantLimits };