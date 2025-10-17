"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  Plus,
  Edit2,
  CheckCircle,
  Check,
  X,
  Settings,
  Store as StoreIcon,
  Mail,
  Users
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import { useStores } from "@/app/contexts/store-context";
import UsersRolesTabs from "@/app/components/users/users-roles-tabs";
import CreateCustomRoleDialog from "@/app/components/roles/create-custom-role-dialog";

export default function RolesPage() {
  const router = useRouter();
  const { stores, isLoadingStores } = useStores();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contractId, setContractId] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Get contract ID from first store
  useEffect(() => {
    if (stores && stores.length > 0) {
      const firstStore = stores[0];
      setContractId(firstStore.contract_id);
    }
  }, [stores]);

  // Fetch roles when contract ID is available
  useEffect(() => {
    if (contractId) {
      fetchRoles();
    }
  }, [contractId]);

  const fetchRoles = async () => {
    if (!contractId) return;

    setLoadingRoles(true);
    try {
      const response = await fetch(`/api/roles?contractId=${contractId}`);
      const data = await response.json();

      if (response.ok) {
        setRoles(data.roles || []);
        // Auto-select first role if none selected
        if (!selectedRole && data.roles.length > 0) {
          setSelectedRole(data.roles[0]);
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load roles",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive"
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const handlePermissionToggle = (category, action) => {
    if (!editingPermissions || selectedRole.is_system_role) return;

    setEditingPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [action]: !prev[category]?.[action]
      }
    }));
  };

  const handleStartEditing = () => {
    if (selectedRole.is_system_role) {
      toast({
        title: "Cannot Edit System Role",
        description: "System roles cannot be modified. Create a custom role instead.",
        variant: "destructive"
      });
      return;
    }
    setEditingPermissions(selectedRole.permissions);
  };

  const handleCancelEditing = () => {
    setEditingPermissions(null);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole || !editingPermissions) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/roles/${selectedRole._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: editingPermissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role permissions updated successfully"
        });
        setEditingPermissions(null);
        fetchRoles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update role",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleLevelBadge = (level) => {
    if (level >= 80) return "bg-vivid-violet text-white";
    if (level >= 60) return "bg-royal-blue text-white";
    if (level >= 40) return "bg-sky-blue text-white";
    return "bg-gray-500 text-white";
  };

  // Permission categories with their actions
  const permissionCategories = [
    {
      name: 'stores',
      label: 'Stores',
      icon: StoreIcon,
      actions: [
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
        { key: 'manage_integrations', label: 'Manage Integrations' }
      ]
    },
    {
      name: 'campaigns',
      label: 'Campaigns',
      icon: Mail,
      actions: [
        { key: 'create', label: 'Create' },
        { key: 'edit_own', label: 'Edit Own' },
        { key: 'edit_all', label: 'Edit All' },
        { key: 'approve', label: 'Approve' },
        { key: 'send', label: 'Send' },
        { key: 'delete', label: 'Delete' }
      ]
    },
    {
      name: 'ai',
      label: 'AI Features',
      icon: Settings,
      actions: [
        { key: 'generate_content', label: 'Generate Content' },
        { key: 'use_premium_models', label: 'Premium Models' },
        { key: 'unlimited_regenerations', label: 'Unlimited Regenerations' }
      ]
    },
    {
      name: 'brands',
      label: 'Brands',
      icon: Shield,
      actions: [
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' }
      ]
    },
    {
      name: 'team',
      label: 'Team',
      icon: Users,
      actions: [
        { key: 'invite_users', label: 'Invite Users' },
        { key: 'remove_users', label: 'Remove Users' },
        { key: 'manage_roles', label: 'Manage Roles' },
        { key: 'manage_store_access', label: 'Manage Store Access' }
      ]
    },
    {
      name: 'analytics',
      label: 'Analytics',
      icon: Settings,
      actions: [
        { key: 'view_own', label: 'View Own' },
        { key: 'view_all', label: 'View All' },
        { key: 'export', label: 'Export' },
        { key: 'view_financial', label: 'View Financial' }
      ]
    },
    {
      name: 'billing',
      label: 'Billing',
      icon: Settings,
      actions: [
        { key: 'view', label: 'View' },
        { key: 'manage', label: 'Manage' },
        { key: 'purchase_credits', label: 'Purchase Credits' }
      ]
    }
  ];

  const permissionsToDisplay = editingPermissions || selectedRole?.permissions || {};

  const handleRoleCreated = (newRole) => {
    // Refresh roles list
    fetchRoles();
    // Auto-select the newly created role
    setSelectedRole(newRole);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Create Custom Role Dialog */}
      <CreateCustomRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleRoleCreated}
        contractId={contractId}
      />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stores')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Stores
              </Button>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={!contractId}
              className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Custom Role
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Manage Users & Permissions
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage user access and permissions for your stores
            </p>
          </div>

          {/* Tabs */}
          <UsersRolesTabs />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Roles List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles ({roles.length})
            </h2>

            {loadingRoles ? (
              <div className="flex justify-center py-8">
                <MorphingLoader size="small" showThemeText={false} />
              </div>
            ) : roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map((role) => (
                  <Card
                    key={role._id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedRole?._id === role._id
                        ? 'border-2 border-vivid-violet bg-vivid-violet/5 dark:bg-vivid-violet/10'
                        : 'border border-gray-200 dark:border-gray-700 hover:border-vivid-violet/50'
                    } ${
                      !role.is_system_role
                        ? 'border-l-4 border-l-sky-blue'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedRole(role);
                      setEditingPermissions(null);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {role.display_name}
                            </h3>
                            {role.is_system_role ? (
                              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
                                System
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-sky-blue text-white">
                                Custom
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {role.description}
                          </p>
                          <Badge className={`text-xs ${getRoleLevelBadge(role.level)}`}>
                            Level {role.level}
                          </Badge>
                        </div>
                        {selectedRole?._id === role._id && (
                          <CheckCircle className="h-5 w-5 text-vivid-violet flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No roles available
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Role Permissions */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          {selectedRole ? (
            <>
              {/* Role Header */}
              <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedRole.display_name}
                      </h2>
                      <Badge className={`text-xs ${getRoleLevelBadge(selectedRole.level)}`}>
                        Level {selectedRole.level}
                      </Badge>
                      {selectedRole.is_system_role && (
                        <Badge variant="outline" className="text-xs">System Role</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRole.description}
                    </p>
                  </div>

                  {editingPermissions ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEditing}
                      disabled={selectedRole.is_system_role}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Permissions
                    </Button>
                  )}
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {permissionCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Card key={category.name} className="border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Icon className="h-5 w-5 text-vivid-violet" />
                            {category.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {category.actions.map((action) => {
                              const isAllowed = permissionsToDisplay[category.name]?.[action.key] === true;
                              const isEditing = editingPermissions !== null;

                              return (
                                <div
                                  key={action.key}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    isEditing && !selectedRole.is_system_role
                                      ? 'cursor-pointer hover:border-vivid-violet hover:bg-vivid-violet/5'
                                      : ''
                                  } ${
                                    isAllowed
                                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                                      : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                                  }`}
                                  onClick={() => isEditing && handlePermissionToggle(category.name, action.key)}
                                >
                                  <span className={`text-sm font-medium ${
                                    isAllowed
                                      ? 'text-green-700 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {action.label}
                                  </span>
                                  {isAllowed ? (
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Capabilities Section */}
                  {selectedRole.capabilities && (
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Settings className="h-5 w-5 text-vivid-violet" />
                          Special Capabilities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(selectedRole.capabilities).map(([key, value]) => {
                            const isBoolean = typeof value === 'boolean';
                            const isAllowed = isBoolean ? value : value !== 'low';

                            return (
                              <div
                                key={key}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isAllowed
                                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                                }`}
                              >
                                <span className={`text-sm font-medium ${
                                  isAllowed
                                    ? 'text-green-700 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                {isBoolean ? (
                                  isAllowed ? (
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-400" />
                                  )
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    {value}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Role
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose a role from the list to view and manage its permissions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
