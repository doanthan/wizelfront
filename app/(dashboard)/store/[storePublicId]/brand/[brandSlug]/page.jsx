import { redirect } from "next/navigation";
import React from "react";

export default async function BrandPage({ params }) {
  const { storePublicId, brandSlug } = await params;
  
  // Redirect to the identity page by default
  redirect(`/store/${storePublicId}/brand/${brandSlug}/identity`);
}