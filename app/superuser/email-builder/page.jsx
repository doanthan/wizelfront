"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Mail, Palette, Code, Layout, Zap, Users } from "lucide-react";

export default function SuperuserEmailBuilderPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white mb-2">
          Email Template Builder
        </h1>
        <p className="text-neutral-gray dark:text-gray-400">
          Create and manage global email templates for all users
        </p>
      </div>

      {/* Coming Soon Content */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Global Email Builder</CardTitle>
          <CardDescription className="text-base">
            Advanced email template creation and management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Layout className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Drag & Drop Builder</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Visual email editor with drag-and-drop components
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">Brand Templates</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Pre-designed templates for different brands
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Code className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium">Custom HTML</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Full HTML editing capabilities for advanced users
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">Global Distribution</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Distribute templates to all users and stores
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">A/B Testing</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Built-in A/B testing for template optimization
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-red-500" />
                <h3 className="font-medium">Preview & Test</h3>
              </div>
              <p className="text-sm text-neutral-gray">
                Preview templates across different devices
              </p>
            </div>
          </div>

          <div className="text-center pt-6 border-t">
            <p className="text-sm text-neutral-gray mb-4">
              Advanced email builder coming soon with powerful template management features!
            </p>
            <Button variant="outline">
              View Current Email Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}