"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ROLE_TEMPLATES,
  ORGANIZATION_ROLES,
  FEATURES,
  ACTIONS,
  DATA_SCOPES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  filterByDataScope,
  DASHBOARD_SECTIONS,
  AUDIT_EVENTS
} from "@/lib/permissions-config";

const PermissionsContext = createContext({
  currentUser: null,
  organizationType: 'ENTERPRISE',
  checkPermission: () => false,
  checkAnyPermission: () => false,
  checkAllPermissions: () => false,
  canAccessDashboardSection: () => false,
  getAccessibleSections: () => [],
  filterDataByScope: () => [],
  assignRole: () => {},
  removeRole: () => {},
  updateUserPermissions: () => {},
  impersonateUser: () => {},
  stopImpersonation: () => {},
  logAuditEvent: () => {},
  getAuditLogs: () => [],
  users: [],
  roles: [],
  customRoles: [],
  createCustomRole: () => {},
  updateCustomRole: () => {},
  deleteCustomRole: () => {}
});

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  // Organization type (agency, franchise, or enterprise)
  const [organizationType, setOrganizationType] = useState('enterprise');
  
  // Mock users with standardized roles and updated schema
  const [users, setUsers] = useState([
    {
      id: 'user1',
      name: 'John Admin',
      email: 'admin@example.com',
      isSuperUser: false,
      stores: [{
        store_id: 'store1',
        store_public_id: 'STORE-001',
        roleId: 'owner',  // Standardized role ID
        dataScope: 'global',
        assignedAccounts: [],
        assignedStores: [],
        customPermissions: [],
        restrictions: [],
        organization_type: 'enterprise'
      }],
      departmentId: 'dept1',
      teamId: 'team1',
      isActive: true
    },
    {
      id: 'user2',
      name: 'Jane Manager',
      email: 'manager@example.com',
      isSuperUser: false,
      stores: [{
        store_id: 'store1',
        store_public_id: 'STORE-001',
        roleId: 'manager',  // Standardized role ID
        dataScope: 'assigned_accounts',
        assignedAccounts: ['acc1', 'acc2'],
        assignedStores: ['store1', 'store2'],
        customPermissions: [],
        restrictions: [],
        organization_type: 'enterprise'
      }],
      departmentId: 'dept1',
      teamId: 'team1',
      isActive: true
    },
    {
      id: 'user3',
      name: 'Bob Creator',
      email: 'creator@example.com',
      isSuperUser: false,
      stores: [{
        store_id: 'store1',
        store_public_id: 'STORE-001',
        roleId: 'creator',  // Standardized role ID
        dataScope: 'assigned_accounts',
        assignedAccounts: ['acc1'],
        assignedStores: ['store1'],
        customPermissions: [],
        restrictions: ['requires_approval'],
        organization_type: 'enterprise'
      }],
      departmentId: 'dept1',
      teamId: 'team2',
      isActive: true
    },
    {
      id: 'user4',
      name: 'Alice Viewer',
      email: 'viewer@example.com',
      isSuperUser: false,
      stores: [{
        store_id: 'store1',
        store_public_id: 'STORE-001',
        roleId: 'viewer',  // Standardized role ID
        dataScope: 'assigned_accounts',
        assignedAccounts: ['acc1'],
        assignedStores: ['store1'],
        customPermissions: [],
        restrictions: [],
        organization_type: 'enterprise'
      }],
      departmentId: 'dept2',
      teamId: 'team3',
      isActive: true
    },
    {
      id: 'user5',
      name: 'System Admin',
      email: 'admin@system.com',
      isSuperUser: true,  // Super user flag
      stores: [{
        store_id: 'store1',
        store_public_id: 'STORE-001',
        roleId: 'super_user',  // Super user role
        dataScope: 'global',
        assignedAccounts: [],
        assignedStores: [],
        customPermissions: ['*:*'],
        restrictions: [],
        organization_type: 'enterprise'
      }],
      departmentId: null,
      teamId: null,
      isActive: true
    }
  ]);

  // Current logged-in user
  const [currentUser, setCurrentUser] = useState(users[0]);
  
  // Impersonation state
  const [impersonationState, setImpersonationState] = useState({
    isImpersonating: false,
    originalUser: null,
    impersonatedUser: null
  });

  // Custom roles created by the organization
  const [customRoles, setCustomRoles] = useState([]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Get all available roles based on organization type
  const getRoles = useCallback(() => {
    const baseRoles = Object.values(ROLE_TEMPLATES);
    const orgRoles = ORGANIZATION_ROLES[organizationType.toUpperCase()] 
      ? Object.values(ORGANIZATION_ROLES[organizationType.toUpperCase()])
      : [];
    
    return [...baseRoles, ...orgRoles, ...customRoles];
  }, [organizationType, customRoles]);

  // Get role display name based on organization context
  const getRoleDisplayName = useCallback((roleId, orgType = organizationType) => {
    const contextMap = {
      agency: {
        owner: 'Agency Owner',
        admin: 'Account Administrator',
        manager: 'Account Manager',
        brand_guardian: 'Brand Manager',
        creator: 'Creative',
        publisher: 'Publisher',
        reviewer: 'Client Success',
        analyst: 'Data Analyst',
        viewer: 'Client Viewer',
        guest: 'Guest'
      },
      franchise: {
        owner: 'Franchisor',
        admin: 'Franchise Administrator',
        manager: 'Regional Manager',
        brand_guardian: 'Brand Guardian',
        creator: 'Location Manager',
        publisher: 'Franchisee',
        reviewer: 'Quality Reviewer',
        analyst: 'Performance Analyst',
        viewer: 'Location Viewer',
        guest: 'Guest'
      },
      enterprise: {
        owner: 'Executive',
        admin: 'System Administrator',
        manager: 'Department Head',
        brand_guardian: 'Brand Team',
        creator: 'Content Creator',
        publisher: 'Content Publisher',
        reviewer: 'Content Reviewer',
        analyst: 'Business Analyst',
        viewer: 'Stakeholder',
        guest: 'Guest'
      }
    };
    
    return contextMap[orgType]?.[roleId] || roleId;
  }, [organizationType]);

  // Get user's effective role for current store
  const getUserRole = useCallback((user, storeId = 'store1') => {
    if (!user) return ROLE_TEMPLATES.GUEST;
    
    // Find the user's role for the specific store
    const storeAccess = user.stores?.find(s => s.store_id === storeId);
    if (!storeAccess) return ROLE_TEMPLATES.GUEST;
    
    const roles = getRoles();
    return roles.find(role => role.id === storeAccess.roleId) || ROLE_TEMPLATES.GUEST;
  }, [getRoles]);

  // Get user's effective permissions for current store
  const getUserPermissions = useCallback((user, storeId = 'store1') => {
    if (!user) return [];
    
    // Check if super user
    if (user.isSuperUser) {
      return ['*:*']; // All permissions
    }
    
    const storeAccess = user.stores?.find(s => s.store_id === storeId);
    if (!storeAccess) return [];
    
    const role = getUserRole(user, storeId);
    const rolePermissions = role.permissions || [];
    const customPermissions = storeAccess.customPermissions || [];
    
    // Combine role and custom permissions
    return [...new Set([...rolePermissions, ...customPermissions])];
  }, [getUserRole]);

  // Check if user has a specific permission
  const checkPermission = useCallback((feature, action, user = null) => {
    const targetUser = user || (impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser);
    
    if (!targetUser) return false;
    
    const permissions = getUserPermissions(targetUser);
    return hasPermission(permissions, feature, action);
  }, [currentUser, impersonationState, getUserPermissions]);

  // Check if user has any of the required permissions
  const checkAnyPermission = useCallback((requiredPermissions, user = null) => {
    const targetUser = user || (impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser);
    
    if (!targetUser) return false;
    
    const permissions = getUserPermissions(targetUser);
    return hasAnyPermission(permissions, requiredPermissions);
  }, [currentUser, impersonationState, getUserPermissions]);

  // Check if user has all required permissions
  const checkAllPermissions = useCallback((requiredPermissions, user = null) => {
    const targetUser = user || (impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser);
    
    if (!targetUser) return false;
    
    const permissions = getUserPermissions(targetUser);
    return hasAllPermissions(permissions, requiredPermissions);
  }, [currentUser, impersonationState, getUserPermissions]);

  // Check if user can access a dashboard section
  const canAccessDashboardSection = useCallback((sectionKey, user = null) => {
    const targetUser = user || (impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser);
    
    if (!targetUser) return false;
    
    const role = getUserRole(targetUser);
    
    // Check dashboard access configuration
    if (role.dashboardAccess && role.dashboardAccess[sectionKey] === false) {
      return false;
    }
    
    // Check permissions
    const section = DASHBOARD_SECTIONS[sectionKey];
    if (!section) return false;
    
    return section.requiredActions.every(action => 
      checkPermission(section.feature, action, targetUser)
    );
  }, [currentUser, impersonationState, getUserRole, checkPermission]);

  // Get all accessible dashboard sections for a user
  const getAccessibleSections = useCallback((user = null) => {
    const targetUser = user || (impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser);
    
    if (!targetUser) return [];
    
    return Object.keys(DASHBOARD_SECTIONS).filter(sectionKey => 
      canAccessDashboardSection(sectionKey, targetUser)
    );
  }, [currentUser, impersonationState, canAccessDashboardSection]);

  // Filter data based on user's data scope
  const filterDataByScope = useCallback((items, user = null) => {
    const targetUser = user || (impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser);
    
    if (!targetUser) return [];
    
    const role = getUserRole(targetUser);
    
    return filterByDataScope(
      items,
      role.dataScope,
      targetUser.id,
      targetUser.teamId,
      targetUser.departmentId
    );
  }, [currentUser, impersonationState, getUserRole]);

  // Assign a role to a user for a specific store
  const assignRole = useCallback((userId, roleId, storeId = 'store1') => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id !== userId) return user;
        
        const updatedStores = user.stores.map(store => 
          store.store_id === storeId
            ? { ...store, roleId, customPermissions: [] }
            : store
        );
        
        return { ...user, stores: updatedStores };
      })
    );
    
    logAuditEvent(AUDIT_EVENTS.ROLE_ASSIGNED, {
      targetUserId: userId,
      roleId,
      storeId
    });
  }, []);

  // Remove role from user for a specific store
  const removeRole = useCallback((userId, storeId = 'store1') => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id !== userId) return user;
        
        const updatedStores = user.stores.map(store => 
          store.store_id === storeId
            ? { ...store, roleId: 'guest', customPermissions: [] }
            : store
        );
        
        return { ...user, stores: updatedStores };
      })
    );
    
    logAuditEvent(AUDIT_EVENTS.ROLE_REMOVED, {
      targetUserId: userId,
      storeId
    });
  }, []);

  // Update user's custom permissions for a specific store
  const updateUserPermissions = useCallback((userId, permissions, storeId = 'store1') => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id !== userId) return user;
        
        const updatedStores = user.stores.map(store => 
          store.store_id === storeId
            ? { ...store, customPermissions: permissions }
            : store
        );
        
        return { ...user, stores: updatedStores };
      })
    );
    
    logAuditEvent(AUDIT_EVENTS.PERMISSION_GRANTED, {
      targetUserId: userId,
      permissions,
      storeId
    });
  }, []);

  // Impersonate another user (super admin only)
  const impersonateUser = useCallback((targetUserId) => {
    const targetUser = users.find(u => u.id === targetUserId);
    
    if (!targetUser) return false;
    
    // Check if current user can impersonate
    const currentRole = getUserRole(currentUser);
    if (!currentRole.canImpersonate) {
      console.error('Current user does not have impersonation permission');
      return false;
    }
    
    setImpersonationState({
      isImpersonating: true,
      originalUser: currentUser,
      impersonatedUser: targetUser
    });
    
    logAuditEvent(AUDIT_EVENTS.IMPERSONATION_START, {
      targetUserId
    });
    
    return true;
  }, [currentUser, users, getUserRole]);

  // Stop impersonation
  const stopImpersonation = useCallback(() => {
    if (!impersonationState.isImpersonating) return;
    
    logAuditEvent(AUDIT_EVENTS.IMPERSONATION_END, {
      targetUserId: impersonationState.impersonatedUser?.id
    });
    
    setImpersonationState({
      isImpersonating: false,
      originalUser: null,
      impersonatedUser: null
    });
  }, [impersonationState]);

  // Log audit event
  const logAuditEvent = useCallback((eventType, data = {}) => {
    const event = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      eventType,
      userId: impersonationState.isImpersonating 
        ? impersonationState.originalUser?.id 
        : currentUser?.id,
      impersonatedUserId: impersonationState.isImpersonating 
        ? impersonationState.impersonatedUser?.id 
        : null,
      data,
      ip: '127.0.0.1' // In production, get from request
    };
    
    setAuditLogs(prev => [event, ...prev].slice(0, 1000)); // Keep last 1000 events
  }, [currentUser, impersonationState]);

  // Get audit logs (filtered by permissions)
  const getAuditLogs = useCallback((filters = {}) => {
    const role = getUserRole(currentUser);
    
    if (!role.canViewAuditLogs) {
      return [];
    }
    
    let logs = [...auditLogs];
    
    // Apply filters
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.eventType) {
      logs = logs.filter(log => log.eventType === filters.eventType);
    }
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }
    
    return logs;
  }, [auditLogs, currentUser, getUserRole]);

  // Create custom role
  const createCustomRole = useCallback((roleData) => {
    const newRole = {
      ...roleData,
      id: `custom_${Date.now()}`,
      isCustom: true
    };
    
    setCustomRoles(prev => [...prev, newRole]);
    
    logAuditEvent('role.created', { roleId: newRole.id });
    
    return newRole;
  }, []);

  // Update custom role
  const updateCustomRole = useCallback((roleId, updates) => {
    setCustomRoles(prev => 
      prev.map(role => 
        role.id === roleId 
          ? { ...role, ...updates }
          : role
      )
    );
    
    logAuditEvent('role.updated', { roleId });
  }, []);

  // Delete custom role
  const deleteCustomRole = useCallback((roleId) => {
    // Check if any users have this role
    const usersWithRole = users.filter(u => u.roleId === roleId);
    
    if (usersWithRole.length > 0) {
      console.error(`Cannot delete role ${roleId}: ${usersWithRole.length} users have this role`);
      return false;
    }
    
    setCustomRoles(prev => prev.filter(role => role.id !== roleId));
    
    logAuditEvent('role.deleted', { roleId });
    
    return true;
  }, [users]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('permission_users');
    const savedRoles = localStorage.getItem('permission_custom_roles');
    const savedOrgType = localStorage.getItem('permission_org_type');
    const savedCurrentUserId = localStorage.getItem('permission_current_user');
    
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      
      if (savedCurrentUserId) {
        const savedUser = parsedUsers.find(u => u.id === savedCurrentUserId);
        if (savedUser) setCurrentUser(savedUser);
      }
    }
    
    if (savedRoles) setCustomRoles(JSON.parse(savedRoles));
    if (savedOrgType) setOrganizationType(savedOrgType);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('permission_users', JSON.stringify(users));
    localStorage.setItem('permission_custom_roles', JSON.stringify(customRoles));
    localStorage.setItem('permission_org_type', organizationType);
    if (currentUser) {
      localStorage.setItem('permission_current_user', currentUser.id);
    }
  }, [users, customRoles, organizationType, currentUser]);

  const value = {
    currentUser: impersonationState.isImpersonating 
      ? impersonationState.impersonatedUser 
      : currentUser,
    originalUser: impersonationState.originalUser,
    isImpersonating: impersonationState.isImpersonating,
    organizationType,
    setOrganizationType,
    setCurrentUser,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    canAccessDashboardSection,
    getAccessibleSections,
    filterDataByScope,
    assignRole,
    removeRole,
    updateUserPermissions,
    impersonateUser,
    stopImpersonation,
    logAuditEvent,
    getAuditLogs,
    users,
    roles: getRoles(),
    customRoles,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
    getUserRole,
    getUserPermissions,
    getRoleDisplayName
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};