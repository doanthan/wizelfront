"use client";

import { useState } from "react";
import { X, Shield, Users, Check, AlertCircle, UserPlus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useStores } from "@/app/contexts/store-context";

// Mock users - in production, this would come from your auth system
const MOCK_USERS = [
  { id: "user1", name: "John Doe", email: "john@example.com", role: "manager" },
  { id: "user2", name: "Jane Smith", email: "jane@example.com", role: "viewer" },
  { id: "user3", name: "Admin User", email: "admin@example.com", role: "admin" },
  { id: "user4", name: "Regional Manager", email: "regional@example.com", role: "manager" },
  { id: "user5", name: "Store Manager", email: "store@example.com", role: "manager" },
];

export default function PermissionsDialog({ onClose }) {
  const { tags, userPermissions, updateUserPermissions, stores } = useStores();
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    const currentPermissions = userPermissions[user.id] || [];
    setEditingPermissions(currentPermissions);
  };

  const toggleTagPermission = (tagId) => {
    setEditingPermissions(prev => 
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSavePermissions = () => {
    if (selectedUser) {
      updateUserPermissions(selectedUser.id, editingPermissions);
      alert(`Permissions updated for ${selectedUser.name}`);
    }
  };

  const handleGrantAllAccess = () => {
    setEditingPermissions([]);
  };

  const getAccessibleStoresCount = (userId) => {
    const permissions = userPermissions[userId];
    
    // Admin has access to all
    if (!permissions || permissions.length === 0) {
      return stores.length;
    }

    // Count stores accessible by tags
    const accessibleStores = stores.filter(store => 
      store.tags.some(tag => permissions.includes(tag))
    );
    
    return accessibleStores.length;
  };

  const getPermissionBadge = (userId) => {
    const permissions = userPermissions[userId];
    
    if (!permissions || permissions.length === 0) {
      return <Badge variant="gradient">Full Access</Badge>;
    }
    
    return <Badge variant="secondary">{permissions.length} tag(s)</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Store Access Permissions
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Control which stores users can access based on tags
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User List */}
            <div className="space-y-4">
              <div>
                <Label>Select User</Label>
                <div className="relative mt-2">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? "border-sky-blue bg-blue-50 dark:bg-sky-blue/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{user.role}</p>
                        {getPermissionBadge(user.id)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Access to {getAccessibleStoresCount(user.id)} of {stores.length} stores
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission Editor */}
            <div className="space-y-4">
              {selectedUser ? (
                <>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {selectedUser.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedUser.email}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedUser.role}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Tag-Based Access</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGrantAllAccess}
                        >
                          Grant Full Access
                        </Button>
                      </div>

                      {editingPermissions.length === 0 ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                              Full Access Granted
                            </p>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            This user can access all stores
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tags.map(tag => (
                            <label
                              key={tag.id}
                              className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={editingPermissions.includes(tag.id)}
                                  onChange={() => toggleTagPermission(tag.id)}
                                  className="rounded border-gray-300"
                                />
                                <Badge variant="secondary">{tag.name}</Badge>
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {stores.filter(s => s.tags.includes(tag.id)).length} stores
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Accessible Stores Preview
                        </h4>
                        <div className="space-y-1">
                          {stores
                            .filter(store => {
                              if (editingPermissions.length === 0) return true;
                              return store.tags.some(tag => editingPermissions.includes(tag));
                            })
                            .map(store => (
                              <div key={store.id} className="flex items-center gap-2 text-sm">
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-gray-700 dark:text-gray-300">{store.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      <Button
                        variant="default"
                        className="w-full"
                        onClick={handleSavePermissions}
                      >
                        Save Permissions
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a user to manage their permissions
                  </p>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  How Permissions Work
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Users can only access stores that have at least one of their assigned tags</li>
                  <li>• Full access (no tags selected) allows viewing all stores</li>
                  <li>• Changes take effect immediately</li>
                  <li>• Store visibility in dashboards and reports respects these permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}