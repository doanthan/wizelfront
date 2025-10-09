'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Target,
  Users,
  Calendar,
  Package,
  Tag,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Idea Generator - Step 1: Campaign Objective
 *
 * First step in the horizontal swipe flow
 * User selects campaign objective/goal
 */
export default function IdeaGeneratorStep1({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);

  // Campaign objectives - Using design principles data visualization colors
  const objectives = [
    {
      id: 'product-collection-launch',
      title: 'Product/Collection Launch',
      description: 'Announce new products or collections',
      icon: Package,
      color: 'from-sky-blue to-royal-blue', // Info color
      disabled: true
    },
    {
      id: 'sale-email',
      title: 'Sale Email',
      description: 'Promote discounts and special offers',
      icon: Tag,
      color: 'from-red-400 to-red-500', // Danger color (#F87171)
      disabled: true
    },
    {
      id: 'seasonal',
      title: 'Seasonal',
      description: 'Capitalize on holidays and events',
      icon: Calendar,
      color: 'from-amber-400 to-orange-500', // Warning color (#FBBF24)
      disabled: true
    },
    {
      id: 'ai-generated',
      title: 'AI Generated',
      description: 'Let AI create campaign ideas for you',
      icon: Brain,
      color: 'from-vivid-violet to-deep-purple', // Brand accent
      disabled: false
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const storePublicId = resolvedParams.storePublicId;
        const brand = searchParams.get('brand');

        setStoreId(storePublicId);
        setBrandId(brand);

        // Fetch store details
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
    if (!selectedObjective) {
      toast({
        title: 'Selection Required',
        description: 'Please select a campaign objective',
        variant: 'destructive'
      });
      return;
    }

    // Navigate to next step with objective in URL
    router.push(`/store/${storeId}/idea-generator/step-2?brand=${brandId}&objective=${selectedObjective}`);
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
    <div className="min-h-screen">
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
      <StepTransition step="1">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Step Header */}
          <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-blue/10 text-sky-blue rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Step 1 of 4</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What's your campaign goal?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select the primary objective for your campaign
          </p>
        </div>

        {/* Objectives Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {objectives.map((objective) => {
            const Icon = objective.icon;
            const isSelected = selectedObjective === objective.id;
            const isDisabled = objective.disabled;

            return (
              <Card
                key={objective.id}
                className={cn(
                  'transition-all',
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-xl',
                  isSelected && !isDisabled
                    ? 'border-2 border-sky-blue ring-4 ring-sky-blue/20'
                    : 'border border-gray-300 dark:border-gray-600',
                  !isDisabled && !isSelected && 'hover:border-sky-blue/50'
                )}
                onClick={() => !isDisabled && setSelectedObjective(objective.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br',
                      objective.color
                    )}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {objective.title}
                        </h3>
                        {isDisabled && (
                          <span className="text-xs font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                            Coming Soon!
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {objective.description}
                      </p>
                    </div>
                    {isSelected && !isDisabled && (
                      <div className="w-6 h-6 bg-sky-blue rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleExit}
            className="border-gray-300 dark:border-gray-600"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Setup
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            disabled={!selectedObjective}
            className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-8 mt-3 text-xs font-medium">
            <span className="text-sky-blue">Objective</span>
            <span className="text-gray-400">Audience</span>
            <span className="text-gray-400">Content</span>
            <span className="text-gray-400">Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
