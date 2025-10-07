"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Tag,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Package,
  Edit,
  Trash2,
  Copy,
  LayoutGrid,
  List,
  Calendar,
  Link,
  Image,
  ShoppingBag,
  RefreshCw,
  Store
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

export default function CollectionsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storePublicId = params.storePublicId;

  const [store, setStore] = useState(null);
  const [collections, setCollections] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("table"); // "table" or "card"
  const [isShopifyStore, setIsShopifyStore] = useState(false);

  useEffect(() => {
    if (storePublicId) {
      console.log('Fetching collections for store:', storePublicId);
      fetchCollections(); // fetchStore is now handled inside fetchCollections
    }
  }, [storePublicId]);

  // Store data is now fetched along with collections in fetchCollections

  const fetchCollections = async () => {
    try {
      console.log('Making API call to:', `/api/store/${storePublicId}/collections`);
      const response = await fetch(`/api/store/${storePublicId}/collections`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - session may have expired');
          toast({
            title: "Session Expired",
            description: "Please log in again",
            variant: "destructive",
          });
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view collections for this store",
            variant: "destructive",
          });
          router.push(`/store/${storePublicId}`);
          return;
        }
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch collections: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Collections API Response:', data); // Debug logging
      setCollections(data.collections || []);
      setPermissions(data.permissions || {});
      setStore(data.store);

      // Check if any collection is from Shopify
      const hasShopifyCollections = data.collections?.some(col => col.isShopifyCollection);
      setIsShopifyStore(hasShopifyCollections);
      
      // Only redirect if explicitly no access, not just limited permissions
      if (data.permissions && !data.permissions.canEditBrands && !data.permissions.userRole) {
        toast({
          title: "Limited Access",
          description: "You don't have permission to manage collections",
          variant: "destructive",
        });
        router.push(`/store/${storePublicId}`);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = () => {
    // Navigate to create collection page
    router.push(`/store/${storePublicId}/collections/new`);
  };

  const handleViewCollection = (collectionId) => {
    router.push(`/store/${storePublicId}/collections/${collectionId}`);
  };

  const handleSyncShopifyCollections = async () => {
    try {
      toast({
        title: "Syncing Collections",
        description: "Fetching latest collections from Shopify...",
      });

      const response = await fetch(`/api/store/${storePublicId}/sync-shopify-collections`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to sync: ${response.status}`);
      }

      const data = await response.json();

      toast({
        title: "Sync Complete",
        description: data.message || "Collections synced successfully",
        variant: "default",
      });

      // Refresh collections
      await fetchCollections();

    } catch (error) {
      console.error('Error syncing collections:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync collections from Shopify",
        variant: "destructive",
      });
    }
  };

  const filteredCollections = collections.filter(collection => 
    collection.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Skeleton loader component
  const SkeletonCard = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow className="animate-pulse">
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div></TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
        </div>
      </TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></TableCell>
      <TableCell><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></TableCell>
    </TableRow>
  );

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
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">Collections</h1>
                {isShopifyStore && (
                  <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Shopify
                  </Badge>
                )}
                <span className="text-neutral-gray dark:text-gray-400">•</span>
                <p className="text-neutral-gray dark:text-gray-400">{store?.name || "Loading..."}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isShopifyStore && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSyncShopifyCollections}
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync Shopify
                </Button>
              )}
              {permissions.canCreateCollections && !isShopifyStore && (
                <Button
                  onClick={handleCreateCollection}
                  className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Collection
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs - Always show, let API handle permissions */}
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
              className="rounded-none border-b-2 border-sky-blue text-sky-blue px-3 py-1.5 text-sm"
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
              onClick={() => router.push(`/store/${storePublicId}/users`)}
              className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-3 py-1.5 text-sm"
            >
              User Settings
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          // Show skeleton loader while loading
          <div className="space-y-6">
            {/* Search and Filters Skeleton */}
            <Card>
              <CardContent className="py-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search collections..."
                      disabled
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" disabled>
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                    <div className="flex bg-white dark:bg-gray-800 border rounded-lg dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collections Skeleton */}
            {viewType === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Handle</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Products</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Last Synced</TableHead>
                        <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, i) => (
                        <SkeletonTableRow key={i} />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        ) : collections.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Tag className="h-12 w-12 text-neutral-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-gray dark:text-white mb-2">No Collections Yet</h3>
                <p className="text-neutral-gray dark:text-gray-400 mb-6">
                  {permissions.canCreateCollections 
                    ? "Create your first collection to organize products"
                    : "No collections have been created for this store yet"}
                </p>
                {permissions.canCreateCollections && (
                  <Button 
                    onClick={handleCreateCollection}
                    className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Collection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="py-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search collections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                    <div className="flex bg-white dark:bg-gray-800 border rounded-lg dark:border-gray-700">
                      <Button
                        variant={viewType === "card" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewType("card")}
                        className={viewType === "card" ? "bg-sky-blue text-white" : ""}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewType === "table" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewType("table")}
                        className={viewType === "table" ? "bg-sky-blue text-white" : ""}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collections View */}
            {viewType === "card" ? (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection) => (
                  <Card 
                    key={collection.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewCollection(collection.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                            {collection.isShopifyCollection ? (
                              <ShoppingBag className="h-4 w-4 text-green-600" />
                            ) : (
                              <Tag className="h-4 w-4 text-sky-blue" />
                            )}
                            {collection.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {collection.handle}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCollection(collection.id)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {collection.isShopifyCollection && collection.url_link && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(collection.url_link, '_blank');
                                }}
                              >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                View on Shopify
                              </DropdownMenuItem>
                            )}
                            {permissions.canEditCollections && !collection.isShopifyCollection && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                              </>
                            )}
                            {permissions.canDeleteCollections && !collection.isShopifyCollection && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{collection.products_count || 0} products</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant={collection.status === 'active' ? 'default' : 'secondary'}>
                            {collection.status}
                          </Badge>
                          {collection.sync_status && (
                            <Badge variant="outline">
                              {collection.sync_status}
                            </Badge>
                          )}
                        </div>

                        {collection.url_link && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Link className="h-3 w-3" />
                            <span className="truncate">{collection.domain}</span>
                          </div>
                        )}

                        <div className="mt-3 rounded-lg overflow-hidden bg-gray-100">
                          {collection.shopify_image?.src ? (
                            <img 
                              src={collection.shopify_image.src} 
                              alt={collection.shopify_image.alt || collection.title}
                              className="h-32 w-full object-cover"
                            />
                          ) : (
                            <div className="h-32 w-full flex items-center justify-center bg-gradient-to-br from-sky-tint to-lilac-mist">
                              <Image className="h-12 w-12 text-white opacity-50" />
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t text-xs text-gray-500">
                          Last synced: {collection.last_synced_at 
                            ? new Date(collection.last_synced_at).toLocaleDateString()
                            : 'Never'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Table View
              <Card>
                <CardContent className="p-0">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Handle</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Products</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Last Synced</TableHead>
                      <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollections.map((collection) => (
                      <TableRow 
                        key={collection.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b dark:border-gray-700"
                        onClick={() => handleViewCollection(collection.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {collection.isShopifyCollection ? (
                              <ShoppingBag className="h-4 w-4 text-green-600" />
                            ) : (
                              <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className="text-gray-900 dark:text-gray-100">{collection.title}</span>
                            {collection.isShopifyCollection && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                Shopify
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                          {collection.handle}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-200">{collection.products_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={collection.status === 'active' ? 'default' : 'secondary'} className="w-fit">
                              {collection.status}
                            </Badge>
                            {collection.sync_status && (
                              <Badge variant="outline" className="w-fit text-xs">
                                {collection.sync_status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {collection.last_synced_at 
                            ? new Date(collection.last_synced_at).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCollection(collection.id)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {collection.isShopifyCollection && collection.url_link && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(collection.url_link, '_blank');
                                  }}
                                >
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  View on Shopify
                                </DropdownMenuItem>
                              )}
                              {permissions.canEditCollections && !collection.isShopifyCollection && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                </>
                              )}
                              {permissions.canDeleteCollections && !collection.isShopifyCollection && (
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}