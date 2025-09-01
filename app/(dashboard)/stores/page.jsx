"use client";

import { useState } from "react";
import { 
  Store, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Filter,
  MoreVertical,
  Shield,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { useStores } from "@/app/contexts/store-context";
import { usePermissions } from "@/app/contexts/permissions-context";
import { PermissionGuard, CanCreate, CanEdit, CanDelete } from "@/app/components/permissions/permission-guard";
import { FEATURES, ACTIONS } from "@/lib/permissions-config";
import StoreDialog from "@/app/components/stores/store-dialog";
import TagManager from "@/app/components/stores/tag-manager";
import PermissionsDialog from "@/app/components/stores/permissions-dialog";

export default function StoresPage() {
  const { 
    stores, 
    tags, 
    getUserAccessibleStores,
    currentUser,
    deleteStore,
    assignTagToStore,
    removeTagFromStore 
  } = useStores();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  // Get accessible stores for current user
  const accessibleStores = getUserAccessibleStores();

  // Filter stores based on search and selected tags
  const filteredStores = accessibleStores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => store.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleEditStore = (store) => {
    setEditingStore(store);
    setShowStoreDialog(true);
  };

  const handleDeleteStore = (storeId) => {
    if (confirm("Are you sure you want to delete this store?")) {
      deleteStore(storeId);
    }
  };

  const toggleTagFilter = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const getTagDetails = (tagId) => {
    return tags.find(t => t.id === tagId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Store Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your stores, tags, and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <CanEdit feature={FEATURES.STORES}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagManager(true)}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              Manage Tags
            </Button>
          </CanEdit>
          
          <PermissionGuard feature={FEATURES.STORES} action={ACTIONS.MANAGE}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPermissions(true)}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Permissions
            </Button>
          </PermissionGuard>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingStore(null);
              setShowStoreDialog(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Store
          </Button>
        </div>
      </div>


      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500" />
          {tags.map(tag => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTagFilter(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStores.map(store => (
          <Card key={store.id} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {store.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {store.tagNames?.map(tagName => (
                      <Badge 
                        key={tagName} 
                        variant="secondary"
                        className="text-xs"
                      >
                        {tagName}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <CanEdit feature={FEATURES.STORES}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStore(store)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </CanEdit>
                  
                  <CanDelete feature={FEATURES.STORES}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStore(store.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CanDelete>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Revenue */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${store.revenue.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {store.metrics.change > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${store.metrics.change > 0 ? "text-green-500" : "text-red-500"}`}>
                      {store.metrics.change > 0 ? "+" : ""}{store.metrics.change}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {store.orders}
                </p>
              </div>

              {/* AOV */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">AOV</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${store.metrics.aov.toFixed(2)}
                </p>
              </div>

              {/* Conversion Rate */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion</span>
                <Badge variant="gradient">
                  {store.metrics.conversionRate}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStores.length === 0 && (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No stores found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your search or filters"
                : "Get started by adding your first store"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showStoreDialog && (
        <StoreDialog
          store={editingStore}
          onClose={() => {
            setShowStoreDialog(false);
            setEditingStore(null);
          }}
        />
      )}

      {showTagManager && (
        <TagManager onClose={() => setShowTagManager(false)} />
      )}

      {showPermissions && (
        <PermissionsDialog onClose={() => setShowPermissions(false)} />
      )}
    </div>
  );
}