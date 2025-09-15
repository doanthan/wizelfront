"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  TrendingUp,
  Package,
  Palette,
  Mail,
  Settings,
  ExternalLink,
  CheckCircle,
  LayoutGrid,
  List,
  Loader2
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    stores, 
    tags, 
    getUserAccessibleStores,
    currentUser,
    deleteStore,
    assignTagToStore,
    removeTagFromStore,
    refreshStores,
    isLoadingStores 
  } = useStores();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"

  // Refresh stores when page mounts and check for action parameter
  useEffect(() => {
    console.log('Stores page mounted, refreshing stores...');
    if (refreshStores) {
      refreshStores();
    }
    
    // Check if we should open the add store dialog
    if (searchParams.get('action') === 'new') {
      setShowStoreDialog(true);
      // Remove the query parameter to clean up the URL
      router.replace('/stores');
    }
  }, [searchParams, router]);
  
  // Log stores when they change
  useEffect(() => {
    console.log('Stores updated in stores page:', stores);
  }, [stores]);

  // Get accessible stores for current user - use stores directly since API already filters
  // The getUserAccessibleStores function has issues with session not being ready
  const accessibleStores = stores || [];
  console.log('Stores page render - stores from context:', stores);
  console.log('Stores page render - accessible stores count:', accessibleStores.length);

  // Filter stores based on search and selected tags
  const filteredStores = accessibleStores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => store.tags.includes(tag));
    return matchesSearch && matchesTags;
  });
  console.log('Stores page render - filtered stores:', filteredStores.length);

  const handleEditStore = (store) => {
    // Navigate to individual store edit page using public_id
    router.push(`/store/${store.public_id}`);
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Stores
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your connected stores and integrations
          </p>
        </div>
        
        <Button
          onClick={() => {
            setEditingStore(null);
            setShowStoreDialog(true);
          }}
          className="gap-2 bg-royal-blue hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>


      {/* Search Bar and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            {filteredStores.length} of {accessibleStores.length} stores
          </p>
          <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className={viewMode === "card" ? "h-7 px-2" : "h-7 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "h-7 px-2" : "h-7 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingStores && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-blue" />
        </div>
      )}

      {/* Stores Display - Card or Table View */}
      {!isLoadingStores && viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStores.map(store => (
            <Card key={store.id} className="p-6">
            <div className="flex items-start justify-between mb-4 gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-vivid-violet/10 dark:bg-vivid-violet/20 flex items-center justify-center flex-shrink-0">
                  <Store className="h-6 w-6 text-vivid-violet" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {store.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                    {store.url || `www.${store.name.toLowerCase().replace(/\s/g, '')}.com`}
                  </p>
                </div>
              </div>
              <Badge variant="success" className="text-xs flex-shrink-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>

            {/* Integrations */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Integrations</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                  <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
                  Shopify
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                  Klaviyo
                </Badge>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Products</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Brands</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-vivid-violet">0</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Campaigns</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm"
                onClick={() => handleEditStore(store)}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => window.open(store.url || `https://${store.name.toLowerCase().replace(/\s/g, '')}.com`, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
            </Card>
          ))}
        </div>
      ) : !isLoadingStores ? (
        /* Table View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Store</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">Status</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">Integrations</th>
                <th className="text-center py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">Products</th>
                <th className="text-center py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">Brands</th>
                <th className="text-center py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Campaigns</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStores.map(store => (
                <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-vivid-violet/10 dark:bg-vivid-violet/20 flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-vivid-violet" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{store.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {store.url || `www.${store.name.toLowerCase().replace(/\s/g, '')}.com`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 hidden sm:table-cell">
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </td>
                  <td className="py-4 px-4 hidden lg:table-cell">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                        <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
                        Shopify
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                        Klaviyo
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center hidden md:table-cell">
                    <span className="text-gray-900 dark:text-white font-medium">0</span>
                  </td>
                  <td className="py-4 px-4 text-center hidden md:table-cell">
                    <span className="text-gray-900 dark:text-white font-medium">0</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-vivid-violet font-medium">0</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleEditStore(store)}
                      >
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        Manage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(store.url || `https://${store.name.toLowerCase().replace(/\s/g, '')}.com`, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      ) : null}

      {/* Empty State */}
      {!isLoadingStores && filteredStores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No stores found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Get started by connecting your first store"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => {
                setEditingStore(null);
                setShowStoreDialog(true);
              }}
              className="mt-4 gap-2 bg-royal-blue hover:bg-blue-700 text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Store
            </Button>
          )}
        </div>
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