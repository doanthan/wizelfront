"use client";

import { useState } from "react";
import { 
  Shield, 
  Users, 
  Key, 
  Edit2, 
  Trash2, 
  Plus,
  Check,
  X,
  AlertCircle,
  UserCheck,
  Lock,
  Unlock,
  Eye,
  Settings,
  Activity,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { usePermissions } from "@/app/contexts/permissions-context";
import { FEATURES, ACTIONS, DATA_SCOPES, ORGANIZATION_ROLES } from "@/lib/permissions-config";

export default function PermissionsPage() {
  const {
    users,
    roles,
    currentUser,
    organizationType,
    setOrganizationType,
    assignRole,
    removeRole,
    updateUserPermissions,
    impersonateUser,
    stopImpersonation,
    isImpersonating,
    originalUser,
    getUserRole,
    getUserPermissions,
    getAuditLogs,
    checkPermission
  } = usePermissions();

  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Check if current user can manage permissions
  const canManagePermissions = checkPermission(FEATURES.PERMISSIONS, ACTIONS.MANAGE);
  const canViewAuditLogs = currentUser ? getUserRole(currentUser)?.canViewAuditLogs : false;

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "audit", label: "Audit Logs", icon: Activity, show: canViewAuditLogs }
  ].filter(tab => tab.show !== false);

  const handleAssignRole = (userId, roleId) => {
    assignRole(userId, roleId);
    setSelectedUser(null);
  };

  const handleImpersonate = (userId) => {
    if (impersonateUser(userId)) {
      alert(`Now viewing as ${users.find(u => u.id === userId)?.name}`);
    } else {
      alert("You don't have permission to impersonate users");
    }
  };

  const renderUserCard = (user) => {
    const role = getUserRole(user);
    const permissions = getUserPermissions(user);
    const isCurrentUser = user.id === currentUser?.id;

    return (
      <Card key={user.id} className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                {isCurrentUser && (
                  <Badge variant="gradient" className="text-xs">You</Badge>
                )}
                {user.id === originalUser?.id && isImpersonating && (
                  <Badge variant="secondary" className="text-xs">Original</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {role.name}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {role.dataScope}
                </Badge>
                {permissions.includes('*:*') && (
                  <Badge variant="gradient" className="text-xs">
                    Super Admin
                  </Badge>
                )}
              </div>
            </div>
            
            {canManagePermissions && !isCurrentUser && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(user)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {getUserRole(currentUser).canImpersonate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImpersonate(user.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Permission Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access Summary
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                {checkPermission(FEATURES.DASHBOARD, ACTIONS.VIEW, user) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span className="text-gray-600 dark:text-gray-400">Dashboard</span>
              </div>
              <div className="flex items-center gap-1">
                {checkPermission(FEATURES.REPORTS, ACTIONS.VIEW, user) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span className="text-gray-600 dark:text-gray-400">Reports</span>
              </div>
              <div className="flex items-center gap-1">
                {checkPermission(FEATURES.EMAIL_BUILDER, ACTIONS.CREATE, user) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span className="text-gray-600 dark:text-gray-400">Create Content</span>
              </div>
              <div className="flex items-center gap-1">
                {checkPermission(FEATURES.CAMPAIGNS, ACTIONS.APPROVE, user) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span className="text-gray-600 dark:text-gray-400">Approve</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRoleCard = (role) => {
    const usersWithRole = users.filter(u => u.roleId === role.id);

    return (
      <Card key={role.id} className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {role.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {role.description}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  Level {role.level}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {role.dataScope}
                </Badge>
                {role.isSystem && (
                  <Badge variant="gradient" className="text-xs">System</Badge>
                )}
                {role.isCustom && (
                  <Badge className="text-xs">Custom</Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {usersWithRole.length}
              </p>
              <p className="text-xs text-gray-500">users</p>
            </div>
          </div>

          {/* Permissions Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Permissions
            </p>
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 5).map((perm, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {perm}
                </Badge>
              ))}
              {role.permissions.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{role.permissions.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAuditLogs = () => {
    const logs = getAuditLogs({ limit: 50 });

    return (
      <div className="space-y-2">
        {logs.length === 0 ? (
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="py-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No audit logs available</p>
            </CardContent>
          </Card>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.eventType}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    User: {users.find(u => u.id === log.userId)?.name || log.userId}
                    {log.impersonatedUserId && (
                      <span> (as {users.find(u => u.id === log.impersonatedUserId)?.name})</span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Permissions Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles, permissions, and access control
          </p>
        </div>

        {isImpersonating && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Viewing as: {currentUser?.name}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Original: {originalUser?.name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopImpersonation}
                  className="text-xs"
                >
                  Exit View
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Organization Type Selector */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Organization Type</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your organization type to see relevant roles
              </p>
            </div>
            <div className="flex gap-2">
              {['AGENCY', 'FRANCHISE', 'ENTERPRISE'].map(type => (
                <Button
                  key={type}
                  variant={organizationType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrganizationType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-blue text-sky-blue'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(user => renderUserCard(user))}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map(role => renderRoleCard(role))}
        </div>
      )}

      {activeTab === 'audit' && renderAuditLogs()}

      {/* Edit User Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Edit User: {selectedUser.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Assign Role</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {roles.map(role => (
                      <button
                        key={role.id}
                        onClick={() => handleAssignRole(selectedUser.id, role.id)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedUser.roleId === role.id
                            ? 'border-sky-blue bg-blue-50 dark:bg-sky-blue/10'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {role.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {role.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}