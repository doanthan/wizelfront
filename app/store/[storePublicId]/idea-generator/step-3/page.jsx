'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { useToast } from '@/app/components/ui/use-toast';
import MorphingLoader from '@/app/components/ui/loading';
import StepTransition from '@/app/components/idea-generator/StepTransition';
import {
  X,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sparkles
} from 'lucide-react';

/**
 * Idea Generator - Step 3: Content Preferences
 */
export default function IdeaGeneratorStep3({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [objective, setObjective] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [brandSettings, setBrandSettings] = useState(null);
  const [contentNotes, setContentNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const storePublicId = resolvedParams.storePublicId;
        const brand = searchParams.get('brand');
        const obj = searchParams.get('objective');
        const temp = searchParams.get('temperature');

        setStoreId(storePublicId);
        setBrandId(brand);
        setObjective(obj);
        setTemperature(temp);

        // Fetch store data
        const storeResponse = await fetch(`/api/store?public_id=${storePublicId}`);
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          setStore(storeData.stores?.[0] || null);
        }

        // Fetch brand settings if brand ID is available
        if (brand) {
          const brandResponse = await fetch(`/api/brands/${brand}/settings`);
          if (brandResponse.ok) {
            const brandData = await brandResponse.json();
            setBrandSettings(brandData.brandSettings || null);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams]);

  const handleNext = () => {
    router.push(`/store/${storeId}/idea-generator/step-4?brand=${brandId}&objective=${objective}&temperature=${temperature}&notes=${encodeURIComponent(contentNotes)}`);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/idea-generator/step-2?brand=${brandId}&objective=${objective}`);
  };

  const handleExit = () => {
    router.push('/idea-generator');
  };

  // Generate dynamic suggestions based on brand settings
  const getQuickSuggestions = () => {
    if (!brandSettings) {
      return [
        { display: 'Focus on sustainability', full: 'Focus on sustainability' },
        { display: 'Include customer testimonials', full: 'Include customer testimonials' },
        { display: 'Use playful tone', full: 'Use playful tone' },
        { display: 'Highlight limited-time offer', full: 'Highlight limited-time offer' },
        { display: 'Feature new arrivals', full: 'Feature new arrivals' },
        { display: 'Emphasize quality', full: 'Emphasize quality' }
      ];
    }

    const allSuggestions = [];

    // 1. Brand Voice & Tone (multiple variations)
    if (brandSettings.brandVoice?.length > 0) {
      brandSettings.brandVoice.forEach(voice => {
        allSuggestions.push({ display: `Use ${voice} tone`, full: `Use ${voice} tone` });
        allSuggestions.push({ display: `Write in ${voice} style`, full: `Write in ${voice} style` });
      });
    }

    // 2. Core Values
    if (brandSettings.coreValues?.length > 0) {
      brandSettings.coreValues.forEach(value => {
        allSuggestions.push({ display: `Highlight ${value.replace(/-/g, ' ')}`, full: `Highlight ${value.replace(/-/g, ' ')}` });
        allSuggestions.push({ display: `Emphasize our ${value.replace(/-/g, ' ')}`, full: `Emphasize our ${value.replace(/-/g, ' ')}` });
      });
    }

    // 3. Brand Personality
    if (brandSettings.brandPersonality?.length > 0) {
      brandSettings.brandPersonality.forEach(trait => {
        allSuggestions.push({ display: `Showcase ${trait.replace(/-/g, ' ')} approach`, full: `Showcase ${trait.replace(/-/g, ' ')} approach` });
      });
    }

    // 4. Customer Pain Points (address them)
    if (brandSettings.customerPainPoints?.length > 0) {
      brandSettings.customerPainPoints.forEach(pain => {
        const shortPain = pain.split(' ').slice(0, 6).join(' ');
        allSuggestions.push({ display: `Address: ${shortPain}...`, full: `Address: ${pain}` });
      });
    }

    // 5. Customer Aspirations (leverage them)
    if (brandSettings.customerAspirations?.length > 0) {
      brandSettings.customerAspirations.forEach(aspiration => {
        const shortAsp = aspiration.split(' ').slice(0, 6).join(' ');
        allSuggestions.push({ display: `Appeal to: ${shortAsp}...`, full: `Appeal to: ${aspiration}` });
      });
    }

    // 6. Trust Builders
    if (brandSettings.customerJourneyInsights?.trustBuilders?.length > 0) {
      brandSettings.customerJourneyInsights.trustBuilders.forEach(tb => {
        allSuggestions.push({ display: `Highlight ${tb.builder}`, full: `Highlight ${tb.builder}` });
        allSuggestions.push({ display: `Mention ${tb.builder}`, full: `Mention ${tb.builder}` });
      });
    }

    // 7. Decision Factors
    if (brandSettings.customerJourneyInsights?.decisionFactors?.length > 0) {
      brandSettings.customerJourneyInsights.decisionFactors.forEach(df => {
        allSuggestions.push({ display: `Emphasize ${df.factor}`, full: `Emphasize ${df.factor}` });
      });
    }

    // 8. Purchase Triggers
    if (brandSettings.customerJourneyInsights?.purchaseTriggers?.length > 0) {
      brandSettings.customerJourneyInsights.purchaseTriggers.forEach(trigger => {
        const shortTrigger = trigger.split(' ').slice(0, 5).join(' ');
        allSuggestions.push({ display: `Trigger: ${shortTrigger}...`, full: `Trigger: ${trigger}` });
      });
    }

    // 9. Bestselling Products
    if (brandSettings.bestsellingProducts?.length > 0) {
      brandSettings.bestsellingProducts.forEach(product => {
        const productName = product.split(' ')[0];
        const productDesc = product.split('-')[1]?.trim() || '';
        allSuggestions.push({ display: `Feature ${productName}`, full: `Feature ${productName}` });
        if (productDesc) {
          allSuggestions.push({ display: `Highlight ${productName}: ${productDesc.split(',')[0]}`, full: `Highlight ${productName}: ${productDesc}` });
        }
      });
    }

    // 10. Product Categories
    if (brandSettings.mainProductCategories?.length > 0) {
      brandSettings.mainProductCategories.forEach(category => {
        allSuggestions.push({ display: `Showcase ${category}`, full: `Showcase ${category}` });
      });
    }

    // 11. Unique Selling Points
    if (brandSettings.uniqueSellingPoints) {
      const usps = brandSettings.uniqueSellingPoints.split('.').filter(s => s.trim());
      usps.forEach(usp => {
        const trimmedUSP = usp.trim();
        const shortUSP = trimmedUSP.split(' ').slice(0, 6).join(' ');
        if (shortUSP) allSuggestions.push({ display: shortUSP + '...', full: trimmedUSP });
      });
    }

    // 12. Content Priority
    if (brandSettings.contentPriority?.length > 0) {
      brandSettings.contentPriority.forEach(priority => {
        allSuggestions.push({ display: `Include ${priority.replace(/-/g, ' ')}`, full: `Include ${priority.replace(/-/g, ' ')}` });
      });
    }

    // 13. Mission Statement
    if (brandSettings.missionStatement) {
      const missionWords = brandSettings.missionStatement.split(' ').slice(0, 8).join(' ');
      allSuggestions.push({ display: `Focus on: ${missionWords}...`, full: `Focus on: ${brandSettings.missionStatement}` });
    }

    // 14. Customer Personas (if available)
    if (brandSettings.customerPersonas?.length > 0) {
      brandSettings.customerPersonas.forEach(persona => {
        allSuggestions.push({ display: `Target ${persona.name}`, full: `Target ${persona.name}` });
        if (persona.psychographics?.interests?.length > 0) {
          const interest = persona.psychographics.interests[0];
          allSuggestions.push({ display: `Appeal to ${interest} enthusiasts`, full: `Appeal to ${interest} enthusiasts` });
        }
      });
    }

    // 15. Urgency Creators
    if (brandSettings.customerJourneyInsights?.urgencyCreators?.length > 0) {
      brandSettings.customerJourneyInsights.urgencyCreators.forEach(urgency => {
        const shortUrg = urgency.split(' ').slice(0, 6).join(' ');
        allSuggestions.push({ display: shortUrg + '...', full: urgency });
      });
    }

    // 16. Social Validation
    if (brandSettings.customerJourneyInsights?.socialValidation?.length > 0) {
      brandSettings.customerJourneyInsights.socialValidation.forEach(social => {
        const shortSoc = social.split(' ').slice(0, 6).join(' ');
        allSuggestions.push({ display: `Show ${shortSoc}...`, full: `Show ${social}` });
      });
    }

    // 17. Geographic Focus
    if (brandSettings.geographicFocus?.length > 0) {
      brandSettings.geographicFocus.forEach(geo => {
        allSuggestions.push({ display: `Highlight ${geo} presence`, full: `Highlight ${geo} presence` });
      });
    }

    // 18. Brand Tagline
    if (brandSettings.brandTagline) {
      allSuggestions.push({ display: `Use tagline: ${brandSettings.brandTagline}`, full: `Use tagline: ${brandSettings.brandTagline}` });
    }

    // 19. Current Promotion
    if (brandSettings.currentPromotion) {
      allSuggestions.push({ display: `Feature: ${brandSettings.currentPromotion}`, full: `Feature: ${brandSettings.currentPromotion}` });
    }

    // 20. Seasonal Focus
    if (brandSettings.seasonalFocus) {
      allSuggestions.push({ display: brandSettings.seasonalFocus, full: brandSettings.seasonalFocus });
    }

    // Remove duplicates and shuffle
    const uniqueSuggestions = allSuggestions.filter((s, index, self) =>
      s && s.display && index === self.findIndex((t) => t.display === s.display)
    );

    // Shuffle array using Fisher-Yates algorithm
    const shuffled = uniqueSuggestions.sort(() => Math.random() - 0.5);

    // Return random 20 suggestions
    return shuffled.slice(0, 20);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="font-medium">Exit Idea Generator</span>
          </button>

          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {store?.name || 'Idea Generator'}
            </span>
          </div>
        </div>
      </div>

      <StepTransition step="3">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Step Header - Compact */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/10 text-amber-500 rounded-full mb-3">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Step 3 of 4</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Content preferences
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Share any specific ideas, themes, or requirements for your campaign
          </p>
        </div>

        {/* Content Input - Centered and narrower */}
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="border border-gray-300 dark:border-gray-600">
            <CardContent className="p-5">
              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Campaign notes (optional)
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  — What would you like AI to know?
                </span>
              </label>
              <Textarea
                value={contentNotes}
                onChange={(e) => setContentNotes(e.target.value)}
                placeholder="E.g., 'Focus on sustainability', 'Include customer testimonials', 'Use playful tone'..."
                className="min-h-[140px] resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                <Sparkles className="h-3 w-3" />
                <span>The AI will use these notes to generate personalized campaign ideas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Suggestions - Full width, no scrolling */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Quick suggestions {brandSettings && <span className="text-xs text-gray-500 font-normal ml-2">(click to add, refreshes randomly)</span>}:
          </h3>
          <div className="flex flex-wrap gap-2">
            {getQuickSuggestions().map((suggestion, index) => (
              <button
                key={`${suggestion.display}-${index}`}
                onClick={() => setContentNotes(contentNotes ? `${contentNotes}\n${suggestion.full}` : suggestion.full)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0"
              >
                {suggestion.display}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-gray-300 dark:border-gray-600"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous Step
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Generate Ideas
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
      </StepTransition>

      {/* Bottom Breadcrumbs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="w-24 h-2 bg-sky-blue rounded-full" />
            <div className="w-24 h-2 bg-vivid-violet rounded-full" />
            <div className="w-24 h-2 bg-amber-400 rounded-full" />
            <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-8 mt-3 text-xs font-medium">
            <span className="text-sky-blue">Objective</span>
            <span className="text-vivid-violet">AI Options</span>
            <span className="text-amber-400">Details</span>
            <span className="text-gray-400">Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
