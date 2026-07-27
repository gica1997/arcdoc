// ============================================
// ArcDoc Enterprise - Configuration
// ============================================

/**
 * Application configuration loaded from environment variables.
 * This file serves as the single source of truth for all configuration values.
 */

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/arcdoc',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'arcdoc-jwt-secret-development-only',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'arcdoc-jwt-refresh-secret-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Argon2 Password Hashing
  argon2: {
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
  },

  // Application
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ArcDoc Enterprise',
    companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'ArcDoc',
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'noreply@arcdoc.ro',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@arcdoc.ro',
    secure: process.env.SMTP_SECURE === 'true',
  },

  // Rate Limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },

  // CORS
  cors: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://arcdoc.vercel.app',
    ],
  },

  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

/**
 * Permission slugs used throughout the application.
 */
export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Permissions
  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_CREATE: 'permissions.create',
  PERMISSIONS_UPDATE: 'permissions.update',
  PERMISSIONS_DELETE: 'permissions.delete',

  // Archive - Funds
  FUNDS_VIEW: 'funds.view',
  FUNDS_CREATE: 'funds.create',
  FUNDS_UPDATE: 'funds.update',
  FUNDS_DELETE: 'funds.delete',

  // Archive - Inventories
  INVENTORIES_VIEW: 'inventories.view',
  INVENTORIES_CREATE: 'inventories.create',
  INVENTORIES_UPDATE: 'inventories.update',
  INVENTORIES_DELETE: 'inventories.delete',

  // Archive - Units
  UNITS_VIEW: 'units.view',
  UNITS_CREATE: 'units.create',
  UNITS_UPDATE: 'units.update',
  UNITS_DELETE: 'units.delete',

  // Archive - Documents
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_UPDATE: 'documents.update',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_DOWNLOAD: 'documents.download',

  // Requests
  REQUESTS_VIEW: 'requests.view',
  REQUESTS_CREATE: 'requests.create',
  REQUESTS_UPDATE: 'requests.update',
  REQUESTS_DELETE: 'requests.delete',
  REQUESTS_APPROVE: 'requests.approve',
  REQUESTS_REJECT: 'requests.reject',

  // Consultations
  CONSULTATIONS_VIEW: 'consultations.view',
  CONSULTATIONS_MANAGE: 'consultations.manage',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // Audit
  AUDIT_VIEW: 'audit.view',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_MANAGE: 'notifications.manage',

  // Organization
  ORG_VIEW: 'organization.view',
  ORG_CREATE: 'organization.create',
  ORG_UPDATE: 'organization.update',
  ORG_DELETE: 'organization.delete',
} as const;

/**
 * System role slugs.
 */
export const SystemRoles = {
  ADMINISTRATOR: 'administrator',
  ARHIVAR: 'arhivar',
  OPERATOR: 'operator',
  SOLICITANT: 'solicitant',
} as const;

/**
 * Module slugs for sidebar and permission grouping.
 */
export const ModuleSlugs = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ORGANIZATION: 'organization',
  FUNDS: 'funds',
  INVENTORIES: 'inventories',
  UNITS: 'units',
  DOCUMENTS: 'documents',
  REQUESTS: 'requests',
  CONSULTATIONS: 'consultations',
  REPORTS: 'reports',
  AUDIT: 'audit',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const;

export default config;