"use client";

import { useEffect, useState } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useParams, useRouter } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { useToast } from "@/app/hooks/use-toast";
import { Card } from "@/app/components/ui/card";
import { Store } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

export default function StoreEmailBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getUserAccessibleStores } = useStores();
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const storePublicId = params?.storePublicId;

  useEffect(() => {
    const checkAccessAndLoadStore = async () => {
      if (!storePublicId) {
        router.push('/email-builder');
        return;
      }

      // Find the store
      const accessibleStores = getUserAccessibleStores();

      console.log('🔍 Email Builder Page Debug:', {
        storePublicId,
        accessibleStoresCount: accessibleStores.length,
        accessibleStoreIds: accessibleStores.map(s => s.public_id),
        firstStore: accessibleStores[0],
        lookingFor: storePublicId
      });

      const store = accessibleStores.find(s => s.public_id === storePublicId);

      if (!store) {
        console.error('❌ Store not found:', {
          requestedId: storePublicId,
          availableIds: accessibleStores.map(s => s.public_id)
        });

        toast({
          title: "Access denied",
          description: `Store ${storePublicId} not found in your accessible stores. You have access to: ${accessibleStores.map(s => s.public_id).join(', ')}`,
          variant: "destructive",
        });
        router.push('/email-builder');
        return;
      }

      setCurrentStore(store);
      setLoading(false);
    };

    checkAccessAndLoadStore();
  }, [storePublicId]);

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
      
      {/* Email builder component would go here */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Email builder interface for {currentStore?.name || 'store'} will be loaded here
        </p>
      </div>
    </div>
  );
}