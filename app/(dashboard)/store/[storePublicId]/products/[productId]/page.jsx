"use client";

import { useState, useEffect, useRef } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import { 
  ArrowLeft, 
  ExternalLink,
  ShoppingBag,
  Package,
  DollarSign,
  Eye,
  Edit,
  Save,
  X,
  Trash2,
  Copy,
  ShoppingCart,
  Calendar,
  Tag,
  User,
  Globe,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { storePublicId, productId } = params;

  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // Inline editing states
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storePublicId && productId) {
      fetchProduct();
    }
  }, [storePublicId, productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}/products/${productId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
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
            description: "You don't have permission to view this product",
            variant: "destructive",
          });
          router.push(`/store/${storePublicId}/products`);
          return;
        }
        if (response.status === 404) {
          toast({
            title: "Product Not Found",
            description: "The requested product could not be found",
            variant: "destructive",
          });
          router.push(`/store/${storePublicId}/products`);
          return;
        }
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      
      const data = await response.json();
      setProduct(data.product);
      setPermissions(data.permissions || {});
      setStore(data.store);
      
      // Image data structure has been fixed to handle cases where
      // images field is undefined but product_image_url exists
      
      // Set first variant as selected by default
      if (data.product.variants && data.product.variants.length > 0) {
        setSelectedVariant(data.product.variants[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnStore = () => {
    if (product?.url_link) {
      window.open(product.url_link, '_blank');
    }
  };

  // Inline editing functions
  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field) => {
    if (!editValues[field] && editValues[field] !== '') return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: editValues[field]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const data = await response.json();
      setProduct(data.product);
      setEditingField(null);
      setEditValues({});
      
      toast({
        title: "Success",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const nextImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const formatPrice = (price) => {
    return price ? `$${parseFloat(price).toFixed(2)}` : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <MorphingLoader size="small" showThemeText={false} />
          <span className="text-neutral-gray dark:text-gray-400">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-neutral-gray mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-gray dark:text-white mb-2">Product Not Found</h3>
          <p className="text-neutral-gray dark:text-gray-400 mb-6">
            The requested product could not be found.
          </p>
          <Button
            onClick={() => router.push(`/store/${storePublicId}/products`)}
            className="bg-sky-blue hover:bg-royal-blue text-white"
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

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
                onClick={() => router.back()}
                className="p-2 hover:bg-sky-tint/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">
                  {product?.title || 'Product Details'}
                </h1>
              </div>
            </div>

            <div className="flex gap-2">
              {product?.url_link && (
                <Button
                  onClick={handleViewOnStore}
                  variant="outline"
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  View on Store
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Package className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product?.id || '')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Product ID
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product?.url_link || '')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copy Store URL
                  </DropdownMenuItem>
                  {permissions.canDelete && (
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Product Images - Smaller */}
          <div className="lg:col-span-1 space-y-3">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative rounded-lg overflow-hidden">
                  {(() => {
                    // Handle different image data structures - be more robust
                    let imageList = [];
                    
                    // Check if images is an array with valid items
                    if (Array.isArray(product.images) && product.images.length > 0) {
                      imageList = product.images.map((img, index) => {
                        if (typeof img === 'string') {
                          return { src: img, alt: `${product.title} ${index + 1}` };
                        } else if (img && typeof img === 'object' && img.src) {
                          return { src: img.src, alt: img.alt || `${product.title} ${index + 1}` };
                        }
                        return null;
                      }).filter(Boolean);
                    }
                    
                    // If no valid images array, check for single product_image_url
                    if (imageList.length === 0 && product.product_image_url) {
                      imageList = [{ src: product.product_image_url, alt: product.title }];
                    }
                    
                    // Check if images is a string (comma-separated URLs)
                    if (imageList.length === 0 && typeof product.images === 'string' && product.images.length > 0) {
                      const urls = product.images.split(',').map(url => url.trim()).filter(url => url);
                      imageList = urls.map((url, index) => ({ src: url, alt: `${product.title} ${index + 1}` }));
                    }

                    // Display images
                    if (imageList.length > 0) {
                      // Ensure currentImageIndex is valid
                      const validIndex = Math.max(0, Math.min(currentImageIndex, imageList.length - 1));
                      const currentImage = imageList[validIndex];
                      return (
                        <>
                          <img
                            src={currentImage.src}
                            alt={currentImage.alt || product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', currentImage.src);
                              e.target.style.display = 'none';
                            }}
                          />
                          {imageList.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                                {imageList.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      index === validIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                {validIndex + 1} / {imageList.length}
                              </div>
                            </>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-tint to-lilac-mist">
                          <ShoppingBag className="h-12 w-12 text-white opacity-50" />
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Smart Thumbnail Grid - Only show if we actually have multiple images */}
            {(() => {
              // Get actual image list for thumbnails
              let imageList = [];
              
              if (Array.isArray(product.images) && product.images.length > 0) {
                imageList = product.images;
              } else if (product.product_image_url) {
                imageList = [{ src: product.product_image_url, alt: product.title }];
              }
              
              if (imageList.length > 1) {
                return (
                  <div className={`grid gap-2 ${
                    imageList.length === 2 ? 'grid-cols-2' : 
                    imageList.length === 3 ? 'grid-cols-3' : 
                    'grid-cols-4'
                  }`}>
                    {imageList.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          index === currentImageIndex 
                            ? 'border-sky-blue shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-sky-tint'
                        }`}
                      >
                        <img
                          src={typeof image === 'string' ? image : image.src}
                          alt={typeof image === 'string' ? `${product.title} ${index + 1}` : (image.alt || `${product.title} ${index + 1}`)}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Product Information - Expanded */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Editable Title */}
                    {editingField === 'title' ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={editValues.title || ''}
                          onChange={(e) => setEditValues({...editValues, title: e.target.value})}
                          className="text-xl font-bold"
                          placeholder="Product title"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveField('title')}
                          disabled={isSaving}
                          className="bg-sky-blue hover:bg-royal-blue text-white"
                        >
                          {isSaving ? <MorphingLoader size="small" showThemeText={false} /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2 group">
                        <CardTitle className="text-2xl">{product.title}</CardTitle>
                        {permissions.canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEditing('title', product.title)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Editable Marketing Name */}
                    {editingField === 'marketing_name' ? (
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          value={editValues.marketing_name || ''}
                          onChange={(e) => setEditValues({...editValues, marketing_name: e.target.value})}
                          className="text-base"
                          placeholder="Marketing name"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveField('marketing_name')}
                          disabled={isSaving}
                          className="bg-sky-blue hover:bg-royal-blue text-white"
                        >
                          {isSaving ? <MorphingLoader size="small" showThemeText={false} /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3 group">
                        <CardDescription className="text-base">
                          {product.marketing_name || 'Add marketing name'}
                        </CardDescription>
                        {permissions.canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEditing('marketing_name', product.marketing_name || '')}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className={product.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {product.status === 'active' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {product.status}
                      </Badge>
                      {product.product_type && (
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.product_type}
                        </Badge>
                      )}
                      {product.vendor && (
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          {product.vendor}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Price Information */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-slate-gray dark:text-white">
                        {formatPrice(selectedVariant?.price || product.price)}
                      </span>
                    </div>
                    {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(selectedVariant?.price || product.price) && (
                      <span className="text-lg text-neutral-gray line-through">
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </div>

                  {/* Compact Variants Grid */}
                  {product.variants && product.variants.length > 0 && (
                    <div>
                      <h3 className="font-medium text-slate-gray dark:text-white mb-3 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Variants ({product.variants.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={`text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                              selectedVariant?.id === variant.id
                                ? 'border-sky-blue bg-sky-tint/10 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-sky-tint'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-sm text-slate-gray dark:text-white truncate">
                                {variant.title}
                              </p>
                              <div className="flex justify-between items-center">
                                <p className="text-lg font-bold text-green-600">
                                  {formatPrice(variant.price)}
                                </p>
                                {variant.inventory_quantity !== null && (
                                  <p className="text-xs text-neutral-gray bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    Stock: {variant.inventory_quantity}
                                  </p>
                                )}
                              </div>
                              {variant.sku && (
                                <p className="text-xs text-neutral-gray font-mono truncate">
                                  {variant.sku}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Options */}
                  {product.options && product.options.length > 0 && (
                    <div>
                      <h3 className="font-medium text-slate-gray dark:text-white mb-2">Options</h3>
                      <div className="space-y-2">
                        {product.options.map((option, index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium text-sm text-slate-gray dark:text-white mb-2">
                              {option.name}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {option.values.map((value, valueIndex) => (
                                <Badge key={valueIndex} variant="outline" className="text-xs">
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-slate-gray dark:text-white mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-slate-gray dark:text-white">Images</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {(() => {
                      // Calculate actual available images, not metadata count
                      if (Array.isArray(product.images) && product.images.length > 0) {
                        return product.images.length;
                      } else if (product.product_image_url) {
                        return 1;
                      }
                      return 0;
                    })()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-slate-gray dark:text-white">Variants</span>
                  </div>
                  <p className="text-xl font-bold text-purple-600">
                    {product.variants_count || product.variants?.length || 0}
                  </p>
                </CardContent>
              </Card>

              {product.shopify_product_id && (
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-slate-gray dark:text-white">Shopify ID</span>
                    </div>
                    <p className="text-sm font-mono text-green-600 truncate">
                      {product.shopify_product_id}
                    </p>
                  </CardContent>
                </Card>
              )}

              {product.handle && (
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-slate-gray dark:text-white">Handle</span>
                    </div>
                    <p className="text-sm font-mono text-orange-600 truncate">
                      {product.handle}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Product Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingField === 'description_text' ? (
              <div className="space-y-3">
                <Textarea
                  value={editValues.description_text || ''}
                  onChange={(e) => setEditValues({...editValues, description_text: e.target.value})}
                  placeholder="Product description"
                  rows={8}
                  className="min-h-[200px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveField('description_text')}
                    disabled={isSaving}
                    className="bg-sky-blue hover:bg-royal-blue text-white"
                  >
                    {isSaving ? <MorphingLoader size="small" showThemeText={false} /> : <Save className="h-4 w-4" />}
                    Save Description
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-neutral-gray dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {product.description_text || 'No description available'}
                  </p>
                </div>
                {permissions.canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => startEditing('description_text', product.description_text || '')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Description
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-slate-gray dark:text-gray-300">Created</span>
                  <span className="text-sm text-neutral-gray dark:text-gray-400">{formatDate(product.created_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-slate-gray dark:text-gray-300">Updated</span>
                  <span className="text-sm text-neutral-gray dark:text-gray-400">{formatDate(product.updated_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-gray dark:text-gray-300">Published</span>
                  <span className="text-sm text-neutral-gray dark:text-gray-400">{formatDate(product.published_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-slate-gray dark:text-gray-300">Product ID</span>
                  <span className="text-xs font-mono text-neutral-gray dark:text-gray-400 max-w-32 truncate" title={product.id}>
                    {product.id}
                  </span>
                </div>
                {product.domain && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-slate-gray dark:text-gray-300">Domain</span>
                    <span className="text-sm text-neutral-gray dark:text-gray-400">{product.domain}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-gray dark:text-gray-300">Status</span>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {product.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}