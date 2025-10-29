"use client";

import { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import {
  ArrowLeft,
  Store,
  Globe,
  Trash2,
  Save,
  Settings,
  Package,
  Tag,
  Megaphone,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  Pencil,
  AlertTriangle,
  ExternalLink,
  Copy,
  Palette,
  Image,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export default function StoreDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storePublicId = params.storePublicId;

  const [store, setStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [domainValidation, setDomainValidation] = useState({ isValid: true, error: null });
  
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    timezone: "America/New_York",
    currency: "USD",
    utm_params: {
      source: "wizel",
      medium: "email"
    }
  });

  const [brands, setBrands] = useState([]);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [brandToEdit, setBrandToEdit] = useState(null);
  const [brandToClone, setBrandToClone] = useState(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isDeletingBrand, setIsDeletingBrand] = useState(false);
  const [userPermissions, setUserPermissions] = useState({ canEdit: true, canDelete: true, canManageTags: false });
  const [storeTags, setStoreTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const MAX_BRANDS = 3;

  useEffect(() => {
    if (storePublicId) {
      fetchStore();
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
      setFormData({
        name: data.store.name,
        url: data.store.url || "",
        timezone: data.store.timezone || "America/New_York",
        currency: data.store.currency || "USD",
        utm_params: data.store.utm_params || { source: "wizel", medium: "email" }
      });
      
      // Fetch brands for this store
      fetchBrands();
      // Fetch store tags
      fetchStoreTags();
    } catch (error) {
      console.error('Error fetching store:', error);
      toast({
        title: "Error",
        description: "Failed to load store details",
        variant: "destructive",
      });
      router.push('/stores');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}/brands`);
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchStoreTags = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}/tags`);
      if (response.ok) {
        const data = await response.json();
        setStoreTags(data.tags || []);
        // Check if user has manage permission (would be included in response)
        setUserPermissions(prev => ({ ...prev, canManageTags: true }));
      }
    } catch (error) {
      console.error('Error fetching store tags:', error);
      // If error is 403, user doesn't have permission
      if (error.status === 403) {
        setUserPermissions(prev => ({ ...prev, canManageTags: false }));
      }
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tag",
        variant: "destructive",
      });
      return;
    }

    setIsAddingTag(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag: newTag.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add tag');
      }

      const data = await response.json();
      setStoreTags(data.tags);
      setNewTag("");
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      const response = await fetch(`/api/store/${storePublicId}/tags?tag=${encodeURIComponent(tag)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove tag');
      }

      const data = await response.json();
      setStoreTags(data.tags);
      toast({
        title: "Success",
        description: "Tag removed successfully",
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a brand name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingBrand(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newName: newBrandName,
          sourceBrandId: brandToClone?._id || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create brand');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: brandToClone ? "Brand cloned successfully" : "Brand created successfully",
      });
      
      // Refresh brands list
      fetchBrands();
      
      // Reset dialog state
      setShowBrandDialog(false);
      setNewBrandName("");
      setBrandToClone(null);
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;

    setIsDeletingBrand(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/brands/${brandToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete brand');
      }

      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
      
      // Refresh brands list
      fetchBrands();
      
      // Reset dialog state
      setBrandToDelete(null);
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingBrand(false);
    }
  };

  const validateAndFormatDomain = (domain) => {
    if (!domain) return { isValid: false, formatted: "", error: "Domain is required" };

    let cleanDomain = domain.trim();
    cleanDomain = cleanDomain.replace(/^(http:\/\/|https:\/\/|www\.)/i, "");
    cleanDomain = cleanDomain.replace(/\/$/, "");

    const domainRegex = /^([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.)+[a-zA-Z]{2,}$/;

    if (!domainRegex.test(cleanDomain)) {
      return {
        isValid: false,
        formatted: domain,
        error: "Please enter a valid domain (e.g., mystore.com)",
      };
    }

    const formatted = `https://${cleanDomain}/`;
    return {
      isValid: true,
      formatted,
      error: null,
    };
  };

  const handleInputChange = (field, value) => {
    if (field === "url") {
      setFormData(prev => ({ ...prev, [field]: value }));
      setDomainValidation(validateAndFormatDomain(value));
    } else if (field.startsWith("utm_")) {
      const utmField = field.replace("utm_", "");
      setFormData(prev => ({
        ...prev,
        utm_params: {
          ...prev.utm_params,
          [utmField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDomainBlur = () => {
    if (domainValidation.isValid && formData.url) {
      const validation = validateAndFormatDomain(formData.url);
      if (validation.isValid) {
        setFormData(prev => ({ ...prev, url: validation.formatted }));
      }
    }
  };

  const handleSave = async () => {
    const validation = validateAndFormatDomain(formData.url);
    if (formData.url && !validation.isValid) {
      setDomainValidation(validation);
      toast({
        title: "Validation Error",
        description: "Please fix the domain format before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          url: validation.isValid ? validation.formatted : formData.url
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(errorData.error || 'You do not have permission to edit this store');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid store data');
        } else {
          throw new Error(errorData.error || 'Failed to update store');
        }
      }

      const data = await response.json();
      setStore(data.store);
      
      toast({
        title: "Success",
        description: "Store updated successfully",
      });
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== store.name) {
      toast({
        title: "Invalid confirmation",
        description: "Please type the exact store name to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/store/${storePublicId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete store');
      }

      toast({
        title: "Store Deleted",
        description: "Store has been successfully deleted",
      });

      router.push('/stores');
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteConfirmName("");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-gray dark:text-white mb-4">Store Not Found</h1>
        <Button onClick={() => router.push('/stores')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stores
        </Button>
      </div>
    );
  }

  const getPreviewUrl = () => {
    const baseUrl = formData.url || "https://mystore.com/";
    const params = [];
    if (formData.utm_params?.source) params.push(`utm_source=${encodeURIComponent(formData.utm_params.source)}`);
    if (formData.utm_params?.medium) params.push(`utm_medium=${encodeURIComponent(formData.utm_params.medium)}`);
    return baseUrl + (params.length > 0 ? '?' + params.join('&') : '');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stores')}
                className="p-1.5 hover:bg-sky-tint/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">{store.name}</h1>
                <p className="text-sm text-neutral-gray dark:text-gray-400">{store.url || "No domain set"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={store.subscription_status === 'active' ? 'default' : 'secondary'}
                className={store.subscription_status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : ''}
              >
                {store.subscription_status}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                ID: {store.public_id}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">

        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <Button
            variant="ghost"
            className="rounded-none border-b-2 border-sky-blue text-sky-blue px-4 py-2"
          >
            Store Details
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/collections`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            Collections
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/products`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            Products
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/ctas`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            CTAs
          </Button>
          {process.env.NEXT_PUBLIC_NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              onClick={() => router.push(`/store/${storePublicId}/apps`)}
              className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
            >
              Apps
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/users`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            User Settings
          </Button>
        </div>

        {/* Store Details Content */}
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Settings Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-slate-gray dark:text-white">Store Information</CardTitle>
                    <CardDescription>Core settings for your store</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                {/* Store Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter store name"
                  />
                </div>

                {/* Store Domain */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-slate-gray dark:text-gray-100 font-medium">Store Domain</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-gray" />
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      onBlur={handleDomainBlur}
                      placeholder="mystore.com"
                      className={`pl-10 pr-10 ${
                        formData.url && !domainValidation.isValid
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : formData.url && domainValidation.isValid
                          ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                          : "focus:border-sky-blue focus:ring-sky-blue/20"
                      }`}
                    />
                    {formData.url && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {domainValidation.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {domainValidation.error && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {domainValidation.error}
                    </p>
                  )}
                  <p className="text-xs text-neutral-gray">
                    Your store's domain will be formatted as https://domain.com/
                  </p>
                </div>

                {/* Timezone and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-slate-gray dark:text-gray-100">
                      {store.klaviyo_integration?.status === "connected"
                        ? formData.timezone
                        : "Connect Klaviyo to sync timezone"}
                    </div>
                    <p className="text-xs text-neutral-gray dark:text-gray-500">Synced from Klaviyo</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-slate-gray dark:text-gray-100">
                      {store.klaviyo_integration?.status === "connected"
                        ? formData.currency
                        : "Connect Klaviyo to sync currency"}
                    </div>
                    <p className="text-xs text-neutral-gray dark:text-gray-500">Synced from Klaviyo</p>
                  </div>
                </div>

                {/* UTM Parameters */}
                <div className="space-y-4 p-4 bg-sky-tint/10 dark:bg-sky-blue/5 rounded-lg border border-sky-blue/20 dark:border-sky-blue/10">
                  <div>
                    <h3 className="font-semibold text-slate-gray dark:text-white flex items-center gap-2">
                      <Tag className="h-4 w-4 text-sky-blue" />
                      UTM Parameters
                    </h3>
                    <p className="text-sm text-neutral-gray dark:text-gray-400 mt-1">Default tracking parameters for email campaigns</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="utm_source" className="text-sm font-medium text-slate-gray dark:text-gray-100">UTM Source</Label>
                      <Input
                        id="utm_source"
                        value={formData.utm_params?.source || ''}
                        onChange={(e) => handleInputChange('utm_source', e.target.value)}
                        placeholder="wizel"
                        className="bg-white focus:border-sky-blue focus:ring-sky-blue/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utm_medium" className="text-sm font-medium text-slate-gray dark:text-gray-100">UTM Medium</Label>
                      <Input
                        id="utm_medium"
                        value={formData.utm_params?.medium || ''}
                        onChange={(e) => handleInputChange('utm_medium', e.target.value)}
                        placeholder="email"
                        className="bg-white focus:border-sky-blue focus:ring-sky-blue/20"
                      />
                    </div>
                  </div>
                  
                  {/* UTM Preview */}
                  {formData.url && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <Label className="text-xs text-neutral-gray dark:text-gray-400 mb-2 block">Preview URL</Label>
                      <div className="text-xs font-mono text-slate-gray dark:text-gray-300 break-all">
                        {getPreviewUrl()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Store Tags */}
                <div className="space-y-4 p-4 bg-sky-tint/10 dark:bg-sky-blue/5 rounded-lg border border-sky-blue/20 dark:border-sky-blue/10">
                  <div>
                    <h3 className="font-semibold text-slate-gray dark:text-white flex items-center gap-2">
                      <Tag className="h-4 w-4 text-sky-blue" />
                      Store Tags
                    </h3>
                    <p className="text-sm text-neutral-gray dark:text-gray-400 mt-1">
                      Organize and categorize this store with tags
                    </p>
                  </div>

                  {/* Current Tags */}
                  <div className="flex flex-wrap gap-2">
                    {storeTags.length === 0 ? (
                      <p className="text-sm text-neutral-gray dark:text-gray-400 italic">No tags added yet</p>
                    ) : (
                      storeTags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-white dark:bg-gray-800 border-sky-blue/30 px-3 py-1 flex items-center gap-1"
                        >
                          {tag}
                          {userPermissions.canManageTags && (
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-red-600 transition-colors"
                              title="Remove tag"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Add New Tag */}
                  {userPermissions.canManageTags && (
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Enter a new tag"
                        className="flex-1 bg-white dark:bg-gray-800"
                        disabled={isAddingTag}
                      />
                      <Button
                        onClick={handleAddTag}
                        disabled={!newTag.trim() || isAddingTag}
                        size="sm"
                        className="bg-sky-blue hover:bg-royal-blue text-white"
                      >
                        {isAddingTag ? (
                          <MorphingLoader size="small" showThemeText={false} />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add Tag
                      </Button>
                    </div>
                  )}

                  {!userPermissions.canManageTags && (
                    <p className="text-xs text-neutral-gray dark:text-gray-400 italic">
                      You need manage permissions to add or remove tags
                    </p>
                  )}
                </div>

                {/* Integrations */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-gray dark:text-white">Integrations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200"
                          onClick={() => router.push(`/store/${storePublicId}/klaviyo-connect`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <img src="/klaviyo-icon.png" alt="Klaviyo" className="h-8 w-8" />
                          {store.klaviyo_integration?.status === "connected" ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-slate-gray dark:text-white mb-1">Klaviyo</h4>
                        <p className="text-xs text-neutral-gray dark:text-gray-400">
                          {store.klaviyo_integration?.status === "connected"
                            ? "Manage your Klaviyo connection"
                            : "Connect your email marketing"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Brands Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-gray dark:text-white">Brands</h3>
                      <p className="text-sm text-neutral-gray dark:text-gray-400">Manage brand identities for this store</p>
                    </div>
                    <div className="text-sm text-neutral-gray dark:text-gray-400">
                      {brands.length}/{MAX_BRANDS} brands
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Add Brand Card */}
                    {brands.length < MAX_BRANDS && (
                      <Card
                        className="border-2 border-dashed border-sky-blue hover:border-royal-blue hover:bg-sky-tint/10 transition-all cursor-pointer group"
                        onClick={() => {
                          setNewBrandName("");
                          setBrandToClone(null);
                          setShowBrandDialog(true);
                        }}
                      >
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <div className="w-10 h-10 bg-sky-blue/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-sky-blue/20">
                            <Plus className="h-5 w-5 text-sky-blue" />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-gray dark:text-white">Add New Brand</h4>
                          <p className="text-xs text-neutral-gray dark:text-gray-400 mt-1">
                            {brands.length === 0 ? "Add another brand" : "Add another brand"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Existing Brand Cards */}
                    {brands.map(brand => (
                      <Card key={brand._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-vivid-violet to-deep-purple rounded-lg flex items-center justify-center">
                              <Palette className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-gray dark:text-white">{brand.name}</h4>
                              <p className="text-xs text-neutral-gray dark:text-gray-400">{brand.slug || "No slug"}</p>
                            </div>
                          </div>
                          {brand.isDefault ? (
                            <div className="text-xs text-neutral-gray dark:text-gray-400 text-center">
                              Default brand cannot be deleted
                            </div>
                          ) : null}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/store/${storePublicId}/brand/${brand.slug}`)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBrandToClone(brand);
                                setNewBrandName(`${brand.name} Copy`);
                                setShowBrandDialog(true);
                              }}
                              title="Clone brand"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {!brand.isDefault && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setBrandToDelete(brand)}
                                title="Delete brand"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-6 border-t">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || (formData.url && !domainValidation.isValid)}
                        className="bg-sky-blue hover:bg-royal-blue text-white"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sidebar Column */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-gray dark:text-white">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-gray dark:text-gray-400">Collections</span>
                      <span className="font-semibold text-slate-gray dark:text-white">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-gray dark:text-gray-400">Brands</span>
                      <span className="font-semibold text-slate-gray dark:text-white">{brands.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-gray dark:text-gray-400">CTAs</span>
                      <span className="font-semibold text-slate-gray dark:text-white">0</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Store Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-gray dark:text-white">Store Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-slate-gray dark:text-gray-100">Store Active</span>
                    </div>
                    <div className="text-xs text-neutral-gray dark:text-gray-400">
                      Created: {new Date(store.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-neutral-gray dark:text-gray-400">
                      Updated: {new Date(store.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Sync Status */}
                {(store.scrape_job_id || store.scrape_status) && (
                  <Card className="border-sky-blue/20 dark:border-sky-blue/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-slate-gray dark:text-white flex items-center gap-2">
                        {store.scrape_status === 'processing' || store.scrape_status === 'pending' ? (
                          <MorphingLoader size="small" showThemeText={false} />
                        ) : store.scrape_status === 'completed' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : store.scrape_status === 'failed' ? (
                          <X className="h-4 w-4 text-red-600" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-gray-600" />
                        )}
                        Sync Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-gray dark:text-white">
                            {store.scrape_status === 'processing' ? 'Syncing...' :
                             store.scrape_status === 'pending' ? 'Queued' :
                             store.scrape_status === 'completed' ? 'Synced' :
                             store.scrape_status === 'failed' ? 'Failed' :
                             'Unknown'}
                          </span>
                          {store.scrape_status === 'completed' && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              Complete
                            </Badge>
                          )}
                          {store.scrape_status === 'processing' && (
                            <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-xs">
                              In Progress
                            </Badge>
                          )}
                          {store.scrape_status === 'failed' && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              Error
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-neutral-gray dark:text-gray-400">
                          {store.scrape_status === 'processing' ? 'Extracting store data...' :
                           store.scrape_status === 'pending' ? 'Waiting in queue' :
                           store.scrape_status === 'completed' && store.scrape_completed_at ? 
                             `Last synced: ${new Date(store.scrape_completed_at).toLocaleDateString()} at ${new Date(store.scrape_completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` :
                           store.scrape_status === 'failed' ? 'Sync encountered an error' :
                           'No sync data available'}
                        </div>
                      </div>
                      
                      {/* Progress bar for processing status */}
                      {store.scrape_status === 'processing' && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-sky-blue to-vivid-violet h-1.5 rounded-full animate-pulse" style={{width: '60%'}}></div>
                        </div>
                      )}
                      
                      {/* Action button */}
                      {(store.scrape_status === 'completed' || store.scrape_status === 'failed') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: store.scrape_status === 'failed' ? "Retry started" : "Re-sync started",
                              description: "Your store data is being refreshed",
                            });
                          }}
                          className="w-full gap-2 text-xs"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {store.scrape_status === 'failed' ? 'Retry Sync' : 'Re-sync'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Create/Clone Brand Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-vivid-violet" />
              {brandToClone ? "Clone Brand" : "Create New Brand"}
            </DialogTitle>
            <DialogDescription>
              {brandToClone 
                ? `Create a copy of "${brandToClone.name}" with a new name`
                : "Create a new brand for your store"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Enter brand name"
                maxLength={100}
              />
            </div>
            
            {brandToClone && (
              <div className="text-sm text-neutral-gray dark:text-gray-400 bg-sky-tint/10 dark:bg-sky-blue/5 p-3 rounded-lg">
                <p className="font-medium mb-1">Cloning from: {brandToClone.name}</p>
                <p className="text-xs">All settings and configurations will be copied</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBrandDialog(false);
                setNewBrandName("");
                setBrandToClone(null);
              }}
              disabled={isCreatingBrand}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBrand}
              disabled={!newBrandName.trim() || isCreatingBrand}
              className="bg-vivid-violet hover:bg-deep-purple text-white"
            >
              {isCreatingBrand ? "Creating..." : (brandToClone ? "Clone Brand" : "Create Brand")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Dialog */}
      <Dialog open={!!brandToDelete} onOpenChange={(open) => !open && setBrandToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Brand
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{brandToDelete?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-neutral-gray bg-red-50 p-3 rounded-lg">
              <p className="font-medium mb-2">This will delete:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All brand settings and configurations</li>
                <li>Brand colors and visual identity</li>
                <li>Brand messaging and content</li>
                <li>Associated campaigns using this brand</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBrandToDelete(null)}
              disabled={isDeletingBrand}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBrand}
              disabled={isDeletingBrand}
            >
              {isDeletingBrand ? "Deleting..." : "Delete Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Store Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Store
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the store
              <strong className="mx-1">{store.name}</strong>
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ul className="text-sm text-neutral-gray dark:text-gray-400 list-disc list-inside space-y-1">
              <li>All brand settings and configurations</li>
              <li>All connected integrations</li>
              <li>All products and collections</li>
              <li>All campaign data</li>
            </ul>
            
            <div className="space-y-2">
              <Label>Type <strong>{store.name}</strong> to confirm:</Label>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Type store name to confirm"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmName !== store.name}
            >
              Delete Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}