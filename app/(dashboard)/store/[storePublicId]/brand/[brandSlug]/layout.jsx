"use client";

import React from "react";
import { BrandProvider } from "@/app/hooks/use-brand";
import { BrandNavigation } from "@/app/components/brand/brand-navigation";
import { useBrand } from "@/app/hooks/use-brand";

export default function BrandLayout({ children, params }) {
  const { storePublicId, brandSlug } = React.use(params);

  return (
    <BrandProvider storePublicId={storePublicId} brandSlug={brandSlug}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <BrandLayoutInner>{children}</BrandLayoutInner>
      </div>
    </BrandProvider>
  );
}

function BrandLayoutInner({ children }) {
  return (
    <>
      <BrandNavigationWrapper />
      <div className="container mx-auto px-6 py-6 dark:text-white">
        {children}
      </div>
    </>
  );
}

function BrandNavigationWrapper() {
  const { 
    brand, 
    storePublicId, 
    brandSlug, 
    hasChanges, 
    handleSave, 
    isSaving 
  } = useBrand();
  
  return (
    <BrandNavigation 
      storePublicId={storePublicId}
      brandSlug={brandSlug} 
      brandName={brand?.brandName || "Loading..."}
      brandTagline={brand?.brandTagline || ""}
      hasChanges={hasChanges}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}