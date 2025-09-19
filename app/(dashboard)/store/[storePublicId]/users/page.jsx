"use client";

import { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useToast } from "@/app/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus,
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  UserX,
  UserPlus,
  Settings,
  Key,
  Clock,
  Building2,
  Store,
  Briefcase,
  ChevronRight,
  Check,
  Info,
  Sparkles,
  Lock,
  AlertCircle,
  Building,
  UserCog,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  BarChart,
  Package,
  Megaphone,
  Bot,
  Users2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";

// Role presets for different business types
const ROLE_PRESETS = {
  franchise: {
    name: "Franchise",
    icon: Store,
    description: "Multi-location brand management",
    roles: [
      {
        name: "Franchisor",
        level: 100,
        description: "Master brand owner with full control",
        key_permissions: ["Full brand control", "Location management", "Revenue tracking"]
      },
      {
        name: "Regional Manager", 
        level: 80,
        description: "Oversees multiple franchise locations",
        key_permissions: ["Multi-location access", "Performance monitoring", "Limited brand editing"]
      },
      {
        name: "Franchisee",
        level: 60,
        description: "Individual location owner",
        key_permissions: ["Own location management", "Local campaigns", "Limited customization"]
      },
      {
        name: "Location Staff",
        level: 40,
        description: "Store employees with basic access",
        key_permissions: ["Campaign creation", "View analytics", "No billing access"]
      }
    ]
  },
  agency: {
    name: "Agency",
    icon: Briefcase,
    description: "Client and project management",
    roles: [
      {
        name: "Agency Owner",
        level: 100,
        description: "Full agency control and client management",
        key_permissions: ["All client access", "Billing management", "Team administration"]
      },
      {
        name: "Account Director",
        level: 80,
        description: "Manages multiple client accounts",
        key_permissions: ["Multi-client access", "Campaign approval", "Team management"]
      },
      {
        name: "Creative Lead",
        level: 60,
        description: "Leads creative projects across accounts",
        key_permissions: ["Content creation", "Design approval", "Limited client access"]
      },
      {
        name: "Contractor",
        level: 30,
        description: "External freelancer with project access",
        key_permissions: ["Assigned projects only", "No financial data", "Time-limited access"]
      }
    ]
  },
  enterprise: {
    name: "Enterprise",
    icon: Building2,
    description: "Multi-account teams and organizations",
    roles: [
      {
        name: "Account Manager",
        level: 100,
        description: "Manages multiple accounts and teams",
        key_permissions: ["Multi-account access", "Team management", "Full analytics"]
      },
      {
        name: "Digital Manager",
        level: 80,
        description: "Oversees digital marketing operations",
        key_permissions: ["Campaign strategy", "Team coordination", "Performance tracking"]
      },
      {
        name: "Team Lead",
        level: 60,
        description: "Leads specific teams or projects",
        key_permissions: ["Team supervision", "Project management", "Content approval"]
      },
      {
        name: "Marketing Specialist",
        level: 40,
        description: "Creates and manages campaigns",
        key_permissions: ["Campaign creation", "Content management", "Basic reporting"]
      }
    ]
  }
};

// Permission categories for custom roles
const PERMISSION_CATEGORIES = [
  {
    id: 'stores',
    name: 'Stores & Products',
    icon: Package,
    permissions: [
      { id: 'create', label: 'Create stores', description: 'Can create new stores' },
      { id: 'edit', label: 'Edit stores', description: 'Can modify store settings' },
      { id: 'delete', label: 'Delete stores', description: 'Can permanently delete stores' },
      { id: 'manage_integrations', label: 'Manage integrations', description: 'Connect Shopify, Klaviyo, etc.' }
    ]
  },
  {
    id: 'campaigns',
    name: 'Campaigns & Content',
    icon: Megaphone,
    permissions: [
      { id: 'create', label: 'Create campaigns', description: 'Can create new campaigns' },
      { id: 'edit_own', label: 'Edit own campaigns', description: 'Can edit campaigns they created' },
      { id: 'edit_all', label: 'Edit all campaigns', description: 'Can edit any campaign' },
      { id: 'approve', label: 'Approve campaigns', description: 'Can approve campaigns for sending' },
      { id: 'send', label: 'Send campaigns', description: 'Can send campaigns to customers' },
      { id: 'delete', label: 'Delete campaigns', description: 'Can delete campaigns' }
    ]
  },
  {
    id: 'ai',
    name: 'AI & Automation',
    icon: Bot,
    permissions: [
      { id: 'generate_content', label: 'Generate content', description: 'Use AI to create content' },
      { id: 'use_premium_models', label: 'Premium AI models', description: 'Access to GPT-4 and Claude' },
      { id: 'unlimited_regenerations', label: 'Unlimited regenerations', description: 'No limits on AI usage' }
    ]
  },
  {
    id: 'team',
    name: 'Team Management',
    icon: Users2,
    permissions: [
      { id: 'invite_users', label: 'Invite users', description: 'Can invite new team members' },
      { id: 'remove_users', label: 'Remove users', description: 'Can remove team members' },
      { id: 'manage_roles', label: 'Manage roles', description: 'Can change user roles' },
      { id: 'manage_store_access', label: 'Store access', description: 'Control who accesses stores' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    icon: BarChart,
    permissions: [
      { id: 'view_own', label: 'View own analytics', description: 'See own performance data' },
      { id: 'view_all', label: 'View all analytics', description: 'See all team analytics' },
      { id: 'export', label: 'Export data', description: 'Download reports and data' },
      { id: 'view_financial', label: 'Financial data', description: 'View revenue and costs' }
    ]
  },
  {
    id: 'billing',
    name: 'Billing & Credits',
    icon: DollarSign,
    permissions: [
      { id: 'view', label: 'View billing', description: 'See billing information' },
      { id: 'manage', label: 'Manage billing', description: 'Update payment methods' },
      { id: 'purchase_credits', label: 'Purchase credits', description: 'Buy AI credits' }
    ]
  }
];

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storePublicId = params.storePublicId;

  const [store, setStore] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);
  
  // New states for enhanced role management
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedPresetRole, setSelectedPresetRole] = useState(null);
  const [inviteMode, setInviteMode] = useState("simple"); // simple, preset, custom
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // States for editing user permissions
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editMode, setEditMode] = useState("simple");
  const [editRole, setEditRole] = useState("viewer");
  const [editPreset, setEditPreset] = useState(null);
  const [editPresetRole, setEditPresetRole] = useState(null);
  const [editCustomRoleName, setEditCustomRoleName] = useState("");
  const [editCustomRoleDescription, setEditCustomRoleDescription] = useState("");
  const [editCustomPermissions, setEditCustomPermissions] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (storePublicId) {
      fetchStore();
      fetchUsers();
    }
  }, [storePublicId]);

  const fetchStore = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}`);
      if (!response.ok) {
        throw new Error('Store not found');
      }
      const data = await response.json();
      setStore(data.store);
    } catch (error) {
      console.error('Error fetching store:', error);
      toast({
        title: "Error",
        description: "Failed to load store details",
        variant: "destructive",
      });
      router.push('/stores');
    }
  };

  const fetchUsers = async () => {
    try {
      // For now, simulate users with just the owner
      setUsers([
        {
          id: session?.user?.id,
          name: session?.user?.name || "Store Owner",
          email: session?.user?.email,
          role: "owner",
          roleDisplay: "Owner",
          status: "active",
          joinedAt: store?.created_at || new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let roleInfo = "";
      if (inviteMode === "preset" && selectedPresetRole) {
        roleInfo = ` as ${selectedPresetRole.name} (${selectedPreset.name})`;
      } else if (inviteMode === "custom" && customRoleName) {
        roleInfo = ` with custom role: ${customRoleName}`;
      } else {
        roleInfo = ` as ${inviteRole}`;
      }
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}${roleInfo}`,
      });
      
      resetInviteForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const resetInviteForm = () => {
    setShowInviteDialog(false);
    setInviteEmail("");
    setInviteRole("viewer");
    setSelectedPreset(null);
    setSelectedPresetRole(null);
    setInviteMode("simple");
    setCustomRoleName("");
    setCustomRoleDescription("");
    setCustomPermissions({});
    setShowAdvanced(false);
  };

  const togglePermission = (category, permission) => {
    setCustomPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: !prev[category]?.[permission]
      }
    }));
  };
  
  const toggleEditPermission = (category, permission) => {
    setEditCustomPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: !prev[category]?.[permission]
      }
    }));
  };
  
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditRole(user.role || "viewer");
    setEditMode("simple");
    setEditPreset(null);
    setEditPresetRole(null);
    setEditCustomRoleName("");
    setEditCustomRoleDescription("");
    setEditCustomPermissions({});
    setShowEditDialog(true);
  };
  
  const handleUpdateUserPermissions = async () => {
    if (!editingUser) return;
    
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let roleInfo = "";
      if (editMode === "preset" && editPresetRole) {
        roleInfo = ` to ${editPresetRole.name} (${editPreset.name})`;
      } else if (editMode === "custom" && editCustomRoleName) {
        roleInfo = ` to custom role: ${editCustomRoleName}`;
      } else {
        roleInfo = ` to ${editRole}`;
      }
      
      // Update the user in the list
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === editingUser.id 
          ? { ...u, role: editRole, roleDisplay: editMode === "preset" ? editPresetRole?.name : editMode === "custom" ? editCustomRoleName : editRole }
          : u
      ));
      
      toast({
        title: "Permissions Updated",
        description: `Updated ${editingUser.name}'s role${roleInfo}`,
      });
      
      setShowEditDialog(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user permissions",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'owner':
        return 'bg-vivid-violet text-white';
      case 'admin':
        return 'bg-sky-blue text-white';
      case 'manager':
        return 'bg-royal-blue text-white';
      case 'creator':
        return 'bg-green-100 text-green-700';
      case 'reviewer':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="small" showThemeText={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/store/${storePublicId}`)}
                className="p-2 hover:bg-sky-tint/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">User Settings</h1>
                <span className="text-neutral-gray dark:text-gray-400">•</span>
                <p className="text-neutral-gray dark:text-gray-400">{store?.name || "Loading..."}</p>
              </div>
            </div>

            <Button 
              onClick={() => setShowInviteDialog(true)}
              className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/store/${storePublicId}`)}
              className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-3 py-1.5 text-sm"
            >
              Store Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/store/${storePublicId}/collections`)}
              className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-3 py-1.5 text-sm"
            >
              Collections
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/store/${storePublicId}/products`)}
              className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-3 py-1.5 text-sm"
            >
              Products
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/store/${storePublicId}/ctas`)}
              className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-3 py-1.5 text-sm"
            >
              CTAs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-sky-blue text-sky-blue px-3 py-1.5 text-sm"
            >
              User Settings
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-gray dark:text-white">Team Members</CardTitle>
                <CardDescription>Manage who has access to this store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-royal-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-gray dark:text-white">{user.name}</p>
                            <p className="text-sm text-neutral-gray dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.roleDisplay || user.role}
                          </Badge>
                          
                          {user.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <UserX className="h-4 w-4 mr-2" />
                                  Remove Access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-gray dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Joined {new Date(user.joinedAt).toLocaleDateString()}
                        </div>
                        {user.lastActive && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last active {user.lastActive}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-gray dark:text-white">System Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-vivid-violet text-white text-xs">Owner</Badge>
                  </div>
                  <p className="text-xs text-neutral-gray dark:text-gray-500">Full access to all features</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-sky-blue text-white text-xs">Admin</Badge>
                  </div>
                  <p className="text-xs text-neutral-gray dark:text-gray-500">Manage settings and campaigns</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-royal-blue text-white text-xs">Manager</Badge>
                  </div>
                  <p className="text-xs text-neutral-gray dark:text-gray-500">Team and campaign management</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-100 text-green-700 text-xs">Creator</Badge>
                  </div>
                  <p className="text-xs text-neutral-gray dark:text-gray-500">Create and edit content</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-gray-100 text-gray-700 text-xs">Viewer</Badge>
                  </div>
                  <p className="text-xs text-neutral-gray dark:text-gray-500">View-only access</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-gray dark:text-white">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Button variant="outline" className="w-full justify-between gap-2" disabled>
                    <span className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Two-Factor Authentication
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-700">Coming Soon</Badge>
                  </Button>
                </div>
                <div className="relative">
                  <Button variant="outline" className="w-full justify-between gap-2" disabled>
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Access Logs
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-700">Coming Soon</Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Choose how to set up access for {store?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={inviteMode} onValueChange={setInviteMode} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="preset">Business Presets</TabsTrigger>
              <TabsTrigger value="custom">Custom Role</TabsTrigger>
            </TabsList>
            
            {/* Simple Mode */}
            <TabsContent value="simple" className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-sky-blue" />
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-gray-500">Manage settings and campaigns</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-royal-blue" />
                        <div>
                          <div className="font-medium">Manager</div>
                          <div className="text-xs text-gray-500">Team and campaign management</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="creator">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Creator</div>
                          <div className="text-xs text-gray-500">Create and edit content</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="reviewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-yellow-600" />
                        <div>
                          <div className="font-medium">Reviewer</div>
                          <div className="text-xs text-gray-500">Review and approve content</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-gray-500">View-only access</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            {/* Business Presets */}
            <TabsContent value="preset" className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Business Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ROLE_PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all ${
                          selectedPreset?.name === preset.name 
                            ? 'ring-2 ring-sky-blue' 
                            : 'hover:border-sky-blue'
                        }`}
                        onClick={() => {
                          setSelectedPreset(preset);
                          setSelectedPresetRole(null);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-5 w-5 text-sky-blue" />
                            <h4 className="font-medium">{preset.name}</h4>
                          </div>
                          <p className="text-xs text-gray-500">{preset.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              {selectedPreset && (
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <div className="space-y-2">
                    {selectedPreset.roles.map((role) => (
                      <Card
                        key={role.name}
                        className={`cursor-pointer transition-all ${
                          selectedPresetRole?.name === role.name 
                            ? 'ring-2 ring-sky-blue' 
                            : 'hover:border-sky-blue'
                        }`}
                        onClick={() => setSelectedPresetRole(role)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-medium">{role.name}</h5>
                              <p className="text-xs text-gray-500">Level {role.level}</p>
                            </div>
                            {selectedPresetRole?.name === role.name && (
                              <Check className="h-5 w-5 text-sky-blue" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {role.key_permissions.map((perm, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Custom Role */}
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input
                    placeholder="e.g., Marketing Specialist"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (80-100)</SelectItem>
                      <SelectItem value="medium">Medium (40-79)</SelectItem>
                      <SelectItem value="low">Low (0-39)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the role's responsibilities..."
                  value={customRoleDescription}
                  onChange={(e) => setCustomRoleDescription(e.target.value)}
                  className="h-20"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sky-blue"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${
                      showAdvanced ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <AccordionItem key={category.id} value={category.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{category.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pl-6">
                            {category.permissions.map((perm) => (
                              <div key={perm.id} className="flex items-start gap-3">
                                <Switch
                                  checked={customPermissions[category.id]?.[perm.id] || false}
                                  onCheckedChange={() => togglePermission(category.id, perm.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{perm.label}</p>
                                  {showAdvanced && (
                                    <p className="text-xs text-gray-500">{perm.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetInviteForm}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={!inviteEmail || isInviting || 
                (inviteMode === 'preset' && !selectedPresetRole) ||
                (inviteMode === 'custom' && !customRoleName)
              }
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              {isInviting ? (
                <>
                  <MorphingLoader size="small" showThemeText={false} />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Permissions Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Update role and permissions for {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={editMode} onValueChange={setEditMode} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="preset">Business Presets</TabsTrigger>
              <TabsTrigger value="custom">Custom Role</TabsTrigger>
            </TabsList>
            
            {/* Simple Mode */}
            <TabsContent value="simple" className="space-y-4">
              <div className="space-y-2">
                <Label>Current Role: {editingUser?.roleDisplay || editingUser?.role}</Label>
              </div>
              
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-sky-blue" />
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-gray-500">Manage settings and campaigns</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-royal-blue" />
                        <div>
                          <div className="font-medium">Manager</div>
                          <div className="text-xs text-gray-500">Team and campaign management</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="creator">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Creator</div>
                          <div className="text-xs text-gray-500">Create and edit content</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="reviewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-yellow-600" />
                        <div>
                          <div className="font-medium">Reviewer</div>
                          <div className="text-xs text-gray-500">Review and approve content</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-gray-500">View-only access</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            {/* Business Presets */}
            <TabsContent value="preset" className="space-y-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ROLE_PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all ${
                          editPreset?.name === preset.name 
                            ? 'ring-2 ring-sky-blue' 
                            : 'hover:border-sky-blue'
                        }`}
                        onClick={() => {
                          setEditPreset(preset);
                          setEditPresetRole(null);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-5 w-5 text-sky-blue" />
                            <h4 className="font-medium">{preset.name}</h4>
                          </div>
                          <p className="text-xs text-gray-500">{preset.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              {editPreset && (
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <div className="space-y-2">
                    {editPreset.roles.map((role) => (
                      <Card
                        key={role.name}
                        className={`cursor-pointer transition-all ${
                          editPresetRole?.name === role.name 
                            ? 'ring-2 ring-sky-blue' 
                            : 'hover:border-sky-blue'
                        }`}
                        onClick={() => setEditPresetRole(role)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-medium">{role.name}</h5>
                              <p className="text-xs text-gray-500">Level {role.level}</p>
                            </div>
                            {editPresetRole?.name === role.name && (
                              <Check className="h-5 w-5 text-sky-blue" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {role.key_permissions.map((perm, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Custom Role */}
            <TabsContent value="custom" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input
                    placeholder="e.g., Marketing Specialist"
                    value={editCustomRoleName}
                    onChange={(e) => setEditCustomRoleName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (80-100)</SelectItem>
                      <SelectItem value="medium">Medium (40-79)</SelectItem>
                      <SelectItem value="low">Low (0-39)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the role's responsibilities..."
                  value={editCustomRoleDescription}
                  onChange={(e) => setEditCustomRoleDescription(e.target.value)}
                  className="h-20"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sky-blue"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${
                      showAdvanced ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <AccordionItem key={category.id} value={category.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{category.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pl-6">
                            {category.permissions.map((perm) => (
                              <div key={perm.id} className="flex items-start gap-3">
                                <Switch
                                  checked={editCustomPermissions[category.id]?.[perm.id] || false}
                                  onCheckedChange={() => toggleEditPermission(category.id, perm.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{perm.label}</p>
                                  {showAdvanced && (
                                    <p className="text-xs text-gray-500">{perm.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUserPermissions}
              disabled={isUpdating || 
                (editMode === 'preset' && !editPresetRole) ||
                (editMode === 'custom' && !editCustomRoleName)
              }
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              {isUpdating ? (
                <>
                  <MorphingLoader size="small" showThemeText={false} />
                  Updating...
                </>
              ) : (
                'Update Permissions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}