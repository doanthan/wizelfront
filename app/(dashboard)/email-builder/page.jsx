"use client";

import { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { 
  Store, 
  Mail, 
  ArrowRight,
  CheckCircle,
  Package,
  Palette,
  Search
} from "lucide-react";
import { useStores } from "@/app/contexts/store-context";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

export default function EmailBuilderStoreSelectorPage() {
  const router = useRouter();
  const { stores, isLoadingStores, refreshStores } = useStores();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    refreshStores();
  }, []);

  // Filter stores based on search
  const filteredStores = (stores || []).filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    // Navigate to the store-specific email builder
    router.push(`/store/${store.public_id}/email-builder`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center">
            <Mail className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-gray">
          Email Template Builder
        </h1>
        <p className="text-neutral-gray max-w-2xl mx-auto">
          Select a store to start building email templates. Each store has its own templates, brands, and settings.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search stores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoadingStores && (
        <div className="flex justify-center items-center py-12">
          <MorphingLoader size="small" showThemeText={false} />
        </div>
      )}

      {/* Stores Grid */}
      {!isLoadingStores && filteredStores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map(store => (
            <Card 
              key={store.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:border-sky-blue",
                selectedStore?.id === store.id && "border-sky-blue shadow-lg"
              )}
              onClick={() => handleStoreSelect(store)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-vivid-violet/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-6 w-6 text-vivid-violet" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-gray truncate">
                        {store.name}
                      </h3>
                      <p className="text-sm text-neutral-gray mt-0.5 truncate">
                        {store.url || `www.${store.name.toLowerCase().replace(/\s/g, '')}.com`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs flex-shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                {/* Store Info */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-gray">0</p>
                    <p className="text-xs text-neutral-gray">Templates</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-gray">1</p>
                    <p className="text-xs text-neutral-gray">Brands</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-vivid-violet">0</p>
                    <p className="text-xs text-neutral-gray">Campaigns</p>
                  </div>
                </div>

                {/* Select Button */}
                <Button 
                  className="w-full gap-2 bg-vivid-violet hover:bg-deep-purple text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStoreSelect(store);
                  }}
                >
                  Build Templates
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingStores && filteredStores.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-gray mb-2">
              No stores found
            </h3>
            <p className="text-sm text-neutral-gray mb-6">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "You need to add a store before you can create email templates"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push('/stores?action=new')}
                className="gap-2 bg-royal-blue hover:bg-blue-700 text-white"
              >
                Add Your First Store
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}