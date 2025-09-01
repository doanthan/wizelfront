"use client";

import { usePermissions } from "@/app/contexts/permissions-context";

/**
 * PermissionGuard - Conditionally renders children based on permissions
 * 
 * @param {string} feature - The feature to check permission for
 * @param {string} action - The action to check permission for
 * @param {Array<string>} any - Array of permissions, user needs at least one
 * @param {Array<string>} all - Array of permissions, user needs all of them
 * @param {ReactNode} children - Content to render if permitted
 * @param {ReactNode} fallback - Content to render if not permitted
 * @param {boolean} hideWhenUnauthorized - Hide content instead of showing fallback
 */
export function PermissionGuard({ 
  feature, 
  action, 
  any,
  all,
  children, 
  fallback = null,
  hideWhenUnauthorized = true 
}) {
  const { checkPermission, checkAnyPermission, checkAllPermissions } = usePermissions();

  let hasPermission = false;

  if (feature && action) {
    hasPermission = checkPermission(feature, action);
  } else if (any && any.length > 0) {
    hasPermission = checkAnyPermission(any);
  } else if (all && all.length > 0) {
    hasPermission = checkAllPermissions(all);
  }

  if (hasPermission) {
    return children;
  }

  if (hideWhenUnauthorized) {
    return null;
  }

  return fallback;
}

/**
 * CanView - Show content only if user has view permission
 */
export function CanView({ feature, children, fallback = null }) {
  return (
    <PermissionGuard 
      feature={feature} 
      action="view" 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * CanEdit - Show content only if user has edit permission
 */
export function CanEdit({ feature, children, fallback = null }) {
  return (
    <PermissionGuard 
      feature={feature} 
      action="edit" 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * CanCreate - Show content only if user has create permission
 */
export function CanCreate({ feature, children, fallback = null }) {
  return (
    <PermissionGuard 
      feature={feature} 
      action="create" 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * CanDelete - Show content only if user has delete permission
 */
export function CanDelete({ feature, children, fallback = null }) {
  return (
    <PermissionGuard 
      feature={feature} 
      action="delete" 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * CanManage - Show content only if user has manage permission
 */
export function CanManage({ feature, children, fallback = null }) {
  return (
    <PermissionGuard 
      feature={feature} 
      action="manage" 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * RequireRole - Show content only if user has specific role
 */
export function RequireRole({ roleId, children, fallback = null }) {
  const { currentUser, getUserRole } = usePermissions();
  
  const userRole = getUserRole(currentUser);
  
  if (userRole?.id === roleId) {
    return children;
  }
  
  return fallback;
}

/**
 * RequireDataScope - Show content only if user has specific data scope or higher
 */
export function RequireDataScope({ scope, children, fallback = null }) {
  const { currentUser, getUserRole } = usePermissions();
  
  const userRole = getUserRole(currentUser);
  const scopeLevels = {
    'global': 0,
    'organization': 1,
    'department': 2,
    'team': 3,
    'assigned': 4,
    'own': 5
  };
  
  const userScopeLevel = scopeLevels[userRole?.dataScope] ?? 5;
  const requiredScopeLevel = scopeLevels[scope] ?? 5;
  
  if (userScopeLevel <= requiredScopeLevel) {
    return children;
  }
  
  return fallback;
}