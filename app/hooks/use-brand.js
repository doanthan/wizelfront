"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/app/hooks/use-toast";

const BrandContext = createContext();

export function BrandProvider({ children, storePublicId, brandSlug }) {
  const { toast } = useToast();
  const [brand, setBrand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    fetchBrand();
  }, [storePublicId, brandSlug]);

  const fetchBrand = async () => {
    if (!storePublicId || !brandSlug) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch brand data from API
      const response = await fetch(`/api/store/${storePublicId}/brand/${brandSlug}`);
      
      if (!response.ok) {
        // If brand not found or error, use default empty state
        if (response.status === 404) {
          // Create a new brand with defaults
          const mockData = {
            name: brandSlug,
            brandName: brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1).replace(/-/g, ' '), 
            slug: brandSlug,
        brandTagline: "",
        missionStatement: "",
        originStory: "",
        uniqueValueProposition: "",
        brandJourney: "",
        customerPromise: "",
        websiteUrl: "",
        brandVoice: [],
        brandPersonality: [],
        coreValues: [],
        primaryColor: [{ hex: "#000000", name: "Primary" }],
        secondaryColors: [],
        logo: {
          primary_logo_url: "",
          logo_alt_text: "",
          logo_type: "image",
          brand_name: brandSlug
        },
        targetAudienceAge: [],
        targetAudienceGender: [],
        geographicFocus: [],
        industryCategories: [],
        uniqueSellingPoints: "",
        customerPainPoints: [],
        customerAspirations: [],
        mainProductCategories: [],
        bestsellingProducts: [],
        socialLinks: [],
        competitors: [],
        socialProof: {
          reviewCount: 0,
          averageRating: 0,
          testimonials: [],
          celebrityEndorsements: [],
          mediaFeatures: []
        },
        trustBadges: [],
        // Advanced fields from MongoDB
        customerPersonas: [],
        customerFears: [],
        emotionalTriggers: [],
        customerLanguage: {
          keywords: [],
          phrases: [],
          tone: "",
          avoidWords: []
        },
        brandArchetype: null,
        brandMetrics: null,
        emailStrategy: null
      };
      
      setBrand(mockData);
      setIsLoading(false);
      return;
    }
    throw new Error('Failed to fetch brand');
  }

  // Parse the successful response
  const data = await response.json();
  setBrand(data.brand);
  setIsLoading(false);
    } catch (error) {
      console.error("Error fetching brand:", error);
      toast({
        title: "Error",
        description: "Failed to load brand details",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleFieldEdit = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleFieldSave = (field) => {
    setBrand(prev => ({
      ...prev,
      [field]: tempValue
    }));
    setEditingField(null);
    setHasChanges(true);
  };

  const handleArrayItemAdd = (field, newItem) => {
    setBrand(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem]
    }));
    setHasChanges(true);
  };

  const handleArrayItemRemove = (field, index) => {
    setBrand(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!storePublicId || !brandSlug || !brand) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/brand/${brandSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brand),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand');
      }

      const data = await response.json();
      setBrand(data.brand);
      
      toast({
        title: "Success",
        description: "Brand details saved successfully"
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving brand:', error);
      toast({
        title: "Error",
        description: "Failed to save brand details",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const value = {
    brand,
    setBrand,
    isLoading,
    isSaving,
    hasChanges,
    setHasChanges,
    editingField,
    setEditingField,
    tempValue,
    setTempValue,
    handleFieldEdit,
    handleFieldSave,
    handleArrayItemAdd,
    handleArrayItemRemove,
    handleSave,
    storePublicId,
    brandSlug
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}