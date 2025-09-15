"use client";

import { useEffect } from "react";
import { useStores } from "@/app/contexts/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";

export default function TestStoresPage() {
  const { 
    stores, 
    selectedStoreId, 
    isLoadingStores, 
    refreshStores,
    selectStore,
    getRecentStores 
  } = useStores();

  useEffect(() => {
    console.log('TestStoresPage - Current stores:', stores);
    console.log('TestStoresPage - Selected store ID:', selectedStoreId);
    console.log('TestStoresPage - Is loading:', isLoadingStores);
    
    // Refresh stores on mount
    if (refreshStores) {
      console.log('TestStoresPage - Refreshing stores...');
      refreshStores();
    }
  }, []);

  const recentStores = getRecentStores ? getRecentStores(4) : [];

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Store Testing Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Status */}
        <Card>
          <CardHeader>
            <CardTitle>Store Context Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Total Stores:</strong> {stores?.length || 0}</p>
              <p><strong>Selected Store:</strong> {selectedStoreId || 'None'}</p>
              <p><strong>Loading:</strong> {isLoadingStores ? 'Yes' : 'No'}</p>
              <p><strong>Recent Stores Count:</strong> {recentStores.length}</p>
            </div>
            <Button 
              onClick={() => refreshStores && refreshStores()}
              className="mt-4"
              disabled={isLoadingStores}
            >
              {isLoadingStores ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh Stores'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* All Stores List */}
        <Card>
          <CardHeader>
            <CardTitle>All Stores ({stores?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stores && stores.length > 0 ? (
                stores.map((store) => (
                  <div 
                    key={store.public_id || store._id} 
                    className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => selectStore && selectStore(store.public_id || store._id)}
                  >
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-gray-500">
                      ID: {store.public_id || store._id}
                    </p>
                    <p className="text-sm text-gray-500">
                      URL: {store.url}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No stores found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Stores */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stores ({recentStores.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentStores.length > 0 ? (
                recentStores.map((store) => (
                  <div 
                    key={store.public_id || store._id} 
                    className="p-2 border rounded"
                  >
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-gray-500">
                      ID: {store.public_id || store._id}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No recent stores</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ 
                storeCount: stores?.length,
                selectedStoreId,
                isLoadingStores,
                recentStoresCount: recentStores.length,
                firstStore: stores?.[0]?.name
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}