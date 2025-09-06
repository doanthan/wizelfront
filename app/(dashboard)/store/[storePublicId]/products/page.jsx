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
  Package,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  DollarSign,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Image,
  LayoutGrid,
  List,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X
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

export default function ProductsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storePublicId = params.storePublicId;

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [connectingProducts, setConnectingProducts] = useState(false);
  const [viewType, setViewType] = useState("card"); // "table" or "card"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    availability: "all",
    priceMin: "",
    priceMax: "",
    productType: "",
    vendor: ""
  });
  const [productTypes, setProductTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const productsPerPage = 12;

  useEffect(() => {
    if (storePublicId) {
      fetchProducts();
    }
  }, [storePublicId, currentPage, searchQuery, sortBy, filters]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Store data is now fetched along with products in fetchProducts

  const fetchProducts = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: productsPerPage,
        search: searchQuery,
        sort: sortBy,
        ...(filters.availability !== "all" && { availability: filters.availability }),
        ...(filters.priceMin && { priceMin: filters.priceMin }),
        ...(filters.priceMax && { priceMax: filters.priceMax }),
        ...(filters.productType && { productType: filters.productType }),
        ...(filters.vendor && { vendor: filters.vendor })
      });
      
      const response = await fetch(`/api/store/${storePublicId}/products?${queryParams}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
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
            description: "You don't have permission to view products for this store",
            variant: "destructive",
          });
          router.push(`/store/${storePublicId}`);
          return;
        }
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setPermissions(data.permissions || {});
      setStore(data.store);
      setTotalPages(Math.ceil((data.totalCount || 0) / productsPerPage));
      
      // Extract unique product types and vendors for filters
      if (data.metadata) {
        setProductTypes(data.metadata.productTypes || []);
        setVendors(data.metadata.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectProducts = async () => {
    if (!store?.url) {
      toast({
        title: "Domain Required",
        description: "Please set a store domain before connecting products",
        variant: "destructive",
      });
      router.push(`/store/${storePublicId}`);
      return;
    }

    setConnectingProducts(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/connect-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Products connection initiated",
        });
        fetchProducts();
      } else {
        throw new Error(data.error || 'Failed to connect products');
      }
    } catch (error) {
      console.error('Error connecting products:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConnectingProducts(false);
    }
  };

  const handleCreateProduct = () => {
    router.push(`/store/${storePublicId}/products/new`);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({
      availability: "all",
      priceMin: "",
      priceMax: "",
      productType: "",
      vendor: ""
    });
    setCurrentPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleViewProduct = (productId) => {
    router.push(`/store/${storePublicId}/products/${productId}`);
  };

  // Search is now handled server-side
  const filteredProducts = products;

  // Skeleton loader components
  const SkeletonCard = () => (
    <Card className="animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow className="animate-pulse">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></TableCell>
      <TableCell><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></TableCell>
      <TableCell><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></TableCell>
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
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">Products</h1>
                <span className="text-neutral-gray dark:text-gray-400">•</span>
                <p className="text-neutral-gray dark:text-gray-400">{store?.name || "Loading..."}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {products.length === 0 && store?.url && (
                <Button 
                  onClick={handleConnectProducts}
                  disabled={connectingProducts}
                  className="bg-vivid-violet hover:bg-deep-purple text-white gap-2"
                >
                  {connectingProducts ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      Import Products
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={handleCreateProduct}
                className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
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
              className="rounded-none border-b-2 border-sky-blue text-sky-blue px-3 py-1.5 text-sm"
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
          // Show skeleton loader
          <div className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="flex gap-1">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {viewType === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Handle</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(6)].map((_, i) => (
                        <SkeletonTableRow key={i} />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Package className="h-12 w-12 text-neutral-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-gray dark:text-white mb-2">No Products Yet</h3>
                <p className="text-neutral-gray dark:text-gray-400 mb-6">
                  {store?.url 
                    ? "Import products from your store or add them manually" 
                    : "Set up your store domain first to import products"
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  {store?.url ? (
                    <>
                      <Button 
                        onClick={handleConnectProducts}
                        disabled={connectingProducts}
                        className="bg-vivid-violet hover:bg-deep-purple text-white gap-2"
                      >
                        {connectingProducts ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4" />
                            Import Products
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handleCreateProduct}
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Manually
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => router.push(`/store/${storePublicId}`)}
                      className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
                    >
                      Configure Store
                    </Button>
                  )}
                </div>
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
                      placeholder="Search products by name, type, or vendor..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
                        <span className="truncate">
                          Sort: {
                            sortBy === "newest" ? "Newest First" : 
                            sortBy === "oldest" ? "Oldest First" : 
                            sortBy === "price-low" ? "Price: Low to High" : 
                            sortBy === "price-high" ? "Price: High to Low" : 
                            sortBy === "name-az" ? "Name: A-Z" : 
                            "Name: Z-A"
                          }
                        </span>
                        <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem 
                        onClick={() => handleSortChange("newest")}
                        className="flex items-center gap-2"
                      >
                        <Check className={`h-4 w-4 ${sortBy === "newest" ? "opacity-100" : "opacity-0"}`} />
                        <span>Newest First</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSortChange("oldest")}
                        className="flex items-center gap-2"
                      >
                        <Check className={`h-4 w-4 ${sortBy === "oldest" ? "opacity-100" : "opacity-0"}`} />
                        <span>Oldest First</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSortChange("price-low")}
                        className="flex items-center gap-2"
                      >
                        <Check className={`h-4 w-4 ${sortBy === "price-low" ? "opacity-100" : "opacity-0"}`} />
                        <span>Price: Low to High</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSortChange("price-high")}
                        className="flex items-center gap-2"
                      >
                        <Check className={`h-4 w-4 ${sortBy === "price-high" ? "opacity-100" : "opacity-0"}`} />
                        <span>Price: High to Low</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSortChange("name-az")}
                        className="flex items-center gap-2"
                      >
                        <Check className={`h-4 w-4 ${sortBy === "name-az" ? "opacity-100" : "opacity-0"}`} />
                        <span>Name: A-Z</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSortChange("name-za")}
                        className="flex items-center gap-2"
                      >
                        <Check className={`h-4 w-4 ${sortBy === "name-za" ? "opacity-100" : "opacity-0"}`} />
                        <span>Name: Z-A</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {(filters.availability !== "all" || filters.priceMin || filters.priceMax || filters.productType || filters.vendor) && (
                          <Badge className="ml-1 bg-sky-blue text-white">
                            {[filters.availability !== "all", filters.priceMin, filters.priceMax, filters.productType, filters.vendor].filter(Boolean).length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-4">
                      <div className="space-y-4">
                        {/* Availability Filter */}
                        <div>
                          <label className="text-sm font-medium text-slate-gray dark:text-gray-100 mb-1 block">
                            Availability
                          </label>
                          <select
                            value={filters.availability}
                            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <option value="all">All Products</option>
                            <option value="available">In Stock</option>
                            <option value="unavailable">Out of Stock</option>
                          </select>
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-sm font-medium text-slate-gray dark:text-gray-100 mb-1 block">
                              Min Price
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="0"
                                value={filters.priceMin}
                                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                                className="pl-7 h-8 text-sm"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-gray dark:text-gray-100 mb-1 block">
                              Max Price
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="1000"
                                value={filters.priceMax}
                                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                                className="pl-7 h-8 text-sm"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Product Type */}
                        <div>
                          <label className="text-sm font-medium text-slate-gray dark:text-gray-100 mb-1 block">
                            Product Type
                          </label>
                          <select
                            value={filters.productType}
                            onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <option value="">All Types</option>
                            {productTypes.map((type) => (
                              <option key={type} value={type}>
                                {type || "Uncategorized"}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Vendor */}
                        <div>
                          <label className="text-sm font-medium text-slate-gray dark:text-gray-100 mb-1 block">
                            Vendor
                          </label>
                          <select
                            value={filters.vendor}
                            onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <option value="">All Vendors</option>
                            {vendors.map((vendor) => (
                              <option key={vendor} value={vendor}>
                                {vendor}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleApplyFilters}
                            className="bg-sky-blue hover:bg-royal-blue text-white"
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              </CardContent>
            </Card>

            {/* Filter Dropdown */}

            {/* Products View */}
            {viewType === "card" ? (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => handleViewProduct(product.id)}
                  >
                    <div className="aspect-square bg-gray-100">
                      {product.product_image_url ? (
                        <img 
                          src={product.product_image_url} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-tint to-lilac-mist">
                          <ShoppingBag className="h-12 w-12 text-white opacity-50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-slate-gray dark:text-white line-clamp-1">{product.title}</h3>
                          <p className="text-sm text-neutral-gray dark:text-gray-400 mt-1">{product.product_type || product.vendor}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">{product.price}</span>
                          </div>
                          <Badge 
                            variant={product.available ? 'default' : 'secondary'}
                            className={product.available ? 'bg-green-100 text-green-700' : ''}
                          >
                            {product.available ? 'In Stock' : 'Out'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {product.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                      <TableHead>Product</TableHead>
                      <TableHead>Handle</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.product_image_url ? (
                              <img 
                                src={product.product_image_url} 
                                alt={product.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-tint to-lilac-mist flex items-center justify-center">
                                <Image className="h-5 w-5 text-white opacity-50" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-gray dark:text-white">{product.title}</p>
                              <p className="text-xs text-neutral-gray dark:text-gray-400">{product.product_type || product.vendor}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.handle || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            {product.price}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.available ? 'default' : 'secondary'}
                            className={product.available ? 'bg-green-100 text-green-700' : ''}
                          >
                            {product.available ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={i}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={page === currentPage ? "bg-sky-blue text-white" : ""}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}