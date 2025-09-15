"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Map, Database, ArrowRight, Settings } from "lucide-react";

export default function SuperuserMapPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white mb-2">
          Data Mapping Console
        </h1>
        <p className="text-neutral-gray dark:text-gray-400">
          Advanced data mapping and connection management
        </p>
      </div>

      {/* Coming Soon Content */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Data Mapping Console</CardTitle>
          <CardDescription className="text-base">
            Advanced tools for managing data connections and mappings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Data Sources</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Connect and manage multiple data sources
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <ArrowRight className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">Field Mapping</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Map fields between different systems
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium">Transformations</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Apply data transformations and rules
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Map className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">Visual Mapping</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Interactive visual mapping interface
              </p>
            </div>
          </div>

          <div className="text-center pt-6 border-t">
            <p className="text-sm text-neutral-gray mb-4">
              This feature is currently in development. Check back soon for updates!
            </p>
            <Button variant="outline">
              Learn More About Data Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}