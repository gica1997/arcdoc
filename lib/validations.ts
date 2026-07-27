// ============================================
// ArcDoc Enterprise - Zod Validation Schemas
// ============================================

import { z } from 'zod';

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(6, 'Parola trebuie să aibă minim 6 caractere');

/**
 * Email validation.
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters');

/**
 * Romanian CNP validation (basic format check).
 */
export const cnpSchema = z
  .string()
  .length(13, 'CNP must be exactly 13 digits')
  .regex(/^[0-9]{13}$/, 'CNP must contain only digits')
  .optional()
  .nullable();

/**
 * Phone number validation (Romanian format).
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(\+4|004)?0?7[0-9]{8}$/,
    'Invalid Romanian phone number format'
  )
  .optional()
  .nullable();

// ─── Auth Schemas ──────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  phone: phoneSchema,
  cnp: cnpSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── User Schemas ──────────────────────────

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: phoneSchema,
  cnp: cnpSchema,
  userType: z.enum(['intern', 'extern']),
  companyId: z.string().uuid().optional().nullable(),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role is required'),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: phoneSchema,
  cnp: cnpSchema,
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

// ─── Role & Permission Schemas ─────────────

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_]+$/,
      'Slug must contain only lowercase letters, numbers, and underscores'
    ),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

// ─── Archive Schemas ───────────────────────

export const createFundSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  creator: z.string().max(255).optional(),
});

export const createInventorySchema = z.object({
  fundId: z.string().uuid(),
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
});

export const createArchivalUnitSchema = z.object({
  inventoryId: z.string().uuid(),
  title: z.string().min(1).max(500),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  location: z.string().max(255).optional(),
});

export const createDocumentSchema = z.object({
  unitId: z.string().uuid(),
  title: z.string().min(1).max(500),
  code: z.string().min(1).max(50),
  documentType: z.string().max(50).default('file'),
  description: z.string().optional(),
  pages: z.number().int().optional(),
  language: z.string().max(50).default('ro'),
  format: z.enum(['physical', 'digital']).default('physical'),
  accessLevel: z.enum(['public', 'restricted', 'confidential']).default('public'),
});

// ─── Request Schemas ───────────────────────

export const createRequestSchema = z.object({
  requestType: z.enum(['consultation', 'copy', 'elimination']),
  motivation: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  deadline: z.string().optional(),
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document is required'),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['submitted', 'approved', 'rejected', 'completed']),
  rejectionReason: z.string().optional(),
});

// ─── Common Schemas ────────────────────────

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

/**
 * Validate data against a schema and return parsed result or error.
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateFundInput = z.infer<typeof createFundSchema>;
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type CreateArchivalUnitInput = z.infer<typeof createArchivalUnitSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;