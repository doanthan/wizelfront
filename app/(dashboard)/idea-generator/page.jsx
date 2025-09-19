"use client";

import React, { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useToast } from "@/app/hooks/use-toast";
import { useStores } from "@/app/contexts/store-context";
import { 
  Lightbulb, 
  Store,
  Sparkles,
  Search,
  ArrowRight,
  CheckCircle,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function IdeaGeneratorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { stores, isLoadingStores, refreshStores } = useStores();
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brands, setBrands] = useState([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");

  // Load stores on mount
  useEffect(() => {
    if (refreshStores) {
      refreshStores();
    }
  }, []);

  // Filter stores based on search
  const filteredStores = storeSearchQuery
    ? stores?.filter(store => 
        store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        store.url?.toLowerCase().includes(storeSearchQuery.toLowerCase())
      )
    : stores;

  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setSelectedBrand(null); // Reset brand selection
    setLoadingBrands(true);
    
    try {
      // Fetch actual brand settings for the store
      const response = await fetch(`/api/store/${store.public_id}/brands`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.brands && data.brands.length > 0) {
          // Map the brand settings to the format we need
          const formattedBrands = data.brands.map((brand, index) => ({
            id: brand._id || brand.slug || `brand-${index}`,
            name: brand.brandName || brand.name || `Brand ${index + 1}`,
            description: brand.brandTagline || brand.description || 'Brand profile for campaigns',
            color: getColorForIndex(index)
          }));
          setBrands(formattedBrands);
        } else {
          // If no brands exist, show default option
          setBrands([
            { 
              id: 'default', 
              name: 'Default Brand', 
              description: 'Create your first brand profile',
              color: 'from-sky-blue to-vivid-violet'
            }
          ]);
        }
      } else {
        // Fallback to default brands if API fails
        setBrands([
          { 
            id: 'default', 
            name: 'Default Brand', 
            description: 'Main brand profile for all campaigns',
            color: 'from-sky-blue to-vivid-violet'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      // Fallback brands
      setBrands([
        { 
          id: 'default', 
          name: 'Default Brand', 
          description: 'Main brand profile for all campaigns',
          color: 'from-sky-blue to-vivid-violet'
        }
      ]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Helper function to get gradient colors for brands
  const getColorForIndex = (index) => {
    const colors = [
      'from-sky-blue to-vivid-violet',
      'from-orange-500 to-red-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-indigo-500 to-purple-500'
    ];
    return colors[index % colors.length];
  };

  const handleNext = () => {
    if (!selectedStore || !selectedBrand) {
      toast({
        title: "Selection required",
        description: "Please select both a store and a brand profile",
        variant: "destructive",
      });
      return;
    }

    // Navigate to store-specific idea generator with brand
    router.push(`/store/${selectedStore.public_id}/idea-generator?brand=${selectedBrand.id}`);
  };

  return (
    <div className="container mx-auto px-6 py-4 max-w-7xl">
      {/* Minimal Header */}
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h1 className="text-lg font-semibold text-slate-gray dark:text-white">
          Campaign Idea Generator
        </h1>
        <span className="text-sm text-neutral-gray dark:text-gray-400 ml-2">
          Select store and brand to continue
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-8">
        {/* Store Selection - Left Column */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-medium text-slate-gray dark:text-white mb-3">
              Select Store
            </h2>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-gray" />
              <Input
                placeholder="Search stores..."
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            {/* Store Cards */}
            {isLoadingStores ? (
              <div className="flex items-center justify-center h-64">
                <MorphingLoader size="small" showThemeText={false} />
                <span className="ml-2">Loading stores...</span>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredStores && filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                      <Card
                        key={store.public_id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md border-2",
                          selectedStore?.public_id === store.public_id 
                            ? "border-sky-blue bg-sky-50/50 dark:bg-sky-900/10" 
                            : "border-transparent hover:border-sky-blue/30"
                        )}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              selectedStore?.public_id === store.public_id
                                ? "bg-sky-blue text-white"
                                : "bg-sky-50 dark:bg-sky-900/20 text-sky-blue"
                            )}>
                              <Store className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-gray dark:text-white truncate">
                                {store.name}
                              </h3>
                              <p className="text-sm text-neutral-gray dark:text-gray-400 truncate">
                                {store.url || 'No URL configured'}
                              </p>
                            </div>
                            {selectedStore?.public_id === store.public_id && (
                              <CheckCircle className="h-5 w-5 text-sky-blue flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-neutral-gray">
                        {storeSearchQuery ? 'No stores found' : 'No stores available'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="hidden lg:flex items-center justify-center px-4">
          <div className="h-[400px] w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
        </div>

        {/* Brand Selection - Right Column */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-medium text-slate-gray dark:text-white mb-3">
              Select Brand Profile
            </h2>

            {/* Brand Cards */}
            {!selectedStore ? (
              <div className="flex items-center justify-center h-[500px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-neutral-gray">
                    Select a store first to view brand profiles
                  </p>
                </div>
              </div>
            ) : loadingBrands ? (
              <div className="flex items-center justify-center h-[500px]">
                <MorphingLoader size="small" showThemeText={false} />
                <span className="ml-2">Loading brand profiles...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {brands.length > 0 ? (
                  brands.map((brand) => (
                      <Card
                        key={brand.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md border-2",
                          selectedBrand?.id === brand.id 
                            ? "border-vivid-violet bg-purple-50/50 dark:bg-purple-900/10" 
                            : "border-transparent hover:border-vivid-violet/30"
                        )}
                        onClick={() => setSelectedBrand(brand)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              selectedBrand?.id === brand.id
                                ? "bg-vivid-violet text-white"
                                : "bg-purple-50 dark:bg-purple-900/20 text-vivid-violet"
                            )}>
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-gray dark:text-white">
                                {brand.name}
                              </h3>
                              <p className="text-sm text-neutral-gray dark:text-gray-400">
                                {brand.description}
                              </p>
                            </div>
                            {selectedBrand?.id === brand.id && (
                              <CheckCircle className="h-5 w-5 text-vivid-violet flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-neutral-gray">
                        No brand profiles available
                      </p>
                    </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Next Button */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedStore && (
            <Badge variant="outline" className="py-2 px-4">
              <Store className="h-3 w-3 mr-2" />
              {selectedStore.name}
            </Badge>
          )}
          {selectedBrand && (
            <Badge variant="outline" className="py-2 px-4">
              <Sparkles className="h-3 w-3 mr-2" />
              {selectedBrand.name}
            </Badge>
          )}
        </div>
        
        <Button
          onClick={handleNext}
          disabled={!selectedStore || !selectedBrand}
          size="lg"
          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}