"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Sparkles, Users, Megaphone, Palette, MessageCircle, Package, Shield, Target, Save, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/app/hooks/use-brand";

export function BrandSidebar({ onSectionClick, activeSection }) {
  const { hasChanges, handleSave, isSaving } = useBrand();
  const [stickyOffset, setStickyOffset] = useState(120);
  const cardMaxHeight = `calc(100vh - ${stickyOffset + 16}px)`;

  const navigation = [
    {
      name: "Visual Identity",
      sectionId: "visual-identity",
      icon: Palette,
      description: "Colors, logos & design",
    },
    {
      name: "Brand Overview",
      sectionId: "brand-overview",
      icon: Sparkles,
      description: "Core identity & values",
    },
    {
      name: "Voice & Tone",
      sectionId: "voice-tone",
      icon: MessageCircle,
      description: "Communication style",
    },
    {
      name: "Target Audience",
      sectionId: "target-audience",
      icon: Users,
      description: "Customer personas",
    },
    {
      name: "Products",
      sectionId: "products-offerings",
      icon: Package,
      description: "Offerings & features",
    },
    {
      name: "Trust & Proof",
      sectionId: "trust-social-proof",
      icon: Shield,
      description: "Reviews & testimonials",
    },
    {
      name: "Competitors",
      sectionId: "competitors",
      icon: Target,
      description: "Competitive analysis",
    },
    {
      name: "Content Strategy",
      sectionId: "content-strategy",
      icon: BookOpen,
      description: "Themes & pillars",
    },
    {
      name: "Social Media",
      sectionId: "social-media",
      icon: Megaphone,
      description: "Social presence",
    }
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const selector = "[data-brand-navigation]";
    let resizeObserver;

    const updateOffset = () => {
      const headerEl = document.querySelector(selector);
      const headerHeight = headerEl?.getBoundingClientRect().height ?? 0;
      const computedOffset = headerHeight > 0 ? headerHeight + 24 : 120;
      setStickyOffset(computedOffset);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);

    const headerEl = document.querySelector(selector);
    if (headerEl && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(updateOffset);
      resizeObserver.observe(headerEl);
    }

    return () => {
      window.removeEventListener("resize", updateOffset);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <Card
      className="overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
      style={{
        maxHeight: cardMaxHeight
      }}
    >
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-lg text-gray-900 dark:text-white">Brand Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <nav className="space-y-0.5 pb-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.sectionId;
              return (
                <button
                  key={item.name}
                  onClick={() => onSectionClick && onSectionClick(item.sectionId)}
                  className={cn(
                    "w-full flex items-start gap-3 py-2.5 transition-all group text-left relative",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    isActive
                      ? "bg-gradient-to-r from-sky-50 to-transparent dark:from-sky-900/30 dark:to-transparent pl-3.5 pr-4"
                      : "pl-4 pr-4"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-600 dark:bg-sky-500 rounded-r-full" />
                  )}

                  <Icon className={cn(
                    "h-5 w-5 mt-0.5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium transition-colors",
                      isActive
                        ? "text-sky-600 dark:text-sky-400 font-semibold"
                        : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                    )}>
                      {item.name}
                    </p>
                    <p className={cn(
                      "text-xs mt-0.5 transition-colors",
                      isActive
                        ? "text-sky-500/80 dark:text-sky-400/70"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Save Button */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            {hasChanges && (
              <Badge variant="warning" className="mb-3 w-full justify-center bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50">
                Unsaved changes
              </Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="w-full bg-sky-blue hover:bg-royal-blue text-white gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
    </Card>
  );
}
