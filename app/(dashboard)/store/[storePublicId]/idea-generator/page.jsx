"use client";

import React, { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/app/hooks/use-toast";
import {
  Target,
  Users,
  Mail,
  Sparkles,
  Zap,
  CheckCircle,
  Send,
  TrendingUp,
  ChevronRight,
  Download,
  Wand2,
  AlertCircle,
  Building,
  ShoppingBag,
  UserCircle,
  Lightbulb,
  ChevronLeft,
  Trophy,
  TrendingUp as TrendingUpIcon,
  Clock,
  Heart,
  Star,
  BookOpen,
  UserPlus,
  RotateCcw,
  Package,
  Percent,
  Link,
  Search,
  X,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to get category icon
const getCategoryIcon = (category) => {
  const categoryMap = {
    'Product Spotlight': ShoppingBag,
    'Educational': BookOpen,
    'Brand Story': Users,
    'Social Proof': Star,
    'Seasonal': Clock,
    'Welcome': UserPlus,
    'Retention': RefreshCw,
    'Win-back': RotateCcw,
    'general': Lightbulb
  };
  return categoryMap[category] || Lightbulb;
};

// Helper function to get priority color
const getPriorityColor = (priority) => {
  const colors = {
    'High': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };
  return colors[priority] || 'bg-gray-100 text-gray-700';
};

export default function StoreIdeaGeneratorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const [storeId, setStoreId] = useState(null);
  const brandId = searchParams.get('brand') || 'default';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepData, setStepData] = useState({});
  const [brands, setBrands] = useState([
    { id: 'default', name: 'Default Brand' },
    { id: 'secondary', name: 'Secondary Brand' }
  ]);
  const [selectedBrand, setSelectedBrand] = useState(brandId);

  // Campaign state
  const [emailType, setEmailType] = useState(''); // 'product', 'story', or 'promotional'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [promotionalPrompt, setPromotionalPrompt] = useState('');
  const [ctaLink, setCTALink] = useState('');
  const [campaignGoals, setCampaignGoals] = useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [brandSettings, setBrandSettings] = useState(null);
  const [loadingBrandSettings, setLoadingBrandSettings] = useState(false);

  // Product selection state
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(18);
  
  // Use useEffect to handle async params and fetch brand settings
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setStoreId(resolvedParams.storePublicId);
    }
    getParams();
  }, [params]);

  // Fetch brand settings when brandId is available
  useEffect(() => {
    async function fetchBrandSettings() {
      if (!brandId || brandId === 'default') {
        toast({
          title: "Brand Required",
          description: "Please select a brand to generate ideas.",
          variant: "destructive"
        });
        return;
      }

      setLoadingBrandSettings(true);
      try {
        const response = await fetch(`/api/brands/${brandId}/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.brandSettings) {
            setBrandSettings(data.brandSettings);
            toast({
              title: "Brand data loaded",
              description: `Ready to generate ideas for ${data.brandSettings.brandName || data.brandSettings.name}`,
            });
          }
        } else {
          toast({
            title: "Failed to load brand",
            description: "Could not load brand settings. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching brand settings:', error);
        toast({
          title: "Error",
          description: "Failed to load brand settings.",
          variant: "destructive"
        });
      } finally {
        setLoadingBrandSettings(false);
      }
    }

    fetchBrandSettings();
  }, [brandId]);
  
  // Step-by-step campaign creation steps
  const steps = [
    {
      id: 'choose-type',
      title: "Choose Email Type",
      description: "Select the type of email campaign you want to create",
      tasks: [
        "Product/Catalog: Individual products, collections, bundles, or lookbooks",
        "Story Telling: Brand narrative, customer stories, or educational content",
        "Promotional: Sales, offers, cart recovery, or transactional updates"
      ],
      icon: Mail
    },
    {
      id: 'select-products',
      title: "Select Products (Optional)",
      description: "Choose specific products or collections to feature",
      tasks: [
        "Browse product catalog",
        "Select featured products",
        "Choose collections or bundles",
        "Set product priorities"
      ],
      icon: ShoppingBag
    },
    {
      id: 'define-goals',
      title: "Generate Campaign Ideas",
      description: "Create AI-powered campaign ideas based on your selections",
      tasks: [
        "Define campaign objectives",
        "Set measurable KPIs",
        "Generate targeted ideas",
        "Select best concepts"
      ],
      icon: Target
    },
    {
      id: 'segment-audience',
      title: "Segment Your Audience",
      description: "Create targeted segments based on your selection",
      tasks: [
        "Import customer data into Klaviyo",
        "Create segments based on behavior and demographics",
        "Validate segment sizes and engagement history"
      ],
      icon: Users
    },
    {
      id: 'craft-message',
      title: "Craft Your Message",
      description: "Write compelling copy that resonates",
      tasks: [
        "Write attention-grabbing subject lines",
        "Create preview text that complements the subject",
        "Develop body copy with clear value proposition",
        "Add personalization tokens for dynamic content"
      ],
      icon: Mail
    },
    {
      id: 'design-template',
      title: "Design Email Template",
      description: "Create visually appealing email design",
      tasks: [
        "Choose responsive email template",
        "Add brand colors and logo",
        "Insert product images and graphics",
        "Optimize for mobile devices"
      ],
      icon: Sparkles
    },
    {
      id: 'setup-automation',
      title: "Set Up Automation",
      description: "Configure triggers and timing",
      tasks: [
        "Set send time based on audience timezone",
        "Configure A/B testing variants",
        "Set up follow-up sequences",
        "Enable tracking and analytics"
      ],
      icon: Zap
    },
    {
      id: 'test-preview',
      title: "Test & Preview",
      description: "Ensure everything works perfectly",
      tasks: [
        "Send test emails to team members",
        "Check rendering across email clients",
        "Verify all links and CTAs work",
        "Review personalization tokens"
      ],
      icon: CheckCircle
    },
    {
      id: 'launch-campaign',
      title: "Launch Campaign",
      description: "Send your campaign live",
      tasks: [
        "Final review of all settings",
        "Schedule or send immediately",
        "Monitor initial performance",
        "Prepare for customer responses"
      ],
      icon: Send
    },
    {
      id: 'analyze-results',
      title: "Analyze Results",
      description: "Measure success and learn",
      tasks: [
        "Track open and click rates",
        "Monitor conversion metrics",
        "Analyze customer feedback",
        "Document learnings for future campaigns"
      ],
      icon: TrendingUp
    }
  ];

  const handleBrandChange = (newBrandId) => {
    setSelectedBrand(newBrandId);
    if (storeId) {
      router.push(`/store/${storeId}/idea-generator?brand=${newBrandId}`);
    }
  };

  // Fetch all products directly from Shopify
  const fetchAllProducts = async (forceRefresh = false) => {
    if (!storeId || (allProducts.length > 0 && !forceRefresh)) return;

    setLoadingItems(true);
    try {
      const response = await fetch(`/api/store/${storeId}/shopify-products`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      console.log(`Loaded ${data.products.length} products from Shopify (${data.pages_fetched} pages)`);
      setAllProducts(data.products);
      setFilteredProducts(data.products);

      // Show success toast for large catalogs
      if (data.products.length > 250) {
        toast({
          title: "Products loaded successfully",
          description: `Loaded all ${data.products.length} products from your Shopify catalog`,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Failed to load products",
        description: error.message || "Unable to fetch products from Shopify.",
        variant: "destructive"
      });
    } finally {
      setLoadingItems(false);
    }
  };

  // Filter products based on search
  const filterProducts = () => {
    let filtered = allProducts;

    if (itemSearch) {
      const searchLower = itemSearch.toLowerCase();
      filtered = allProducts.filter(product =>
        product.title.toLowerCase().includes(searchLower) ||
        product.vendor.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  // Fetch all products when Step 2 is active
  useEffect(() => {
    if (currentStep === 1 && storeId) {
      fetchAllProducts();
    }
  }, [currentStep, storeId]);

  // Filter products when search changes
  useEffect(() => {
    filterProducts();
  }, [itemSearch, allProducts]);

  // Toggle product/collection selection
  const toggleItemSelection = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Generate campaign ideas using AI (with or without custom goals)
  const generateCampaignIdeas = async (useCustomGoals = false) => {
    if (!brandSettings && !useCustomGoals) {
      toast({
        title: "Brand data required",
        description: "Please wait for brand settings to load or select a brand.",
        variant: "destructive"
      });
      return;
    }

    if (useCustomGoals && !campaignGoals.trim() && emailType !== 'promotional') {
      toast({
        title: "Goals required",
        description: "Please define your campaign goals first.",
        variant: "destructive"
      });
      return;
    }

    // For promotional emails, check if promotional prompt is provided
    if (emailType === 'promotional' && !useCustomGoals && !promotionalPrompt.trim()) {
      toast({
        title: "Promotion details required",
        description: "Please describe your sale or promotion for promotional campaigns.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingIdeas(true);
    setGeneratedIdeas([]); // Clear previous ideas

    // Build the prompt based on email type
    let enhancedPrompt = useCustomGoals ? campaignGoals : '';
    if (emailType === 'promotional') {
      enhancedPrompt += `\nCampaign Type: Promotional Email
Promotion Details: ${promotionalPrompt.trim()}
CTA Link: ${ctaLink || 'To be determined'}
Focus: Create urgency and drive immediate action with this promotion.`;
    } else if (emailType === 'product') {
      enhancedPrompt += `\nCampaign Type: Product/Catalog Email
Selected Products: ${selectedProducts.length > 0 ? selectedProducts.join(', ') : 'Full catalog'}
Focus: Showcase products effectively and highlight their unique value propositions.`;
    } else if (emailType === 'story') {
      enhancedPrompt += `\nCampaign Type: Story Telling Email
Focus: Build emotional connection through brand narrative and customer stories.`;
    }

    try {
      const response = await fetch('/api/idea-generator/campaign-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          brandId: selectedBrand,
          emailType,
          userPrompt: useCustomGoals ? enhancedPrompt : enhancedPrompt,
          selectedProducts,
          promotionalPrompt: emailType === 'promotional' ? promotionalPrompt : null,
          ctaLink: emailType === 'promotional' ? ctaLink : null,
          useBrandSettingsOnly: !useCustomGoals
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();

      if (data.fallback && data.rawContent) {
        // If JSON parsing failed, show the raw content
        const modelUsed = data.modelUsed || 'fallback model';
        toast({
          title: "Ideas generated (text format)",
          description: `The AI generated ideas in text format using ${modelUsed}. Please review them below.`,
        });
        setGeneratedIdeas([{
          id: 'fallback-1',
          title: 'AI Generated Ideas',
          concept: data.rawContent,
          subjectLine: 'Review the generated content',
          hook: 'Multiple campaign ideas in text format',
          category: 'general'
        }]);
      } else if (data.ideas) {
        setGeneratedIdeas(data.ideas);
        const modelInfo = data.metadata?.model || 'AI';
        const fallbackUsed = data.metadata?.fallbackUsed;

        // Show which model was used in the toast
        const modelDisplay = modelInfo.includes('gemini') ? 'Gemini AI' :
                           modelInfo === 'openai/gpt-4.1' ? 'GPT-4.1' :
                           modelInfo.includes('gpt-4') ? 'GPT-4' :
                           modelInfo.includes('openrouter-fallback') ? 'AI (with fallback)' :
                           'AI';

        toast({
          title: "Campaign ideas generated!",
          description: `${data.ideas.length} unique campaign ideas created using ${modelDisplay}.`,
        });

        // Log which model was used for transparency
        if (fallbackUsed) {
          console.log(`Note: Fallback model used (${modelInfo}) due to primary model unavailability.`);
        }

        // Scroll to generated ideas section
        setTimeout(() => {
          document.getElementById('generated-ideas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);

        // Reset carousel to first page when new ideas are generated
        setCurrentCarouselIndex(0);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast({
        title: "Failed to generate ideas",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Get icon for idea category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'education': return Lightbulb;
      case 'social-proof': return Users;
      case 'product-focus': return ShoppingBag;
      case 'transformation': return TrendingUpIcon;
      case 'exclusive': return Trophy;
      case 'timely': return Clock;
      case 'engagement': return Heart;
      default: return Star;
    }
  };

  // Get color for priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-700 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Toggle idea selection with max 3 limit
  const toggleIdeaSelection = (ideaId) => {
    setSelectedIdeas(prev => {
      if (prev.includes(ideaId)) {
        return prev.filter(id => id !== ideaId);
      }
      // Limit to 3 selections
      if (prev.length >= 3) {
        toast({
          title: "Maximum selections reached",
          description: "You can only select up to 3 ideas. Please deselect an idea first.",
          variant: "destructive"
        });
        return prev;
      }
      return [...prev, ideaId];
    });
  };

  // Carousel state
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const cardsPerView = 2;
  const maxCarouselIndex = Math.max(0, Math.ceil(generatedIdeas.length / cardsPerView) - 1);

  const nextCarousel = () => {
    setCurrentCarouselIndex(prev => Math.min(prev + 1, maxCarouselIndex));
  };

  const prevCarousel = () => {
    setCurrentCarouselIndex(prev => Math.max(prev - 1, 0));
  };

  const handleStepComplete = (stepIndex) => {
    // For step 0 (Define Goals), validate that goals are entered
    if (stepIndex === 0) {
      if (!campaignGoals.trim()) {
        toast({
          title: "Goals required",
          description: "Please define your campaign goals before proceeding.",
          variant: "destructive"
        });
        return;
      }
      // Save the goals to stepData
      setStepData(prev => ({ ...prev, goals: campaignGoals }));
    }

    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    if (stepIndex < steps.length - 1) {
      const nextStep = stepIndex + 1;
      setCurrentStep(nextStep);
      // Auto-scroll to next step
      setTimeout(() => {
        document.getElementById(`step-${nextStep}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  };

  const canProceedToStep = (stepIndex) => {
    // Can only go to a step if all previous steps are completed
    if (stepIndex === 0) return true;

    // Step 1 requires email type selection
    if (stepIndex === 1 && !emailType) {
      return false;
    }

    // Step 3 (index 2) requires completing previous steps
    if (stepIndex === 2) {
      if (!emailType) return false;
      // Step 2 is optional, so we can proceed if Step 1 is complete
      if (!completedSteps.includes(0)) return false;
    }

    // Step 4 and beyond require generated ideas
    if (stepIndex >= 3 && generatedIdeas.length === 0) {
      return false;
    }

    for (let i = 0; i < stepIndex; i++) {
      // Skip checking Step 2 (index 1) as it's optional
      if (i === 1) continue;
      if (!completedSteps.includes(i)) {
        return false;
      }
    }
    return true;
  };

  const handleStepClick = (index) => {
    if (canProceedToStep(index)) {
      setCurrentStep(index);
      // Smooth scroll to the selected step
      setTimeout(() => {
        document.getElementById(`step-${index}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } else {
      toast({
        title: "Complete previous steps first",
        description: "You must complete all previous steps before proceeding.",
        variant: "destructive"
      });
    }
  };

  const exportStrategy = () => {
    const exportData = {
      store: storeId,
      brand: selectedBrand,
      steps: steps,
      completedSteps: completedSteps,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-strategy-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Strategy exported",
      description: "Campaign strategy has been downloaded",
    });
  };

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <MorphingLoader size="small" showThemeText={false} />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-4 max-w-7xl">
      {/* Brand Selector Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedBrand} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-neutral-gray">
            Store: {storeId}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportStrategy}
          className="border-sky-blue text-sky-blue hover:bg-sky-blue/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Strategy
        </Button>
      </div>

      {/* Main Content - Vertical Steps Layout */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-blue via-vivid-violet to-deep-purple opacity-20 hidden lg:block" />

        {/* Steps List - Full Width Vertical Layout */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index);
            const canProceed = canProceedToStep(index);

            return (
              <React.Fragment key={step.id}>
                <div
                  id={`step-${index}`}
                  className="scroll-mt-24"
                >
                <Card
                  className={cn(
                    "transition-all cursor-pointer relative ml-0 lg:ml-16",
                    isActive && "ring-2 ring-sky-blue shadow-xl scale-[1.02]",
                    isCompleted && "bg-green-50 dark:bg-green-900/20",
                    !canProceed && index !== currentStep && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  {/* Step Number Circle - Positioned on the line */}
                  <div className={cn(
                    "absolute -left-16 top-8 hidden lg:flex",
                    "w-12 h-12 rounded-full items-center justify-center",
                    "border-4 bg-white dark:bg-gray-900",
                    isActive
                      ? "border-sky-blue shadow-lg shadow-sky-blue/50"
                      : isCompleted
                      ? "border-green-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}>
                    <span className={cn(
                      "text-lg font-bold",
                      isActive ? "text-sky-blue" : isCompleted ? "text-green-600" : "text-gray-700 dark:text-gray-400"
                    )}>
                      {isCompleted ? "✓" : index + 1}
                    </span>
                  </div>

                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center lg:hidden",
                      isActive 
                        ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className={cn(
                        "text-lg",
                        isActive && "text-sky-blue"
                      )}>
                        Step {index + 1}: {step.title}
                      </CardTitle>
                      <CardDescription className="text-gray-700 dark:text-gray-300">{step.description}</CardDescription>
                    </div>
                    {isActive && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepComplete(index);
                        }}
                        className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                      >
                        Mark Complete
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {isActive && (
                  <CardContent>
                    {/* Step 1: Choose Email Type */}
                    {index === 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                          Choose the type of email campaign you want to create. This will determine the content and structure of your campaign.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Product/Catalog Option */}
                          <Card
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-lg",
                              emailType === 'product' && "ring-2 ring-sky-blue bg-sky-50 dark:bg-sky-900/20"
                            )}
                            onClick={() => setEmailType('product')}
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <ShoppingBag className="h-12 w-12 text-sky-blue" />
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Product/Catalog</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Individual products, collections, bundles, or lookbooks
                                </p>
                                <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                                  Showcase items
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Story Telling Option */}
                          <Card
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-lg",
                              emailType === 'story' && "ring-2 ring-vivid-violet bg-purple-50 dark:bg-purple-900/20"
                            )}
                            onClick={() => setEmailType('story')}
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <BookOpen className="h-12 w-12 text-vivid-violet" />
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Story Telling</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Brand narrative, customer stories, or educational content
                                </p>
                                <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                                  Build connection
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Promotional Option */}
                          <Card
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-lg",
                              emailType === 'promotional' && "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/20"
                            )}
                            onClick={() => setEmailType('promotional')}
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <Zap className="h-12 w-12 text-amber-500" />
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Promotional</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Sales, offers, cart recovery, or transactional updates
                                </p>
                                <Badge variant="outline" className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                                  Drive action
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {emailType && (
                          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Email type selected: {emailType === 'product' ? 'Product/Catalog' : emailType === 'story' ? 'Story Telling' : 'Promotional'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setCompletedSteps([...completedSteps, 0]);
                                  setCurrentStep(1);
                                }}
                                className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                              >
                                Continue to Step 2
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : index === 1 ? (
                      /* Step 2: Product Selection (Optional) */
                      <div className="space-y-4">
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {emailType === 'promotional' ?
                              'Configure your promotional details:' :
                              'Select products to feature in your campaign (optional):'}
                          </p>
                        </div>

                        {emailType === 'promotional' ? (
                          /* Promotional Prompt Form */
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="promotional-prompt">Describe Your Sale/Promotion</Label>
                              <Textarea
                                id="promotional-prompt"
                                placeholder="Example: 25% off all winter jackets through January 31st. Free shipping on orders over $75. Perfect for staying warm this season."
                                value={promotionalPrompt}
                                onChange={(e) => setPromotionalPrompt(e.target.value)}
                                className="min-h-[120px] resize-none"
                              />
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Include discount details, timing, conditions, and any special features.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="cta-link">Call to Action Link</Label>

                              {/* Quick Select Buttons */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCTALink(brandSettings?.websiteUrl || 'https://yourstore.com')}
                                  className="text-xs"
                                >
                                  Main Page
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCTALink(`${brandSettings?.websiteUrl || 'https://yourstore.com'}/sale`)}
                                  className="text-xs"
                                >
                                  Sale Page
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCTALink(`${brandSettings?.websiteUrl || 'https://yourstore.com'}/collections/all`)}
                                  className="text-xs"
                                >
                                  All Products
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCTALink(`${brandSettings?.websiteUrl || 'https://yourstore.com'}/collections/new`)}
                                  className="text-xs"
                                >
                                  New Arrivals
                                </Button>
                              </div>

                              <Input
                                id="cta-link"
                                type="url"
                                placeholder="https://yourstore.com/sale"
                                value={ctaLink}
                                onChange={(e) => setCTALink(e.target.value)}
                              />
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                Promotional campaigns will generate ideas for sales-driven emails with clear CTAs and urgency based on your description.
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Product & Collection Selection Interface */
                          <div className="space-y-4">
                            {/* Search and Filter Bar */}
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
                                {itemSearch && ` (filtered from ${allProducts.length} total)`}
                                <span className="ml-2 text-xs text-gray-700 dark:text-gray-400">• Live from Shopify</span>
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAllProducts([]);
                                  setFilteredProducts([]);
                                  fetchAllProducts(true);
                                }}
                                className="h-7 text-xs"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Refresh
                              </Button>
                            </div>
                            <div className="flex flex-col md:flex-row gap-3">
                              <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                <Input
                                  type="text"
                                  placeholder="Search products..."
                                  value={itemSearch}
                                  onChange={(e) => {
                                    setItemSearch(e.target.value);
                                    setCurrentPage(1);
                                  }}
                                  className="pl-10 pr-10"
                                />
                                {itemSearch && (
                                  <button
                                    onClick={() => {
                                      setItemSearch('');
                                      setCurrentPage(1);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Selected Products Preview - Shown right below search */}
                            {selectedProducts.length > 0 && (
                              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {selectedProducts.length} selected
                                  </span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {selectedProducts.slice(0, 8).map((product) => (
                                    <div
                                      key={product.id}
                                      className="relative group"
                                      title={product.title}
                                    >
                                      <div className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 overflow-hidden">
                                        <img
                                          src={product.image || '/placeholder-product.png'}
                                          alt={product.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  {selectedProducts.length > 8 && (
                                    <div className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        +{selectedProducts.length - 8}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Products & Collections Grid */}
                            {loadingItems ? (
                              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                                <MorphingLoader size="medium" showText={true} text="Loading products from Shopify..." />
                                <p className="text-xs text-gray-700 dark:text-gray-400">This may take a moment for large catalogs</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto p-2">
                                {/* Products */}
                                {filteredProducts
                                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                  .map((product) => {
                                  const isSelected = selectedProducts.some(p => p.id === product.id);
                                  return (
                                    <div
                                      key={product.id}
                                      onClick={() => toggleItemSelection(product)}
                                      className={cn(
                                        "relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md",
                                        isSelected
                                          ? "border-sky-blue bg-sky-50 dark:bg-sky-900/20"
                                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                      )}
                                    >
                                      <div className="absolute top-2 left-2 z-10">
                                        <Badge className="bg-sky-blue text-white text-xs">
                                          Product
                                        </Badge>
                                      </div>
                                      {isSelected && (
                                        <div className="absolute top-2 right-2 z-10">
                                          <CheckCircle className="h-5 w-5 text-sky-blue" />
                                        </div>
                                      )}
                                      <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-50">
                                        <img
                                          src={product.image || '/placeholder-product.png'}
                                          alt={product.title}
                                          className="w-full h-full object-cover transition-opacity duration-300"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/placeholder-product.png';
                                          }}
                                          onLoad={(e) => {
                                            e.target.style.opacity = '1';
                                          }}
                                          style={{ opacity: '0.8' }}
                                        />
                                      </div>
                                      <div className="p-2">
                                        <p className="font-medium text-xs line-clamp-2">{product.title}</p>
                                        {product.price && (
                                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                            ${product.price}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Pagination */}
                            {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                              <div className="flex justify-center items-center gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>
                                <span className="text-sm text-gray-700 dark:text-gray-300 mx-2">
                                  Page {currentPage} of {Math.ceil(filteredProducts.length / itemsPerPage)}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), prev + 1))}
                                  disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                                >
                                  Next
                                </Button>
                              </div>
                            )}

                            {/* Selected Items Summary with Images */}
                            {selectedProducts.length > 0 && (
                              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Selected Products</h4>
                                  <button
                                    onClick={() => {
                                      setSelectedProducts([]);
                                    }}
                                    className="text-xs text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    Clear all
                                  </button>
                                </div>

                                {/* Image Cards Grid */}
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-3">
                                  {selectedProducts.map((product) => (
                                    <div
                                      key={product.id}
                                      className="relative group"
                                    >
                                      <div className="aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                                        <img
                                          src={product.image || '/placeholder-product.png'}
                                          alt={product.title}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                        <button
                                          onClick={() => toggleItemSelection(product)}
                                          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center"
                                        >
                                          <X className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                                        </button>
                                      </div>
                                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{product.title}</p>
                                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">${product.price}</p>
                                    </div>
                                  ))}
                                </div>

                                <p className="text-xs text-gray-700 dark:text-gray-400 mt-2">
                                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(0)}
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Step 1
                          </Button>
                          <Button
                            onClick={() => {
                              setCompletedSteps([...completedSteps, 1]);
                              setCurrentStep(2);
                            }}
                            className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                          >
                            {emailType === 'promotional' && !promotionalPrompt.trim() ? 'Skip to Ideas' : 'Continue to Ideas'}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : index === 2 ? (
                      /* Step 3: Generate Campaign Ideas (moved from Step 1) */
                      <div className="space-y-6">
                        {/* Two Column Selection Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column - Define Your Campaign Goals */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-5 w-5 text-sky-blue" />
                              <h4 className="font-semibold text-base">Define Your Campaign Goals</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Have specific goals in mind? Enter them below to generate tailored campaign ideas.
                            </p>
                            <Textarea
                              id="campaign-goals"
                              value={campaignGoals}
                              onChange={(e) => setCampaignGoals(e.target.value)}
                              placeholder="Example: Increase customer engagement by 25% through personalized email campaigns targeting specific customer segments based on their purchase history and preferences."
                              className="min-h-[150px] resize-none"
                            />
                            <p className="text-xs text-gray-700 dark:text-gray-400">
                              Be specific about what you want to achieve with this campaign.
                            </p>

                            {/* Generate button for custom goals */}
                            <Button
                              onClick={() => generateCampaignIdeas(true)}
                              disabled={isGeneratingIdeas || !campaignGoals.trim()}
                              className={cn(
                                "w-full",
                                campaignGoals.trim()
                                  ? "bg-gradient-to-r from-sky-blue to-royal-blue hover:from-royal-blue hover:to-sky-blue text-white"
                                  : "bg-gray-200 text-gray-600 cursor-not-allowed"
                              )}
                            >
                              {isGeneratingIdeas ? (
                                <>
                                  <MorphingLoader size="small" showThemeText={false} />
                                  <span className="ml-2">Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Target className="h-4 w-4 mr-2" />
                                  Generate Based on My Prompt
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Right Column - AI-Powered Campaign Ideas */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Wand2 className="h-5 w-5 text-vivid-violet" />
                              <h4 className="font-semibold text-base">AI-Powered Campaign Ideas</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Let AI generate creative campaign ideas based on your brand's unique profile and data.
                            </p>

                            {/* Brand Info Display */}
                            {brandSettings && (
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                  <span className="font-medium text-sm">Brand Data Loaded</span>
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    Ready
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  {brandSettings.brandName || brandSettings.name}
                                </p>
                                {brandSettings.industryCategories?.length > 0 && (
                                  <p className="text-xs text-gray-700 dark:text-gray-400 flex items-center gap-1">
                                    <ShoppingBag className="h-3 w-3" />
                                    {brandSettings.industryCategories[0]}
                                  </p>
                                )}
                              </div>
                            )}

                            {!brandSettings && !loadingBrandSettings && (
                              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                      Brand selection required
                                    </p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                                      Please select a brand from the dropdown above.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Generate AI Ideas Button */}
                            <Button
                              onClick={() => generateCampaignIdeas(false)}
                              disabled={isGeneratingIdeas || !brandSettings || loadingBrandSettings}
                              className={cn(
                                "w-full",
                                brandSettings
                                  ? "bg-gradient-to-r from-vivid-violet to-deep-purple hover:from-deep-purple hover:to-vivid-violet text-white"
                                  : "bg-gray-200 text-gray-600 cursor-not-allowed"
                              )}
                            >
                              {isGeneratingIdeas ? (
                                <>
                                  <MorphingLoader size="small" showThemeText={false} />
                                  <span className="ml-2">Generating Ideas...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-4 w-4 mr-2" />
                                  Generate AI Campaign Ideas
                                </>
                              )}
                            </Button>

                            <p className="text-xs text-center text-gray-700 dark:text-gray-400">
                              Uses Google Gemini 2.5 Flash AI with full brand context
                            </p>
                          </div>
                        </div>

                        {/* Show completion message when ideas are generated */}
                        {generatedIdeas.length > 0 && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                {generatedIdeas.length} campaign ideas generated successfully!
                              </p>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              Scroll down to review and select the ideas you want to develop.
                            </p>
                          </div>
                        )}

                        {!campaignGoals.trim() && !generatedIdeas.length && (
                          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              Choose one of the options above: either define your campaign goals manually or let AI generate ideas based on your brand data.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Default task list for other steps */
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Tasks to Complete:</h4>
                        {step.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-sky-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-sky-blue">{taskIndex + 1}</span>
                            </div>
                            <p className="text-sm text-neutral-gray dark:text-gray-300">{task}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
                </Card>
                </div>

                {/* Generated Ideas Carousel - Shows right after Step 3 */}
                {index === 2 && generatedIdeas.length > 0 && (
            <div id="generated-ideas" className="scroll-mt-24">
              <Card className="border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-900 ml-0 lg:ml-16">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-sky-blue" />
                        Generated Campaign Ideas
                      </CardTitle>
                      <CardDescription className="text-gray-700 dark:text-gray-300 mt-1">
                        Select up to 3 campaign ideas you'd like to develop (swipe to see more)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedIdeas.length > 0 && (
                        <Badge className="bg-sky-blue text-white">
                          {selectedIdeas.length}/3 selected
                        </Badge>
                      )}
                      {selectedIdeas.length === 3 && (
                        <Button
                          onClick={() => {
                            // Mark Step 3 as complete and move to Step 4
                            if (!completedSteps.includes(2)) {
                              setCompletedSteps([...completedSteps, 2]);
                            }
                            setCurrentStep(3);
                            setTimeout(() => {
                              document.getElementById('step-3')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 300);
                          }}
                          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                        >
                          Continue to Step 4
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>

            {/* Ideas Carousel */}
            <div className="relative">
              {/* Navigation Buttons */}
              <div className="absolute inset-y-0 left-0 flex items-center z-10 -ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevCarousel}
                  disabled={currentCarouselIndex === 0}
                  className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center z-10 -mr-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextCarousel}
                  disabled={currentCarouselIndex === maxCarouselIndex}
                  className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Carousel Container */}
              <div className="overflow-visible px-2 pb-2 pt-3">
                <div
                  className="flex transition-transform duration-300 ease-in-out gap-6"
                  style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
                >
                  {/* All Ideas - Grouped in sets of 2 */}
                  {Array.from({ length: Math.ceil(generatedIdeas.length / cardsPerView) }).map((_, groupIndex) => (
                    <div key={groupIndex} className="flex gap-6 min-w-full">
                      {generatedIdeas.slice(groupIndex * cardsPerView, (groupIndex + 1) * cardsPerView).map((idea) => {
                        const CategoryIcon = getCategoryIcon(idea.category);
                        const isSelected = selectedIdeas.includes(idea.id);

                        return (
                          <Card
                            key={idea.id}
                            className={cn(
                              "flex-1 cursor-pointer transition-all hover:shadow-lg relative min-h-[460px] flex flex-col overflow-visible",
                              isSelected && "ring-2 ring-sky-blue bg-sky-blue/5 border-sky-blue"
                            )}
                            onClick={() => toggleIdeaSelection(idea.id)}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="absolute -top-2 right-2 z-10">
                                <div className="bg-sky-blue text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm shadow-lg">
                                  {selectedIdeas.indexOf(idea.id) + 1}
                                </div>
                              </div>
                            )}
                            <CardContent className="p-5 flex flex-col flex-1 overflow-hidden">
                              <div className="space-y-2.5 flex flex-col flex-1">
                                {/* Header with Title and Priority */}
                                <div className="flex items-start justify-between border-b pb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2">
                                      <CategoryIcon className="h-4 w-4 text-sky-blue flex-shrink-0 mt-0.5" />
                                      <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 break-words" title={idea.title}>
                                        {idea.title}
                                      </h5>
                                    </div>
                                  </div>
                                  {idea.priorityLevel && (
                                    <Badge className={cn("text-xs px-1.5 py-0 ml-2 flex-shrink-0", getPriorityColor(idea.priorityLevel))}>
                                      {idea.priorityLevel}
                                    </Badge>
                                  )}
                                </div>

                                {/* Subject Line */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Subject Line</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                    {idea.subjectLine}
                                  </p>
                                </div>

                                {/* Hook/Key Message */}
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Hook</p>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                    {idea.mainHook || idea.hook}
                                  </p>
                                </div>

                                {/* Value Proposition - New */}
                                {(idea.valueProposition || idea.concept) && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Value</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                      {idea.valueProposition || idea.concept}
                                    </p>
                                  </div>
                                )}

                                {/* Campaign Classification */}
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      {idea.campaignType || 'Product'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      {idea.funnelStage || 'Consideration'}
                                    </Badge>
                                  </div>
                                  {idea.audienceSegment && (
                                    <div className="mt-1">
                                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                                        {idea.audienceSegment}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                {/* Goals & KPIs - New */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Goal</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{idea.goal || 'Engage'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">KPI</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{idea.kpiTarget || 'Open rate'}</p>
                                  </div>
                                </div>

                                {/* CTA */}
                                {idea.callToAction && (
                                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-sky-blue line-clamp-1">
                                      → {idea.callToAction}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.ceil(generatedIdeas.length / cardsPerView) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCarouselIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentCarouselIndex
                        ? "bg-sky-blue w-6"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIdeas.length === 0
                    ? "Click on ideas to select them (up to 3)"
                    : selectedIdeas.length < 3
                    ? `Select ${3 - selectedIdeas.length} more idea${3 - selectedIdeas.length === 1 ? '' : 's'} to continue`
                    : "Great! You've selected 3 ideas. Click 'Continue to Step 4' above to proceed."
                  }
                </p>
              </div>
            </div>
                </CardContent>
              </Card>
            </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Floating Progress Indicator */}
      <div className="fixed bottom-8 right-8 z-50">
          <Card className="shadow-2xl border-sky-blue/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-700 dark:text-gray-400">Progress</p>
                  <p className="text-lg font-bold text-sky-blue">
                    {completedSteps.length}/{steps.length}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full transition-all"
                      style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Quick Jump Buttons */}
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      const prevStep = Math.max(0, currentStep - 1);
                      if (canProceedToStep(prevStep)) {
                        setCurrentStep(prevStep);
                        document.getElementById(`step-${prevStep}`)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      const nextStep = Math.min(steps.length - 1, currentStep + 1);
                      if (canProceedToStep(nextStep)) {
                        setCurrentStep(nextStep);
                        document.getElementById(`step-${nextStep}`)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    disabled={currentStep === steps.length - 1 || !canProceedToStep(currentStep + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
