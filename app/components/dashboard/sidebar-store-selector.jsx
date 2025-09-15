"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Store,
  Loader2,
  CheckCircle,
  Search,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";

export default function SidebarStoreSelector({ 
  stores, 
  selectedStoreId, 
  isLoadingStores, 
  selectStore,
  getRecentStores,
  onClose 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllStores, setShowAllStores] = useState(false);
  
  // Get current store from path
  const currentStoreId = pathname.includes('/store/') 
    ? pathname.split('/store/')[1]?.split('/')[0]
    : null;
    
  const effectiveSelectedId = selectedStoreId || currentStoreId;
  
  // Get stores to display - show recent stores if available, otherwise show first 4 stores
  const recentStores = getRecentStores ? getRecentStores(4) : [];
  console.log('Recent stores:', recentStores);
  console.log('All stores:', stores);
  // Always show up to 4 stores, either recent ones or the first 4
  const displayStores = recentStores.length > 0 
    ? recentStores 
    : (stores && stores.length > 0 ? stores.slice(0, Math.min(4, stores.length)) : []);
  
  // Filter all stores based on search
  const filteredStores = stores?.filter(store => 
    !searchQuery || 
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.url?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const handleStoreClick = (storeId) => {
    selectStore(storeId);
    if (onClose) onClose();
    router.push(`/store/${storeId}`);
  };
  
  if (isLoadingStores) {
    return (
      <div className="px-4 py-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
        <p className="text-xs text-gray-500">Loading stores...</p>
      </div>
    );
  }
  
  if (!stores || stores.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <Store className="h-6 w-6 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-500 mb-2">No stores available</p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => {
            if (onClose) onClose();
            router.push('/stores');
          }}
        >
          Go to Stores
        </Button>
      </div>
    );
  }
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Quick Access
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {stores.length}
        </Badge>
      </div>
      
      {/* Recent/Top 4 Stores - Always Visible */}
      <div className="px-2 pb-1">
        {displayStores.length > 0 ? displayStores.map((store) => {
          const storeId = store.public_id || store._id;
          const isSelected = effectiveSelectedId === storeId;
          
          return (
            <div
              key={storeId}
              className={cn(
                "px-2 py-1.5 mb-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group",
                isSelected && "bg-sky-50 dark:bg-sky-900/20"
              )}
              onClick={() => handleStoreClick(storeId)}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                  isSelected 
                    ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                )}>
                  {store.name?.substring(0, 2).toUpperCase() || 'ST'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    isSelected ? "text-sky-blue" : "text-gray-700 dark:text-gray-200"
                  )}>
                    {store.name}
                  </p>
                </div>
                {isSelected ? (
                  <CheckCircle className="h-3 w-3 text-sky-blue flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-gray-500 text-center py-2">
            No stores available
          </p>
        )}
      </div>
      
      {/* Search & Browse All - For more than 4 stores */}
      {stores.length > 4 && (
        <>
          <div className="px-2 pb-2 border-t border-gray-100 dark:border-gray-800">
            <div className="relative mt-1.5">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search all stores..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAllStores(true);
                }}
                onFocus={() => setShowAllStores(true)}
                className="h-7 pl-7 pr-2 text-xs"
              />
            </div>
          </div>
          
          {/* All Stores List - Shown when searching or browsing */}
          {(showAllStores || searchQuery) && (
            <ScrollArea className="h-40 border-t border-gray-100 dark:border-gray-800">
              <div className="px-2 py-1">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store) => {
                    const storeId = store.public_id || store._id;
                    const isSelected = effectiveSelectedId === storeId;
                    
                    return (
                      <div
                        key={storeId}
                        className={cn(
                          "px-2 py-1.5 mb-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group",
                          isSelected && "bg-sky-50 dark:bg-sky-900/20"
                        )}
                        onClick={() => handleStoreClick(storeId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                            isSelected 
                              ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          )}>
                            {store.name?.substring(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-xs font-medium truncate",
                              isSelected ? "text-sky-blue" : "text-gray-700 dark:text-gray-200"
                            )}>
                              {store.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {store.url?.replace(/^https?:\/\//, '') || 'No URL'}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-3 w-3 text-sky-blue flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No stores found
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
          
          {!showAllStores && !searchQuery && (
            <button
              className="w-full px-3 py-1.5 text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800"
              onClick={() => setShowAllStores(true)}
            >
              View all {stores.length} stores →
            </button>
          )}
        </>
      )}
    </div>
  );
}