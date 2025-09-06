"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, Save, Sparkles, Users, Megaphone, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandNavigation({ storePublicId, brandSlug, brandName, brandTagline, hasChanges, onSave, isSaving }) {
  const pathname = usePathname();
  
  const navigation = [
    {
      name: "Brand Identity",
      href: `/store/${storePublicId}/brand/${brandSlug}/identity`,
      icon: <Sparkles className="h-3.5 w-3.5" />,
      current: pathname.includes('/identity')
    },
    {
      name: "Audience & Products", 
      href: `/store/${storePublicId}/brand/${brandSlug}/audience`,
      icon: <Users className="h-3.5 w-3.5" />,
      current: pathname.includes('/audience')
    },
    {
      name: "Marketing & Social",
      href: `/store/${storePublicId}/brand/${brandSlug}/marketing`, 
      icon: <Megaphone className="h-3.5 w-3.5" />,
      current: pathname.includes('/marketing')
    },
    {
      name: "Visual Design",
      href: `/store/${storePublicId}/brand/${brandSlug}/visuals`,
      icon: <div className="h-3.5 w-3.5 bg-gradient-to-r from-sky-blue to-vivid-violet rounded-sm"></div>,
      current: pathname.includes('/visuals')
    },
    {
      name: "Analytics & Competition", 
      href: `/store/${storePublicId}/brand/${brandSlug}/analytics`,
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      current: pathname.includes('/analytics')
    },
    {
      name: "Customer Insights",
      href: `/store/${storePublicId}/brand/${brandSlug}/insights`,
      icon: <div className="h-3.5 w-3.5 bg-gradient-to-r from-deep-purple to-vivid-violet rounded-full"></div>,
      current: pathname.includes('/insights')
    }
  ];

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900/95 backdrop-blur-sm border-b dark:border-gray-700 shadow-sm dark:shadow-gray-900/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={`/store/${storePublicId}/brands`}
              className="p-2 hover:bg-sky-tint/20 dark:hover:bg-sky-blue/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-gray dark:text-white">{brandName}</h1>
              <p className="text-sm text-neutral-gray dark:text-gray-400">{brandTagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="warning" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50">
                Unsaved changes
              </Badge>
            )}
            <Button
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className="bg-sky-blue hover:bg-royal-blue text-white gap-2"
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
        </div>
        
        {/* Navigation Tabs */}
        <div className="mt-4 -mb-[1px]">
          <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative rounded-none border-b-2 px-3 py-1.5 text-sm flex items-center gap-1.5 transition-all duration-200",
                  item.current 
                    ? "border-sky-blue text-sky-blue bg-sky-blue/5 dark:bg-sky-blue/10 -mb-[1px]" 
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}