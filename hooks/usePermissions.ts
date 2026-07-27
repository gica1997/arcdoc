// ============================================
// ArcDoc Enterprise - Permissions Hook
// ============================================

'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for permission-based access control.
 * Checks if the current user has specific permissions or roles.
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission.
   */
  const can = useCallback(
    (permission: string | string[]): boolean => {
      if (!user) return false;

      const permissions = Array.isArray(permission) ? permission : [permission];

      // Administrator role has all permissions
      if (user.roles.includes('administrator')) return true;

      return permissions.some((perm) => user.permissions.includes(perm));
    },
    [user]
  );

  /**
   * Check if user has ALL specified permissions.
   */
  const canAll = useCallback(
    (permissions: string[]): boolean => {
      if (!user) return false;
      if (user.roles.includes('administrator')) return true;
      return permissions.every((perm) => user.permissions.includes(perm));
    },
    [user]
  );

  /**
   * Check if user has a specific role.
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles.
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      if (!user) return false;
      return roles.some((role) => user.roles.includes(role));
    },
    [user]
  );

  /**
   * Check if user is an internal user.
   */
  const isInternal = user?.userType === 'intern';

  /**
   * Check if user is an external user.
   */
  const isExternal = user?.userType === 'extern';

  return {
    can,
    canAll,
    hasRole,
    hasAnyRole,
    isInternal,
    isExternal,
    permissions: user?.permissions || [],
    roles: user?.roles || [],
  };
}

export default usePermissions;