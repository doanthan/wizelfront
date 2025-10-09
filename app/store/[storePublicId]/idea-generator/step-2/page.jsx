'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import MorphingLoader from '@/app/components/ui/loading';
import StepTransition from '@/app/components/idea-generator/StepTransition';
import {
  X,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  Target,
  Rocket,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Idea Generator - Step 2: Creativity Level Selection
 *
 * User selects the AI creativity/temperature level
 */
export default function IdeaGeneratorStep2({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [objective, setObjective] = useState(null);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [selectedTemperature, setSelectedTemperature] = useState('0.7');

  // Creativity levels with temperature values
  const creativityLevels = [
    {
      id: 'safe',
      name: 'Safe & Proven',
      temperature: 0.6,
      icon: Shield,
      color: 'from-emerald-400 to-green-500',
      description: 'Conservative, data-driven ideas based on proven strategies',
      example: 'Subject Line: "Last Chance: Your 20% Off Ends Tonight at Midnight"',
      whenToUse: 'When you need reliable results and have tested campaigns that work',
      ideal: [
        'Promotional emails with clear offers',
        'Re-engagement campaigns',
        'Proven seasonal campaigns',
        'High-stakes launches'
      ]
    },
    {
      id: 'balanced',
      name: 'Balanced',
      temperature: 0.7,
      icon: Target,
      color: 'from-sky-blue to-royal-blue',
      description: 'Mix of proven tactics with creative elements',
      example: 'Subject Line: "You\'ve Been Matched: New Arrivals Perfect for Your Style ✨"',
      whenToUse: 'Best for most campaigns - balances safety with fresh ideas',
      recommended: true,
      ideal: [
        'Regular email campaigns',
        'Product launches',
        'Newsletter content',
        'Customer engagement'
      ]
    },
    {
      id: 'creative',
      name: 'Creative & Bold',
      temperature: 0.8,
      icon: Rocket,
      color: 'from-vivid-violet to-deep-purple',
      description: 'Unique angles and unexpected approaches',
      example: 'Subject Line: "Plot Twist: Your Closet Just Wrote You a Love Letter 💌"',
      whenToUse: 'When you want to stand out and can take calculated risks',
      ideal: [
        'Brand awareness campaigns',
        'Content marketing',
        'Testing new messaging',
        'Younger audiences'
      ]
    },
    {
      id: 'experimental',
      name: 'Experimental',
      temperature: 0.9,
      icon: Zap,
      color: 'from-amber-400 to-orange-500',
      description: 'Highly creative, unconventional ideas',
      example: 'Subject Line: "🚨 Emergency: Your Inbox is Too Boring. We\'re Here to Fix It."',
      whenToUse: 'For A/B testing or when you want completely fresh perspectives',
      ideal: [
        'A/B test variations',
        'Viral marketing attempts',
        'Breaking through inbox noise',
        'Innovation-focused brands'
      ]
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const storePublicId = resolvedParams.storePublicId;
        const brand = searchParams.get('brand');
        const obj = searchParams.get('objective');

        setStoreId(storePublicId);
        setBrandId(brand);
        setObjective(obj);

        const response = await fetch(`/api/store?public_id=${storePublicId}`);
        if (response.ok) {
          const data = await response.json();
          setStore(data.stores?.[0] || null);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load store information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams]);

  const handleNext = () => {
    router.push(`/store/${storeId}/idea-generator/step-3?brand=${brandId}&objective=${objective}&temperature=${selectedTemperature}`);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/idea-generator/step-1?brand=${brandId}`);
  };

  const handleExit = () => {
    router.push('/idea-generator');
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

      {/* Main Content */}
      <StepTransition step="2">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Step Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-vivid-violet/10 text-vivid-violet rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Step 2 of 4</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose your creativity level
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              How bold should the AI be with your campaign ideas?
            </p>
          </div>

          {/* Creativity Levels Grid - Single Row */}
          <div className="grid grid-cols-4 gap-4 mb-12">
            {creativityLevels.map((level) => {
              const Icon = level.icon;
              const isSelected = selectedTemperature === level.temperature.toString();

              return (
                <Card
                  key={level.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-xl relative group',
                    isSelected
                      ? 'border-2 border-vivid-violet ring-4 ring-vivid-violet/20'
                      : 'border border-gray-300 dark:border-gray-600 hover:border-vivid-violet/50'
                  )}
                  onClick={() => setSelectedTemperature(level.temperature.toString())}
                >
                  {level.recommended && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-vivid-violet to-deep-purple text-white text-[10px] font-semibold rounded-full shadow-lg whitespace-nowrap">
                        Recommended
                      </span>
                    </div>
                  )}

                  <CardContent className="p-4">
                    {/* Icon and Title */}
                    <div className="flex flex-col items-center text-center mb-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-2',
                        level.color
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        {level.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {level.description}
                      </p>
                    </div>

                    {/* Example Preview */}
                    <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-[10px] font-semibold text-gray-900 dark:text-white mb-1">
                        Example:
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">
                        {level.example}
                      </p>
                    </div>

                    {/* When to Use - Compact */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {level.whenToUse}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-vivid-violet rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
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
              className="bg-gradient-to-r from-vivid-violet to-deep-purple hover:from-deep-purple hover:to-vivid-violet text-white shadow-lg hover:shadow-xl transition-all"
            >
              Next Step
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
            <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-8 mt-3 text-xs font-medium">
            <span className="text-sky-blue">Objective</span>
            <span className="text-vivid-violet">Creativity</span>
            <span className="text-gray-400">Details</span>
            <span className="text-gray-400">Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
