"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Store as StoreIcon,
  ArrowLeft,
  Shield,
  Mail,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Edit2,
  Trash2
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import { useStores } from "@/app/contexts/store-context";
import InviteUserDialog from "@/app/components/users/invite-user-dialog";
import EditUserDialog from "@/app/components/users/edit-user-dialog";
import UsersRolesTabs from "@/app/components/users/users-roles-tabs";

export default function UserManagementPage() {
  const router = useRouter();
  const { stores, isLoadingStores } = useStores();
  const [selectedStore, setSelectedStore] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);
  const [contractId, setContractId] = useState(null);

  const { toast } = useToast();

  // Get contract ID from first store
  useEffect(() => {
    if (stores && stores.length > 0) {
      const firstStore = stores[0];
      setContractId(firstStore.contract_id);
      setSelectedStore(firstStore);
    }
  }, [stores]);

  // Fetch seats when contract ID changes
  useEffect(() => {
    if (contractId) {
      fetchSeats();
    }
  }, [contractId]);

  const fetchSeats = async () => {
    if (!contractId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/contract/seats?contractId=${contractId}`);
      const data = await response.json();

      if (response.ok) {
        setSeats(data.seats || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load users",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (seatId, roleName) => {
    // Prevent deleting owners
    if (roleName === 'owner') {
      toast({
        title: "Cannot Remove Owner",
        description: "The contract owner cannot be removed. Transfer ownership first.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm("Are you sure you want to remove this user's access?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contract/seats/${seatId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "User access revoked successfully"
        });
        fetchSeats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove user",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      });
    }
  };

  const handleSuspendUser = async (seatId, suspend = true, roleName) => {
    // Prevent suspending owners
    if (roleName === 'owner') {
      toast({
        title: "Cannot Suspend Owner",
        description: "The contract owner cannot be suspended.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/contract/seats/${seatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: suspend ? 'suspended' : 'active'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: suspend ? "User suspended" : "User reactivated"
        });
        fetchSeats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  // Filter seats based on selected store
  const filteredSeats = seats.filter(seat => {
    const matchesSearch =
      seat.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seat.user_id?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seat.default_role_id?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || seat.status === statusFilter;

    // Filter by selected store
    const matchesStore = !selectedStore ||
      seat.store_access.length === 0 || // Users with no specific store access have access to all stores
      seat.store_access.some(access => access.store_id === selectedStore._id);

    return matchesSearch && matchesStatus && matchesStore;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
            <Ban className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getRoleBadgeColor = (roleLevel) => {
    if (roleLevel >= 80) return "bg-vivid-violet text-white";
    if (roleLevel >= 60) return "bg-royal-blue text-white";
    if (roleLevel >= 40) return "bg-sky-blue text-white";
    return "bg-gray-500 text-white";
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
              onClick={() => setShowInviteDialog(true)}
              className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Invite User
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
        {/* Left Panel - Stores */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <StoreIcon className="h-4 w-4" />
              Stores ({stores?.length || 0})
            </h2>

            {isLoadingStores ? (
              <div className="flex justify-center py-8">
                <MorphingLoader size="small" showThemeText={false} />
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="space-y-2">
                {stores.map((store) => (
                  <Card
                    key={store._id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStore?._id === store._id
                        ? 'border-2 border-vivid-violet bg-vivid-violet/5 dark:bg-vivid-violet/10'
                        : 'border border-gray-200 dark:border-gray-700 hover:border-vivid-violet/50'
                    }`}
                    onClick={() => setSelectedStore(store)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-vivid-violet/10 dark:bg-vivid-violet/20 flex items-center justify-center flex-shrink-0">
                          <StoreIcon className="h-5 w-5 text-vivid-violet" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {store.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                            {store.public_id}
                          </p>
                        </div>
                        {selectedStore?._id === store._id && (
                          <CheckCircle className="h-5 w-5 text-vivid-violet flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No stores available
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Users */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          {/* Filters */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedStore && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Showing users for:</span>
                <Badge variant="outline" className="gap-1">
                  <StoreIcon className="h-3 w-3" />
                  {selectedStore.name}
                </Badge>
              </div>
            )}
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <MorphingLoader size="medium" showText={true} text="Loading users..." />
              </div>
            ) : filteredSeats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery || statusFilter !== "all" ? "No users found" : "No users yet"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by inviting your first team member"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite User
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSeats.map((seat) => (
                  <Card key={seat._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-6">
                        {/* User Info - Left Side */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-blue to-vivid-violet flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-white">
                              {(seat.user_id?.name || seat.invitation_email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {seat.user_id?.name || 'Pending Invitation'}
                              </h4>
                              {getStatusBadge(seat.status)}
                              <Badge className={`text-xs ${getRoleBadgeColor(seat.default_role_id?.level)}`}>
                                <Shield className="h-3 w-3 mr-1" />
                                {seat.default_role_id?.display_name || 'No Role'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span>{seat.user_id?.email || seat.invitation_email}</span>
                            </div>

                            {/* Store Access */}
                            {seat.store_access && seat.store_access.length > 0 ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Store Access:
                                </span>
                                {seat.store_access.slice(0, 5).map((access, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                                    <StoreIcon className="h-3 w-3 mr-1" />
                                    {access.store_name || access.store_public_id || 'Unknown'}
                                  </Badge>
                                ))}
                                {seat.store_access.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{seat.store_access.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Access:
                                </span>
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                  All Stores
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions - Right Side */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSeat(seat)}
                            className="h-9 gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          {seat.status === 'active' && seat.default_role_id?.name !== 'owner' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(seat._id, true, seat.default_role_id?.name)}
                              className="h-9 px-3"
                              title="Suspend User"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : seat.status === 'suspended' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(seat._id, false, seat.default_role_id?.name)}
                              className="h-9 px-3"
                              title="Activate User"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(seat._id, seat.default_role_id?.name)}
                            disabled={seat.default_role_id?.name === 'owner'}
                            className={`h-9 px-3 ${
                              seat.default_role_id?.name === 'owner'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                            title={
                              seat.default_role_id?.name === 'owner'
                                ? "Cannot remove contract owner"
                                : "Remove User"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {filteredSeats.length > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredSeats.length} of {seats.length} users
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showInviteDialog && (
        <InviteUserDialog
          isOpen={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
          contractId={contractId}
          onSuccess={() => {
            setShowInviteDialog(false);
            fetchSeats();
            toast({
              title: "Success",
              description: "User invited successfully"
            });
          }}
        />
      )}

      {editingSeat && (
        <EditUserDialog
          isOpen={true}
          onClose={() => setEditingSeat(null)}
          seat={editingSeat}
          contractId={contractId}
          onSuccess={() => {
            setEditingSeat(null);
            fetchSeats();
            toast({
              title: "Success",
              description: "User updated successfully"
            });
          }}
        />
      )}
    </div>
  );
}
