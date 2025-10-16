"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MousePointer2,
  ArrowLeft,
  Instagram,
  Mail,
  Download,
  Copy,
  Image as ImageIcon,
  Type,
  Palette,
  Layout,
  AlignCenter,
  Bold,
  Italic,
  Sparkles
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Slider } from "@/app/components/ui/slider";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

export default function CTADesigner() {
  const [ctaText, setCtaText] = useState("Shop Now");
  const [fontSize, setFontSize] = useState(48);
  const [designMode, setDesignMode] = useState("instagram");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link href="/design-studio">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Design Studio
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-blue to-royal-blue rounded-xl flex items-center justify-center shadow-lg">
              <MousePointer2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CTA Designer</h1>
              <p className="text-gray-600 dark:text-gray-400">Create stunning CTA images for Instagram ads and email campaigns</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Badge variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-sky-blue/10 text-sky-blue border-sky-blue/20">
              Image Creator
            </Badge>
          </div>
        </div>

        {/* Design Mode Selector */}
        <Tabs value={designMode} onValueChange={setDesignMode} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram Ad
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email CTA
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-sky-blue" />
                  Canvas
                </span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {designMode === "instagram" ? "1080x1080px" : "600x400px"}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                {designMode === "instagram"
                  ? "Design your Instagram ad CTA image"
                  : "Create your email CTA image"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Canvas Preview */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                {/* Aspect ratio container */}
                <div className={designMode === "instagram" ? "aspect-square" : "aspect-[3/2]"}>
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-sky-blue/20 to-royal-blue/20 rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="h-10 w-10 text-sky-blue" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Canvas Preview
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm">
                          Upload a background image and add text to create your CTA
                        </p>
                      </div>
                      <Button className="bg-gradient-to-r from-sky-blue to-royal-blue hover:from-royal-blue hover:to-sky-blue text-white">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Background
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-gradient-to-r from-sky-blue to-royal-blue hover:from-royal-blue hover:to-sky-blue text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
                <Button variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Text Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4 text-sky-blue" />
                  Text Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cta-text" className="text-gray-900 dark:text-white">CTA Text</Label>
                  <Input
                    id="cta-text"
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Enter your CTA text"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={24}
                    max={96}
                    step={2}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Font Weight</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Regular
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Bold className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Alignment</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Left
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Right
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-sky-blue" />
                  Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Text Color</Label>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-lg bg-white border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                    <button className="w-10 h-10 rounded-lg bg-gray-900 border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                    <button className="w-10 h-10 rounded-lg bg-sky-blue border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                    <button className="w-10 h-10 rounded-lg bg-vivid-violet border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                    <button className="w-10 h-10 rounded-lg bg-royal-blue border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Background Overlay</Label>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-lg bg-black/50 border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                    <button className="w-10 h-10 rounded-lg bg-white/50 border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                    <button className="w-10 h-10 rounded-lg bg-sky-blue/50 border-2 border-gray-300 dark:border-gray-600 hover:border-sky-blue transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-blue" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Suggestions
                </Button>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                  Coming soon: AI-powered design recommendations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Templates Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Pre-designed Templates</CardTitle>
            <CardDescription>Start with a professional template and customize it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { name: "Bold Gradient", gradient: "from-sky-blue to-royal-blue" },
                { name: "Purple Power", gradient: "from-vivid-violet to-deep-purple" },
                { name: "Clean White", gradient: "from-gray-100 to-gray-200" },
                { name: "Dark Mode", gradient: "from-gray-800 to-gray-900" },
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="group cursor-pointer border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-sky-blue dark:hover:border-sky-blue transition-colors"
                >
                  <div className={`aspect-square bg-gradient-to-br ${template.gradient} p-6 flex items-center justify-center`}>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white drop-shadow-lg">Shop Now</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Design Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <Instagram className="h-5 w-5 text-sky-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Instagram Ads</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use 1:1 aspect ratio (1080x1080px) for best results in Instagram feed
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-sky-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Email CTAs</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Keep file size under 200KB and use web-safe formats (PNG/JPG)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Type className="h-5 w-5 text-sky-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Text Contrast</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ensure high contrast between text and background for readability
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
