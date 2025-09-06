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
  Megaphone,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  MousePointer,
  Edit,
  Trash2,
  Copy,
  Loader2,
  BarChart,
  Eye,
  LayoutGrid,
  List
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

export default function CTAsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storePublicId = params.storePublicId;

  const [store, setStore] = useState(null);
  const [ctas, setCTAs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("card"); // "card" or "table"

  useEffect(() => {
    if (storePublicId) {
      fetchStore();
      fetchCTAs();
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

  const fetchCTAs = async () => {
    try {
      // For now, simulate empty CTAs
      setCTAs([]);
    } catch (error) {
      console.error('Error fetching CTAs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCTA = () => {
    router.push(`/store/${storePublicId}/ctas/new`);
  };

  const handleViewCTA = (ctaId) => {
    router.push(`/store/${storePublicId}/ctas/${ctaId}`);
  };

  const filteredCTAs = ctas.filter(cta => 
    cta.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cta.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Skeleton loader components
  const SkeletonCard = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow className="animate-pulse">
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></TableCell>
      <TableCell><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-xs"></div></TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div></TableCell>
      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></TableCell>
      <TableCell><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></TableCell>
      <TableCell><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></TableCell>
    </TableRow>
  )

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
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">CTAs</h1>
                <span className="text-neutral-gray dark:text-gray-400">•</span>
                <p className="text-neutral-gray dark:text-gray-400">{store?.name || "Loading..."}</p>
              </div>
            </div>

            <Button 
              onClick={handleCreateCTA}
              className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Create CTA
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
              className="rounded-none border-b-2 border-sky-blue text-sky-blue px-3 py-1.5 text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <TableHead>Name</TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Text</TableHead>
                        <TableHead>Click Rate</TableHead>
                        <TableHead>Used In</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
        ) : ctas.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Megaphone className="h-12 w-12 text-neutral-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-gray dark:text-white mb-2">No CTAs Yet</h3>
                <p className="text-neutral-gray dark:text-gray-400 mb-6">Create compelling call-to-actions for your email campaigns</p>
                <Button 
                  onClick={handleCreateCTA}
                  className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First CTA
                </Button>
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
                      placeholder="Search CTAs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
              </CardContent>
            </Card>

            {/* CTAs View */}
            {viewType === "card" ? (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCTAs.map((cta) => (
                  <Card 
                    key={cta.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewCTA(cta.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-gray dark:text-white mb-1">{cta.name}</h3>
                          <p className="text-sm text-neutral-gray dark:text-gray-400">{cta.description}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCTA(cta.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart className="h-4 w-4 mr-2" />
                              Analytics
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

                      {/* CTA Preview */}
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Button 
                          className="w-full"
                          style={{
                            backgroundColor: cta.backgroundColor || '#60A5FA',
                            color: cta.textColor || '#FFFFFF'
                          }}
                        >
                          {cta.text || 'Button Text'}
                        </Button>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-gray dark:text-gray-400">Click Rate</p>
                          <p className="font-semibold text-slate-gray dark:text-white">{cta.clickRate || '0'}%</p>
                        </div>
                        <div>
                          <p className="text-neutral-gray dark:text-gray-400">Used In</p>
                          <p className="font-semibold text-slate-gray dark:text-white">{cta.usageCount || '0'} campaigns</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-4 pt-4 border-t">
                        <Badge variant={cta.status === 'active' ? 'default' : 'secondary'}>
                          {cta.status || 'draft'}
                        </Badge>
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
                        <TableHead className="text-gray-700 dark:text-gray-300">Preview</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Text</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Click Rate</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Used In</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCTAs.map((cta) => (
                        <TableRow 
                          key={cta.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b dark:border-gray-700"
                          onClick={() => handleViewCTA(cta.id)}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <p className="text-slate-gray dark:text-white">{cta.name}</p>
                              <p className="text-xs text-neutral-gray dark:text-gray-400">{cta.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm"
                              className="h-auto py-1 px-3 text-xs"
                              style={{
                                backgroundColor: cta.backgroundColor || '#60A5FA',
                                color: cta.textColor || '#FFFFFF'
                              }}
                            >
                              {cta.text || 'Button'}
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {cta.text}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-700 dark:text-gray-200">{cta.clickRate || '0'}%</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-700 dark:text-gray-200">{cta.usageCount || '0'} campaigns</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cta.status === 'active' ? 'default' : 'secondary'}>
                              {cta.status || 'draft'}
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
                                <DropdownMenuItem onClick={() => handleViewCTA(cta.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <BarChart className="h-4 w-4 mr-2" />
                                  Analytics
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
          </div>
        )}
      </div>
    </div>
  );
}