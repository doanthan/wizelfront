"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { BrandSidebar } from "@/app/components/brand/brand-sidebar";
import MorphingLoader from "@/app/components/ui/loading";

// Import all section components
import BrandIdentitySection from "./sections/BrandIdentitySection";
import BrandVisualsSection from "./sections/BrandVisualsSection";
import BrandVoiceToneSection from "./sections/BrandVoiceToneSection";
import BrandAudienceSection from "./sections/BrandAudienceSection";
import BrandProductsSection from "./sections/BrandProductsSection";
import BrandTrustSection from "./sections/BrandTrustSection";
import BrandCompetitorsSection from "./sections/BrandCompetitorsSection";
import BrandContentStrategySection from "./sections/BrandContentStrategySection";
import BrandSocialMediaSection from "./sections/BrandSocialMediaSection";

export default function BrandPage() {
  const { isLoading } = useBrand();
  const [activeSection, setActiveSection] = useState("visual-identity");

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Observe sections for active highlighting
  useEffect(() => {
    if (isLoading) return;

    const sectionIds = [
      "visual-identity",
      "brand-overview",
      "voice-tone",
      "target-audience",
      "products-offerings",
      "trust-social-proof",
      "competitors",
      "content-strategy",
      "social-media"
    ];

    // Create a more sensitive observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio
        let maxRatio = 0;
        let activeEntry = null;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeEntry = entry;
          }
        });

        // Update active section if we have a winner
        if (activeEntry && activeEntry.isIntersecting) {
          setActiveSection(activeEntry.target.id);
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: "-120px 0px -60% 0px"
      }
    );

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Also track scroll position for manual updates
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          const elementTop = top + window.scrollY;
          const elementBottom = bottom + window.scrollY;

          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950 z-50" style={{ marginLeft: 0, marginRight: 0, left: 0, right: 0 }}>
        <MorphingLoader
          size="large"
          showText={true}
          customThemeTexts={[
            "Loading brand identity...",
            "Gathering visual assets...",
            "Analyzing brand voice...",
            "Compiling audience insights...",
            "Fetching social connections...",
            "Almost there..."
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-start">
      <aside className="w-60 flex-shrink-0 sticky top-24 self-start">
        <BrandSidebar
          onSectionClick={scrollToSection}
          activeSection={activeSection}
        />
      </aside>

      <div className="flex-1 space-y-8 min-w-0">
        <div id="visual-identity" className="scroll-mt-24">
          <BrandVisualsSection />
        </div>

        <div id="brand-overview" className="scroll-mt-24">
          <BrandIdentitySection />
        </div>

        <div id="voice-tone" className="scroll-mt-24">
          <BrandVoiceToneSection />
        </div>

        <div id="target-audience" className="scroll-mt-24">
          <BrandAudienceSection />
        </div>

        <div id="products-offerings" className="scroll-mt-24">
          <BrandProductsSection />
        </div>

        <div id="trust-social-proof" className="scroll-mt-24">
          <BrandTrustSection />
        </div>

        <div id="competitors" className="scroll-mt-24">
          <BrandCompetitorsSection />
        </div>

        <div id="content-strategy" className="scroll-mt-24">
          <BrandContentStrategySection />
        </div>

        <div id="social-media" className="scroll-mt-24">
          <BrandSocialMediaSection />
        </div>
      </div>
    </div>
  );
}
