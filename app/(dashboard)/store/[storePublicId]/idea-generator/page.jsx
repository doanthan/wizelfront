"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
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
  Loader2,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StoreIdeaGeneratorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const [storeId, setStoreId] = useState(null);
  const brandId = searchParams.get('brand') || 'default';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [brands, setBrands] = useState([
    { id: 'default', name: 'Default Brand' },
    { id: 'secondary', name: 'Secondary Brand' }
  ]);
  const [selectedBrand, setSelectedBrand] = useState(brandId);
  
  // Use useEffect to handle async params
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setStoreId(resolvedParams.storePublicId);
    }
    getParams();
  }, [params]);
  
  // Step-by-step campaign creation steps
  const steps = [
    {
      id: 'define-goals',
      title: "Define Campaign Goals",
      description: "Set clear objectives for your email campaign",
      tasks: [
        "Identify primary KPIs (sales, engagement, awareness)",
        "Set measurable targets (e.g., 20% open rate, 5% conversion)",
        "Define success metrics and tracking methods"
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

  const handleStepComplete = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
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
        <Loader2 className="h-8 w-8 animate-spin text-sky-blue" />
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

      {/* Main Content - Steps Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps List - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index);
            
            return (
              <Card 
                key={step.id}
                className={cn(
                  "transition-all cursor-pointer",
                  isActive && "ring-2 ring-sky-blue shadow-lg",
                  isCompleted && "bg-green-50 dark:bg-green-900/20"
                )}
                onClick={() => setCurrentStep(index)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      isActive 
                        ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
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
                      <CardDescription>{step.description}</CardDescription>
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
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Campaign Progress</CardTitle>
              <CardDescription>
                {completedSteps.length} of {steps.length} steps completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full transition-all"
                    style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                  />
                </div>

                {/* Quick Navigation */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const isCompleted = completedSteps.includes(index);
                      const isActive = index === currentStep;
                      
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all",
                            isActive 
                              ? "bg-gradient-to-r from-sky-blue/10 to-vivid-violet/10 border-l-4 border-sky-blue"
                              : isCompleted
                              ? "bg-green-50 dark:bg-green-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                          onClick={() => setCurrentStep(index)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                              isActive 
                                ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                                : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                            )}>
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                isActive ? "text-sky-blue" : "text-slate-gray dark:text-gray-300"
                              )}>
                                {step.title}
                              </p>
                              <p className="text-xs text-neutral-gray dark:text-gray-500">
                                {step.tasks.length} tasks
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Quick Actions */}
                {completedSteps.length === steps.length && (
                  <div className="pt-4 border-t">
                    <Button
                      className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                      onClick={() => router.push(`/store/${storeId}/email-builder`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Create Email Campaign
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}