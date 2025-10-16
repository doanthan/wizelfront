"use client";

import Link from "next/link";
import { Palette, MousePointer2, Image as ImageIcon, Sparkles, ArrowRight, Instagram, Mail, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export default function DesignStudio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Design Studio</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create stunning visual content for your campaigns</p>
            </div>
          </div>
          <Badge variant="outline" className="mt-2">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Design Tools
          </Badge>
        </div>

        {/* Design Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* CTA Designer Card */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-sky-blue dark:hover:border-sky-blue">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-royal-blue rounded-xl flex items-center justify-center shadow-md">
                  <MousePointer2 className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-sky-blue/10 text-sky-blue border-sky-blue/20 text-xs">
                  Image Creator
                </Badge>
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">CTA Designer</CardTitle>
              <CardDescription className="text-sm">
                Design eye-catching CTA images for Instagram ads and email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Instagram className="h-4 w-4 text-sky-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Instagram Ad CTAs</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Create click-worthy visuals for your Instagram campaigns</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-sky-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Email CTA Images</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Design compelling CTA images for email marketing</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/design-studio/cta-designer">
                  <Button className="w-full bg-gradient-to-r from-sky-blue to-royal-blue hover:from-royal-blue hover:to-sky-blue text-white text-sm py-2">
                    Open CTA Designer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs py-0.5 px-2">Custom Text</Badge>
                <Badge variant="outline" className="text-xs py-0.5 px-2">Background Images</Badge>
                <Badge variant="outline" className="text-xs py-0.5 px-2">Brand Colors</Badge>
              </div>
            </CardContent>
          </Card>

          {/* GIF Designer Card */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-vivid-violet dark:hover:border-vivid-violet">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-vivid-violet to-deep-purple rounded-xl flex items-center justify-center shadow-md">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-vivid-violet/10 text-vivid-violet border-vivid-violet/20 text-xs">
                  Animation Tool
                </Badge>
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">GIF Designer</CardTitle>
              <CardDescription className="text-sm">
                Create engaging animated GIFs for email campaigns and social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-vivid-violet mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Text Animations</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Add dynamic text effects and transitions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ImageIcon className="h-4 w-4 text-vivid-violet mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Image Sequences</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Turn multiple images into smooth animations</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/design-studio/gif-designer">
                  <Button className="w-full bg-gradient-to-r from-vivid-violet to-deep-purple hover:from-deep-purple hover:to-vivid-violet text-white text-sm py-2">
                    Open GIF Designer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs py-0.5 px-2">Frame Control</Badge>
                <Badge variant="outline" className="text-xs py-0.5 px-2">Effects</Badge>
                <Badge variant="outline" className="text-xs py-0.5 px-2">Export Options</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-blue/10 to-sky-blue/20 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 text-sky-blue" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">AI-Powered Suggestions</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get intelligent design recommendations based on your brand
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 bg-gradient-to-br from-vivid-violet/10 to-vivid-violet/20 rounded-lg flex items-center justify-center mx-auto">
                  <Palette className="h-5 w-5 text-vivid-violet" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Brand Consistency</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Automatically match your brand colors and style guidelines
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 bg-gradient-to-br from-royal-blue/10 to-royal-blue/20 rounded-lg flex items-center justify-center mx-auto">
                  <Download className="h-5 w-5 text-royal-blue" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Export Anywhere</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Download as HTML, CSS, or ready-to-use email components
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
