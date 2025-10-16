"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function BrandAnalyticsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Analytics & Competition</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Market analysis and competitive positioning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-900 dark:text-gray-300">
          Analytics and competition content will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}
