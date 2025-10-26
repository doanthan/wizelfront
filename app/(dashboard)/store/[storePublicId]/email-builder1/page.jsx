"use client";

import { useEffect, useState } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useParams, useRouter } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { useToast } from "@/app/hooks/use-toast";
import { Card } from "@/app/components/ui/card";
import { Store } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import dynamic from "next/dynamic";

// Dynamically import the email builder to avoid SSR issues
const EmailBuilderInterface = dynamic(
  () => import("@/app/components/email-builder/EmailBuilderInterface"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <MorphingLoader size="medium" showText={true} text="Loading email builder..." />
      </div>
    )
  }
);

export default function StoreEmailBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getUserAccessibleStores, isLoadingStores, refreshStores } = useStores();
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const storePublicId = params?.storePublicId;

  useEffect(() => {
    const checkAccessAndLoadStore = async () => {
      if (!storePublicId) {
        router.push('/email-builder');
        return;
      }

      // Wait for stores to be loaded
      if (isLoadingStores) {
        console.log('⏳ Waiting for stores to load...');
        return;
      }

      // Find the store
      const accessibleStores = getUserAccessibleStores();

      console.log('🔍 Email Builder Page Debug:', {
        storePublicId,
        accessibleStoresCount: accessibleStores.length,
        accessibleStoreIds: accessibleStores.map(s => s.public_id),
        firstStore: accessibleStores[0],
        lookingFor: storePublicId,
        isLoadingStores,
        retryCount
      });

      // If no stores loaded yet and haven't retried, trigger a refresh
      if (accessibleStores.length === 0 && retryCount < 2) {
        console.log('📡 No stores found, triggering refresh...');
        setRetryCount(prev => prev + 1);
        refreshStores();
        return;
      }

      const store = accessibleStores.find(s => s.public_id === storePublicId);

      if (!store) {
        // DEVELOPMENT BYPASS: Try to fetch store directly
        if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && retryCount >= 2) {
          console.warn('🔧 DEVELOPMENT MODE: Fetching store directly for', storePublicId);

          // Try to fetch the store directly from the API
          try {
            const response = await fetch(`/api/store/${storePublicId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.store) {
                console.log('✅ Found store via direct API call:', data.store);
                setCurrentStore(data.store);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('Failed to fetch store directly:', error);
          }

          // If direct fetch fails, create a minimal mock
          const mockStore = {
            public_id: storePublicId,
            name: `Store ${storePublicId}`,
            url: 'https://example.com',
            _id: storePublicId,
            id: storePublicId
          };
          setCurrentStore(mockStore);
          setLoading(false);
          return;
        }

        // Only show error after stores have loaded and retries exhausted
        if (!isLoadingStores && retryCount >= 2) {
          console.error('❌ Store not found after retries:', {
            requestedId: storePublicId,
            availableIds: accessibleStores.map(s => s.public_id),
            retriesAttempted: retryCount
          });

          toast({
            title: "Access denied",
            description: `Store ${storePublicId} not found in your accessible stores. You have access to: ${accessibleStores.map(s => s.public_id).join(', ') || 'no stores'}`,
            variant: "destructive",
          });
          router.push('/email-builder');
        }
        return;
      }

      setCurrentStore(store);
      setLoading(false);
    };

    checkAccessAndLoadStore();
  }, [storePublicId, isLoadingStores, getUserAccessibleStores, retryCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <MorphingLoader size="small" showThemeText={false} />
        <span className="ml-2">Loading store...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Email Builder</h1>
        {currentStore && (
          <Card className="p-4 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-sky-blue/20">
            <div className="flex items-center gap-4">
              <Store className="h-5 w-5 text-sky-blue" />
              <div className="flex-1">
                <div className="font-semibold">{currentStore.name}</div>
                <div className="text-sm text-neutral-gray">{currentStore.url}</div>
              </div>
              <Badge className="bg-sky-blue/10 text-sky-blue border-sky-blue/20">
                Store Context Active
              </Badge>
            </div>
          </Card>
        )}
      </div>
      
      {/* Email builder component */}
      <EmailBuilderInterface store={currentStore} />
    </div>
  );
}