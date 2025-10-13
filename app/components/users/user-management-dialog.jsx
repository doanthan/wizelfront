"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Store as StoreIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import InviteUserDialog from "./invite-user-dialog";
import EditUserDialog from "./edit-user-dialog";

export default function UserManagementDialog({ isOpen, onClose, contractId }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);
  const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log('UserManagementDialog - isOpen:', isOpen, 'contractId:', contractId);
  }, [isOpen, contractId]);

  // Fetch seats
  useEffect(() => {
    if (isOpen && contractId && contractId !== 'temp-contract-id') {
      fetchSeats();
    }
  }, [isOpen, contractId]);

  const fetchSeats = async () => {
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

  const handleInviteSuccess = () => {
    setShowInviteDialog(false);
    fetchSeats();
    toast({
      title: "Success",
      description: "User invited successfully"
    });
  };

  const handleUpdateSuccess = () => {
    setEditingSeat(null);
    fetchSeats();
    toast({
      title: "Success",
      description: "User updated successfully"
    });
  };

  const handleRemoveUser = async (seatId) => {
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

  const handleSuspendUser = async (seatId, suspend = true) => {
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

  // Filter seats
  const filteredSeats = seats.filter(seat => {
    const matchesSearch =
      seat.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seat.user_id?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seat.default_role_id?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || seat.status === statusFilter;

    return matchesSearch && matchesStatus;
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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Users
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Invite users, manage roles, and configure store access permissions
            </DialogDescription>
          </DialogHeader>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or role..."
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
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {!contractId || contractId === 'temp-contract-id' ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Contract Found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
                  Unable to load contract information. Please make sure you have stores set up or refresh the page.
                </p>
              </div>
            ) : loading ? (
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* User Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-vivid-violet/10 dark:bg-vivid-violet/20 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-vivid-violet" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {seat.user_id?.name || 'Unknown User'}
                              </h4>
                              {getStatusBadge(seat.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{seat.user_id?.email || seat.invitation_email}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`text-xs ${getRoleBadgeColor(seat.default_role_id?.level)}`}>
                                <Shield className="h-3 w-3 mr-1" />
                                {seat.default_role_id?.display_name || 'No Role'}
                              </Badge>
                              {seat.store_access && seat.store_access.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <StoreIcon className="h-3 w-3 mr-1" />
                                  {seat.store_access.length} store{seat.store_access.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSeat(seat)}
                            className="h-8"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          {seat.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(seat._id, true)}
                              className="h-8"
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {seat.status === 'suspended' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(seat._id, false)}
                              className="h-8"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(seat._id)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Store Access Details */}
                      {seat.store_access && seat.store_access.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Store Access:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {seat.store_access.map((access, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                                {access.store_name || access.store_public_id || 'Unknown Store'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer with stats */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredSeats.length} of {seats.length} users
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      {showInviteDialog && (
        <InviteUserDialog
          isOpen={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
          contractId={contractId}
          onSuccess={handleInviteSuccess}
        />
      )}

      {/* Edit User Dialog */}
      {editingSeat && (
        <EditUserDialog
          isOpen={true}
          onClose={() => setEditingSeat(null)}
          seat={editingSeat}
          contractId={contractId}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
}
