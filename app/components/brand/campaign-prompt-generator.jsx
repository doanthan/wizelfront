"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/hooks/use-toast";
import { useBrand } from "@/app/hooks/use-brand";
import {
  Sparkles,
  Copy,
  Check,
  Mail,
  Target,
  Palette,
  MessageSquare,
  Users,
  Package,
  Award,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

const CAMPAIGN_TYPES = [
  { value: "promotional", label: "Promotional Sale", icon: TrendingUp },
  { value: "product_launch", label: "Product Launch", icon: Package },
  { value: "seasonal", label: "Seasonal Campaign", icon: Award },
  { value: "educational", label: "Educational Content", icon: MessageSquare },
  { value: "reengagement", label: "Re-engagement", icon: Users },
  { value: "welcome", label: "Welcome Series", icon: Mail },
];

const BRAND_DATA_SECTIONS = [
  {
    id: "identity",
    label: "Brand Identity",
    icon: Palette,
    fields: ["brandName", "brandTagline", "missionStatement", "uniqueValueProposition"],
  },
  {
    id: "voice",
    label: "Voice & Tone",
    icon: MessageSquare,
    fields: ["brandVoice", "brandPersonality", "coreValues"],
  },
  {
    id: "audience",
    label: "Target Audience",
    icon: Target,
    fields: ["targetAudienceAge", "targetAudienceGender", "geographicFocus", "customerPainPoints", "customerAspirations"],
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    fields: ["mainProductCategories", "bestsellingProducts", "uniqueSellingPoints"],
  },
  {
    id: "trust",
    label: "Social Proof",
    icon: Award,
    fields: ["socialProof", "trustBadges"],
  },
];

export function CampaignPromptGenerator({ triggerButton }) {
  const { brand } = useBrand();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [campaignType, setCampaignType] = useState("promotional");
  const [selectedSections, setSelectedSections] = useState(["identity", "voice", "audience"]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const generatePrompt = () => {
    if (!brand) return;

    const campaignTypeData = CAMPAIGN_TYPES.find((t) => t.value === campaignType);

    // Build the prompt
    let prompt = `# Email Campaign Brief\n\n`;
    prompt += `## Campaign Type\n${campaignTypeData.label}\n\n`;
    prompt += `---\n\n`;

    // Add selected brand data
    selectedSections.forEach((sectionId) => {
      const section = BRAND_DATA_SECTIONS.find((s) => s.id === sectionId);
      if (!section) return;

      prompt += `## ${section.label}\n\n`;

      section.fields.forEach((field) => {
        const value = brand[field];
        if (!value) return;

        const fieldLabel = field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        if (Array.isArray(value)) {
          if (value.length > 0) {
            if (typeof value[0] === "string") {
              prompt += `**${fieldLabel}:** ${value.join(", ")}\n\n`;
            } else if (typeof value[0] === "object") {
              // Handle arrays of objects (like products, testimonials)
              prompt += `**${fieldLabel}:**\n`;
              value.slice(0, 3).forEach((item) => {
                const itemStr = item.name || item.title || item.text || JSON.stringify(item);
                prompt += `- ${itemStr}\n`;
              });
              prompt += "\n";
            }
          }
        } else if (typeof value === "object") {
          // Handle nested objects like socialProof
          if (value.reviewCount || value.averageRating) {
            prompt += `**${fieldLabel}:**\n`;
            if (value.reviewCount) prompt += `- Reviews: ${value.reviewCount}\n`;
            if (value.averageRating) prompt += `- Rating: ${value.averageRating}/5\n`;
            if (value.testimonials?.length) {
              prompt += `- Featured Testimonials: ${value.testimonials.length}\n`;
            }
            prompt += "\n";
          }
        } else if (typeof value === "string" && value.trim()) {
          prompt += `**${fieldLabel}:** ${value}\n\n`;
        }
      });
    });

    // Add custom instructions
    if (customInstructions.trim()) {
      prompt += `---\n\n## Additional Requirements\n\n${customInstructions}\n\n`;
    }

    // Add generation instructions
    prompt += `---\n\n## Deliverables Required\n\n`;
    prompt += `Please create a complete ${campaignTypeData.label.toLowerCase()} email campaign with:\n\n`;
    prompt += `### 1. Subject Lines\n`;
    prompt += `- Provide 3 variations (short, medium, long)\n`;
    prompt += `- Use power words and personalization\n`;
    prompt += `- A/B test ready\n\n`;
    prompt += `### 2. Preview Text\n`;
    prompt += `- Compelling 60-90 character preview\n`;
    prompt += `- Complements subject line without repeating\n\n`;
    prompt += `### 3. Email Body\n`;
    prompt += `- Hero section with headline\n`;
    prompt += `- Body copy (200-300 words)\n`;
    prompt += `- Key benefits or features (bullet points)\n`;
    prompt += `- Social proof element\n`;
    prompt += `- Clear value proposition\n\n`;
    prompt += `### 4. Call-to-Action\n`;
    prompt += `- Primary CTA button text\n`;
    prompt += `- Secondary CTA (if applicable)\n`;
    prompt += `- Urgency or scarcity element\n\n`;
    prompt += `### 5. Strategy & Timing\n`;
    prompt += `- Best day/time to send\n`;
    prompt += `- Target audience segment\n`;
    prompt += `- Success metrics to track\n\n`;
    prompt += `### Design & Style Guidelines\n`;
    prompt += `- Match brand voice: ${brand.brandVoice?.join(", ") || "professional"}\n`;
    prompt += `- Tone: ${brand.brandPersonality?.join(", ") || "authentic"}\n`;
    prompt += `- Address pain points: ${brand.customerPainPoints?.join(", ") || "general customer needs"}\n`;
    prompt += `- Highlight aspirations: ${brand.customerAspirations?.join(", ") || "customer goals"}\n\n`;
    prompt += `### Email Best Practices\n`;
    prompt += `✓ Mobile-first design\n`;
    prompt += `✓ Clear hierarchy\n`;
    prompt += `✓ Scannable content\n`;
    prompt += `✓ Single primary CTA\n`;
    prompt += `✓ Personalization opportunities\n`;
    prompt += `✓ Brand consistency\n`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Campaign prompt copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!generatedPrompt) {
      generatePrompt();
    }
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={handleOpen}>{triggerButton}</div>
      ) : (
        <Button
          onClick={handleOpen}
          className="fixed bottom-8 right-8 h-14 px-6 rounded-full shadow-lg bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white z-50"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate Campaign Prompt
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-vivid-violet" />
              AI Campaign Prompt Generator
            </DialogTitle>
            <DialogDescription className="text-gray-800 dark:text-gray-400">
              Generate a detailed AI prompt for creating email campaigns based on your brand data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Campaign Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {CAMPAIGN_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Data Sections */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Include Brand Data
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {BRAND_DATA_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isSelected = selectedSections.includes(section.id);
                  return (
                    <div
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-sky-blue bg-sky-tint/30 dark:bg-sky-blue/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSection(section.id)}
                        className="pointer-events-none"
                      />
                      <Icon className={`h-5 w-5 ${isSelected ? "text-sky-blue" : "text-gray-600 dark:text-gray-400"}`} />
                      <span className={`text-sm font-medium ${isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-400"}`}>
                        {section.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Additional Instructions (Optional)
              </Label>
              <Textarea
                placeholder="E.g., Focus on sustainability, include discount code, mention free shipping..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[100px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generatePrompt}
              className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Regenerate Prompt
            </Button>

            {/* Generated Prompt Display */}
            {generatedPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Generated Prompt
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {generatedPrompt.length} characters
                  </Badge>
                </div>
                <div className="relative">
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    className="min-h-[300px] font-mono text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={copyToClipboard}
              disabled={!generatedPrompt}
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
