import { NextResponse } from "next/server";
import { withStoreAccess } from "@/middleware/storeAccess";
import connectToDatabase from "@/lib/mongodb";
import BrandSettings from "@/models/Brand";

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user } = request;

    await connectToDatabase();

    // Find the default brand for this store
    let brand = await BrandSettings.findOne({ 
      store_id: store._id, 
      isDefault: true 
    });

    // If no default brand exists, create one
    if (!brand) {
      brand = await BrandSettings.findOrCreateDefault(store._id, user._id);
    }

    // Format brand data for frontend use
    const brandData = {
      id: brand._id,
      name: brand.brandName || brand.name || store.name,
      tagline: brand.brandTagline || "",
      logo: brand.logo?.primary_logo_url || null,
      logoAlt: brand.logo?.logo_alt_text || brand.brandName || "Logo",
      primaryColor: brand.primaryColor?.[0]?.hex || "#60A5FA",
      secondaryColors: brand.secondaryColors?.map(c => c.hex) || [],
      buttonColor: brand.buttonBackgroundColor || brand.primaryColor?.[0]?.hex || "#60A5FA",
      buttonTextColor: brand.buttonTextColor || "#FFFFFF",
      fontFamily: brand.getFontFamily(),
      socialLinks: brand.socialLinks || [],
      websiteUrl: brand.websiteUrl || store.url || "",
      announcement: brand.currentPromotion || "Free shipping on orders over $50!",
      year: new Date().getFullYear(),
      unsubscribeUrl: "#unsubscribe",
      preferencesUrl: "#preferences",
      privacyUrl: "#privacy",
      termsUrl: "#terms",
      // Additional brand elements
      missionStatement: brand.missionStatement || "",
      uniqueValueProposition: brand.uniqueValueProposition || "",
      selectedBenefits: brand.selectedBenefits || [],
      trustBadges: brand.trustBadges || [],
      categories: brand.categories || brand.mainProductCategories?.map(cat => ({ name: cat, link: "#" })) || [],
      socialFacebook: brand.socialFacebook || "",
      socialInstagram: brand.socialInstagram || "",
      socialTwitterX: brand.socialTwitterX || "",
      socialLinkedIn: brand.socialLinkedIn || "",
      socialYouTube: brand.socialYouTube || "",
      socialTikTok: brand.socialTikTok || "",
    };

    return NextResponse.json({ brand: brandData });
  } catch (error) {
    console.error("Error fetching brand data:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand data" },
      { status: 500 }
    );
  }
});