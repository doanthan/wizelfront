"use client";

import MorphingLoader from "@/app/components/ui/loading";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <MorphingLoader size="large" showText={true} text="Loading..." />
    </div>
  );
}