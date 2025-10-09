'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import MorphingLoader from '@/app/components/ui/loading';
import StepTransition from '@/app/components/idea-generator/StepTransition';
import {
  X,
  Lightbulb,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  Mail,
  Target,
  Copy,
  Download,
  FileText,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Idea Generator - Step 4: Review & Generate Ideas
 */
export default function IdeaGeneratorStep4({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [objective, setObjective] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [store, setStore] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track if generation has been initiated to prevent duplicates
  const hasGeneratedRef = useRef(false);
  const timerRef = useRef(null);

  // Mock AI-generated ideas
  const mockIdeas = [
    {
      id: 1,
      title: 'Spring Refresh Sale',
      description: 'A seasonal campaign highlighting new arrivals with fresh spring themes and colors',
      subjectLine: '🌸 Spring Into Savings - 25% Off New Arrivals',
      callToAction: 'Shop Spring Collection',
      estimatedOpenRate: '28-32%',
      bestSendTime: 'Tuesday, 10:00 AM'
    },
    {
      id: 2,
      title: 'VIP Early Access',
      description: 'Exclusive preview for loyal customers with special perks and bonus rewards',
      subjectLine: '⭐ VIP Only: Shop Before Everyone Else',
      callToAction: 'Unlock VIP Access',
      estimatedOpenRate: '35-40%',
      bestSendTime: 'Thursday, 2:00 PM'
    },
    {
      id: 3,
      title: 'Customer Stories Spotlight',
      description: 'Feature real customer testimonials and success stories with products',
      subjectLine: '❤️ See How [Product] Changed Their Lives',
      callToAction: 'Read Their Stories',
      estimatedOpenRate: '22-26%',
      bestSendTime: 'Wednesday, 11:00 AM'
    }
  ];

  // Debug: Track ideas state changes
  useEffect(() => {
    console.log('💡 Ideas state changed:', {
      count: ideas.length,
      generating,
      shouldShowCarousel: !generating && ideas.length > 0
    });
  }, [ideas, generating]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const storePublicId = resolvedParams.storePublicId;
        const brand = searchParams.get('brand');
        const obj = searchParams.get('objective');
        const temp = searchParams.get('temperature');
        const contentNotes = searchParams.get('notes') || '';

        setStoreId(storePublicId);
        setBrandId(brand);
        setObjective(obj);
        setTemperature(temp);
        setNotes(decodeURIComponent(contentNotes));

        const response = await fetch(`/api/store?public_id=${storePublicId}`);
        if (response.ok) {
          const data = await response.json();
          setStore(data.stores?.[0] || null);
        }

        // Auto-generate ideas using Claude via OpenRouter (only once)
        if (!hasGeneratedRef.current) {
          hasGeneratedRef.current = true;
          generateCampaigns(storePublicId, brand, temp, contentNotes);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [params, searchParams]);

  // Generate campaigns using Claude via OpenRouter
  const generateCampaigns = async (storePublicId, brandIdParam, temp, contentNotes) => {
    setGenerating(true);
    setElapsedTime(0);

    // Start elapsed time timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      const response = await fetch('/api/idea-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: storePublicId,
          brandId: brandIdParam,
          temperature: temp || '0.7',
          notes: contentNotes
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error response:', error);
        throw new Error(error.message || 'Failed to generate campaigns');
      }

      console.log('📦 Parsing JSON response...');
      const data = await response.json();
      console.log('📦 Parsed response:', data);
      console.log('✅ Received campaign data:', {
        success: data.success,
        campaignCount: data.campaigns?.length,
        hasData: !!data.campaigns
      });

      if (data.success && data.campaigns && Array.isArray(data.campaigns)) {
        console.log('✨ Setting ideas state with', data.campaigns.length, 'campaigns');
        console.log('First campaign sample:', data.campaigns[0]);

        // Force state update
        setIdeas([...data.campaigns]);

        // Show success toast
        setTimeout(() => {
          toast({
            title: 'Success!',
            description: `Generated ${data.campaigns.length} campaign ideas`
          });
        }, 100);
      } else {
        console.error('❌ Invalid response format:', {
          success: data.success,
          hasCampaigns: !!data.campaigns,
          isArray: Array.isArray(data.campaigns),
          data
        });
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Campaign generation error:', error);

      // Handle timeout errors
      if (error.name === 'AbortError') {
        toast({
          title: 'Request Timeout',
          description: 'The AI is taking longer than expected. Please try again with fewer campaigns or simpler parameters.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Generation Failed',
          description: error.message || 'Failed to generate campaign ideas. Please try again.',
          variant: 'destructive'
        });
      }

      // Fallback to mock ideas on error
      setIdeas(mockIdeas);
    } finally {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      console.log('🏁 Generation complete, setting generating=false, ideas count:', ideas.length);
      setGenerating(false);
    }
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/idea-generator/step-3?brand=${brandId}&objective=${objective}&temperature=${temperature}`);
  };

  const handleExit = () => {
    router.push('/idea-generator');
  };

  // Carousel navigation - move one card at a time, infinite loop
  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        // Loop to last set of 3 cards
        return Math.max(0, ideas.length - 3);
      }
      return prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      if (prev >= ideas.length - 3) {
        // Loop back to beginning
        return 0;
      }
      return prev + 1;
    });
  };

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped left - next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right - previous
      handlePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleCopyIdea = (idea) => {
    const subjectLines = idea.subjectLines || [idea.subjectLine];
    const text = `Campaign: ${idea.campaignName || idea.title}

Hook Angle: ${idea.hookAngle || 'N/A'}

Subject Lines:
${subjectLines.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

Preview Text: ${idea.previewText || 'N/A'}

Core Message: ${idea.coreMessage || idea.description || 'N/A'}

CTA & Goal: ${idea.ctaAndGoal || idea.callToAction || 'N/A'}

Format: ${idea.formatRecommendation || 'N/A'}`;

    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Campaign idea copied to clipboard'
    });
  };

  const handleExportAll = () => {
    const text = ideas.map((idea, index) => {
      const subjectLines = idea.subjectLines || [idea.subjectLine];
      return `CAMPAIGN ${index + 1}: ${idea.campaignName || idea.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hook Angle: ${idea.hookAngle || 'N/A'}

Subject Lines:
${subjectLines.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

Preview Text: ${idea.previewText || 'N/A'}

Core Message: ${idea.coreMessage || idea.description || 'N/A'}

CTA & Goal: ${idea.ctaAndGoal || idea.callToAction || 'N/A'}

Format Recommendation: ${idea.formatRecommendation || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
    }).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-ideas-${Date.now()}.txt`;
    a.click();

    toast({
      title: 'Exported!',
      description: `Exported ${ideas.length} campaign ideas successfully`
    });
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
            disabled={generating}
            className={cn(
              "flex items-center gap-2 transition-colors",
              generating
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
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

      <StepTransition step="4">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Generating State */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-20">
            <MorphingLoader
              size="large"
              showText={true}
              customThemeTexts={[
                'Analyzing your preferences...',
                'Generating creative ideas...',
                'Crafting campaign concepts...',
                'Finalizing recommendations...'
              ]}
            />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Elapsed time: <span className="font-semibold text-gray-900 dark:text-white">{elapsedTime}s</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                This may take 1-3 minutes for high-quality AI-generated campaigns
              </p>
            </div>
          </div>
        )}

        {/* Carousel Display - 3 Cards with Smooth Scroll */}
        {!generating && ideas.length > 0 && (
          <div className="mb-12">
            {/* Carousel Container */}
            <div className="relative min-h-[600px] flex items-center">
              {/* Previous Button - Fixed position */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg"
                style={{ top: '300px' }}
                aria-label="Previous idea"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>

              {/* 3 Cards Grid with Smooth Transition */}
              <div
                className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ease-in-out"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {ideas.slice(currentIndex, currentIndex + 3).map((idea, idx) => (
                <Card key={currentIndex + idx} className="border-2 border-gray-300 dark:border-gray-600 shadow-xl">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-lg flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <CardTitle className="text-lg text-gray-900 dark:text-white">
                            {idea.campaignName || idea.title}
                          </CardTitle>
                        </div>
                        {idea.hookAngle && (
                          <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                            <span className="font-semibold">Hook: </span>{idea.hookAngle}
                          </p>
                        )}
                        {idea.conceptExplanation && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                            {idea.conceptExplanation}
                          </p>
                        )}
                        {idea.coreMessage && (
                          <p className="text-sm text-gray-900 dark:text-gray-100 mt-2">
                            {idea.coreMessage || idea.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyIdea(idea)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Subject Lines */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-3 w-3 text-sky-blue" />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            Subject Lines
                          </span>
                        </div>
                        <div className="space-y-1">
                          {(idea.subjectLines || [idea.subjectLine]).map((subject, subIdx) => (
                            <p key={subIdx} className="text-xs text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              {subject}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Preview Text */}
                      {idea.previewText && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-3 w-3 text-vivid-violet" />
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              Preview Text
                            </span>
                          </div>
                          <p className="text-xs text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                            {idea.previewText}
                          </p>
                        </div>
                      )}

                      {/* CTA and Goal */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-3 w-3 text-vivid-violet" />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            CTA & Goal
                          </span>
                        </div>
                        <p className="text-xs text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          {idea.ctaAndGoal || idea.callToAction}
                        </p>
                      </div>

                      {/* Format Recommendation */}
                      {idea.formatRecommendation && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-3 w-3 text-amber-500" />
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              Format
                            </span>
                          </div>
                          <p className="text-xs text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                            {idea.formatRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {/* Next Button - Fixed position */}
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg"
                style={{ top: '300px' }}
                aria-label="Next idea"
              >
                <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Carousel Dots - Individual cards */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {ideas.slice(0, Math.min(ideas.length, 15)).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    currentIndex === index
                      ? "w-8 bg-gradient-to-r from-sky-blue to-vivid-violet"
                      : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  )}
                  aria-label={`Go to idea ${index + 1}`}
                />
              ))}
              {ideas.length > 15 && (
                <span className="text-xs text-gray-500 ml-2">+{ideas.length - 15} more</span>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={generating}
            className="border-gray-300 dark:border-gray-600"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous Step
          </Button>

          <Button
            size="lg"
            onClick={handleExit}
            disabled={generating}
            className={cn(
              "shadow-lg hover:shadow-xl transition-all",
              generating
                ? "bg-gray-400 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            )}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Done
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
            <div className="w-24 h-2 bg-emerald-400 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-8 mt-3 text-xs font-medium">
            <span className="text-sky-blue">Objective</span>
            <span className="text-vivid-violet">Creativity</span>
            <span className="text-amber-400">Details</span>
            <span className="text-emerald-400">Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
