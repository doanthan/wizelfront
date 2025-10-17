"use client";

import { useState, useEffect } from "react";
import { Mail, Shield, UserPlus, Store as StoreIcon, X, Search, Users, AlertCircle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import Link from "next/link";

export default function InviteUserDialog({ isOpen, onClose, contractId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedStores, setSelectedStores] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [seatUsage, setSeatUsage] = useState(null);
  const { toast } = useToast();

  // Fetch roles and stores
  useEffect(() => {
    if (isOpen) {
      fetchRolesAndStores();
    }
  }, [isOpen]);

  const fetchRolesAndStores = async () => {
    setLoadingData(true);
    try {
      // Fetch both system and custom roles for this contract
      const rolesResponse = await fetch(`/api/roles?contractId=${contractId}`);
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }

      // Fetch stores for this contract
      const storesResponse = await fetch('/api/store');
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        setStores(storesData.stores || []);
      }

      // Fetch contract details to get seat usage
      const contractResponse = await fetch(`/api/contract?id=${contractId}`);
      if (contractResponse.ok) {
        const contractData = await contractResponse.json();
        if (contractData.usage?.seats) {
          // Parse "5/10" format
          const [current, max] = contractData.usage.seats.split('/').map(Number);
          setSeatUsage({ current, max, remaining: max - current });
        }
      }
    } catch (error) {
      console.error('Error fetching roles and stores:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInvite = async () => {
    if (!email || !selectedRoleId) {
      toast({
        title: "Validation Error",
        description: "Please provide an email and select a role",
        variant: "destructive"
      });
      return;
    }

    // Check if seats are available
    if (seatUsage && seatUsage.remaining === 0) {
      toast({
        title: "No Seats Available",
        description: "You've reached your maximum seat limit. Please upgrade your plan to invite more users.",
        variant: "destructive"
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
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

      const response = await fetch('/api/contract/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          email: email.toLowerCase().trim(),
          roleId: selectedRoleId,
          storeAccess: storeAccess.length > 0 ? storeAccess : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        // Reset form
        setEmail("");
        setSelectedRoleId("");
        setSelectedStores([]);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to invite user",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to invite user",
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

  const selectAllStores = () => {
    setSelectedStores(filteredStores.map(s => s._id));
  };

  const clearAllStores = () => {
    setSelectedStores([]);
  };

  const getRoleBadgeColor = (roleLevel) => {
    if (roleLevel >= 80) return "bg-vivid-violet text-white";
    if (roleLevel >= 60) return "bg-royal-blue text-white";
    if (roleLevel >= 40) return "bg-sky-blue text-white";
    return "bg-gray-500 text-white";
  };

  // Filter stores based on search query
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
    store.public_id?.toLowerCase().includes(storeSearchQuery.toLowerCase())
  );

  const selectedRole = roles.find(r => r._id === selectedRoleId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Invite User
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Send an invitation to join your contract
              </DialogDescription>
            </div>
            {seatUsage && (
              <div className="ml-4 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  seatUsage.remaining === 0
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : seatUsage.remaining <= 2
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800'
                }`}>
                  <Users className={`h-4 w-4 ${
                    seatUsage.remaining === 0
                      ? 'text-red-600 dark:text-red-400'
                      : seatUsage.remaining <= 2
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-sky-600 dark:text-sky-400'
                  }`} />
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {seatUsage.remaining} / {seatUsage.max}
                    </div>
                    <div className={`text-xs ${
                      seatUsage.remaining === 0
                        ? 'text-red-600 dark:text-red-400'
                        : seatUsage.remaining <= 2
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {seatUsage.remaining === 0 ? 'No seats available' : 'seats remaining'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* No Seats Warning Banner */}
        {seatUsage && seatUsage.remaining === 0 && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  No Available Seats
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  You've reached your maximum seat limit ({seatUsage.max} seats). To invite more users, please upgrade your plan.
                </p>
                <Link href="/billing">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {loadingData ? (
            <div className="flex justify-center items-center py-8">
              <MorphingLoader size="small" showText={false} />
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="role" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Role
                </Label>
                <Link
                  href="/stores/roles"
                  className="text-xs text-sky-blue hover:text-royal-blue dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 transition-colors"
                  target="_blank"
                >
                  <Shield className="h-3 w-3" />
                  Create Role
                </Link>
              </div>
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
                        {!role.is_system_role && (
                          <Badge className="text-xs bg-sky-blue text-white">Custom</Badge>
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          ({role.description})
                        </span>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Store Access (Optional)
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Leave empty to grant access to all stores in the contract
                  </p>
                </div>
                {stores.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllStores}
                      disabled={loading}
                      className="text-xs h-7"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllStores}
                      disabled={loading || selectedStores.length === 0}
                      className="text-xs h-7"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Search Input */}
              {stores.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search stores..."
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Selected Stores Summary */}
              {selectedStores.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-sky-50 dark:bg-gray-800 rounded-lg border border-sky-200 dark:border-gray-600">
                  {selectedStores.slice(0, 5).map((storeId) => {
                    const store = stores.find(s => s._id === storeId);
                    return store ? (
                      <Badge
                        key={storeId}
                        variant="secondary"
                        className="gap-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <StoreIcon className="h-3 w-3" />
                        {store.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStoreSelection(storeId);
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                  {selectedStores.length > 5 && (
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700">
                      +{selectedStores.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Store List */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                {stores.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No stores available
                  </div>
                ) : filteredStores.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No stores found matching "{storeSearchQuery}"
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredStores.map((store) => (
                      <div
                        key={store._id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
                        onClick={() => toggleStoreSelection(store._id)}
                      >
                        <Checkbox
                          checked={selectedStores.includes(store._id)}
                          onCheckedChange={() => toggleStoreSelection(store._id)}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <StoreIcon className="h-4 w-4 text-vivid-violet flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-900 dark:text-white block truncate">
                              {store.name}
                            </span>
                            {store.public_id && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {store.public_id}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedStores.includes(store._id) && (
                          <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Selected
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Store Count Info */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {selectedStores.length > 0
                    ? `${selectedStores.length} of ${stores.length} store${stores.length !== 1 ? 's' : ''} selected`
                    : `${stores.length} store${stores.length !== 1 ? 's' : ''} available`}
                </span>
                {storeSearchQuery && (
                  <span>
                    Showing {filteredStores.length} result{filteredStores.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4 px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading || loadingData || !email || !selectedRoleId || (seatUsage && seatUsage.remaining === 0)}
            className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <MorphingLoader size="small" showThemeText={false} />
                Sending Invitation...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {seatUsage && seatUsage.remaining === 0 ? 'No Seats Available' : 'Send Invitation'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
