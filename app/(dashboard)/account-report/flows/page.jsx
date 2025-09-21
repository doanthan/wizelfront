"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import MorphingLoader from '@/app/components/ui/loading';

export default function FlowsReportRedirect() {
  const router = useRouter();
  const { stores, isLoadingStores } = useStores();

  useEffect(() => {
    if (!isLoadingStores && stores && stores.length > 0) {
      // Find the first store with Klaviyo integration, or just the first store
      const storeWithKlaviyo = stores.find(s => s.klaviyo_integration?.public_id);
      const targetStore = storeWithKlaviyo || stores[0];

      if (targetStore && targetStore.public_id) {
        // Redirect to the flows report for the first available store
        router.replace(`/store/${targetStore.public_id}/report/flows`);
      }
    }
  }, [stores, isLoadingStores, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <MorphingLoader
        size="large"
        showText={true}
        text="Loading flows report..."
      />
    </div>
  );
}