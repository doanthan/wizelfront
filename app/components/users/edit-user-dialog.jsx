"use client";

import { useState, useEffect } from "react";
import { Shield, Save, Store as StoreIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";

export default function EditUserDialog({ isOpen, onClose, seat, contractId, onSuccess }) {
  const [selectedRoleId, setSelectedRoleId] = useState(seat?.default_role_id?._id || "");
  const [selectedStores, setSelectedStores] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { toast } = useToast();

  // Initialize form with seat data
  useEffect(() => {
    if (seat) {
      setSelectedRoleId(seat.default_role_id?._id || "");
      setSelectedStores(seat.store_access?.map(access => access.store_id) || []);
    }
  }, [seat]);

  // Fetch roles and stores
  useEffect(() => {
    if (isOpen) {
      fetchRolesAndStores();
    }
  }, [isOpen]);

  const fetchRolesAndStores = async () => {
    setLoadingData(true);
    try {
      // Fetch system roles
      const rolesResponse = await fetch('/api/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }

      // Fetch stores for this contract
      const storesResponse = await fetch('/api/stores');
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        setStores(storesData.stores || []);
      }
    } catch (error) {
      console.error('Error fetching roles and stores:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast({
        title: "Validation Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const storeAccess = selectedStores.map(storeId => ({
        store_id: storeId,
        granted_at: new Date()
      }));

      const response = await fetch(`/api/contract/seats/${seat._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRoleId,
          storeAccess: storeAccess.length > 0 ? storeAccess : []
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStoreSelection = (storeId) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const getRoleBadgeColor = (roleLevel) => {
    if (roleLevel >= 80) return "bg-vivid-violet text-white";
    if (roleLevel >= 60) return "bg-royal-blue text-white";
    if (roleLevel >= 40) return "bg-sky-blue text-white";
    return "bg-gray-500 text-white";
  };

  const selectedRole = roles.find(r => r._id === selectedRoleId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Edit User Permissions
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Update role and store access for {seat?.user_id?.name || seat?.invitation_email}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center items-center py-8">
            <MorphingLoader size="small" showText={false} />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* User Info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-vivid-violet/10 dark:bg-vivid-violet/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-vivid-violet">
                    {(seat?.user_id?.name || seat?.invitation_email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {seat?.user_id?.name || 'Pending Invitation'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {seat?.user_id?.email || seat?.invitation_email}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Role
              </Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{role.display_name}</span>
                        <span className="text-xs text-gray-500">({role.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role Details */}
              {selectedRole && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${getRoleBadgeColor(selectedRole.level)}`}>
                      Level {selectedRole.level}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedRole.display_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedRole.description}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Permissions:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRole.permissions?.campaigns?.create && (
                        <Badge variant="outline" className="text-xs">Create Campaigns</Badge>
                      )}
                      {selectedRole.permissions?.campaigns?.approve && (
                        <Badge variant="outline" className="text-xs">Approve Content</Badge>
                      )}
                      {selectedRole.permissions?.team?.invite_users && (
                        <Badge variant="outline" className="text-xs">Invite Users</Badge>
                      )}
                      {selectedRole.permissions?.analytics?.view_all && (
                        <Badge variant="outline" className="text-xs">View Analytics</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Store Access */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Store Access
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Leave empty to grant access to all stores in the contract
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                {stores.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No stores available
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {stores.map((store) => (
                      <div
                        key={store._id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => toggleStoreSelection(store._id)}
                      >
                        <Checkbox
                          checked={selectedStores.includes(store._id)}
                          onCheckedChange={() => toggleStoreSelection(store._id)}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <StoreIcon className="h-4 w-4 text-vivid-violet" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {store.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedStores.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || loadingData || !selectedRoleId}
            className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
          >
            {loading ? (
              <>
                <MorphingLoader size="small" showThemeText={false} />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
