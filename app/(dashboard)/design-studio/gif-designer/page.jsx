"use client";

import { useState } from "react";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import Link from "next/link";
import {
  Image as ImageIcon,
  ArrowLeft,
  Download,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Repeat,
  Type,
  Sparkles,
  Layers as LayersIcon,
  Upload
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Slider } from "@/app/components/ui/slider";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

export default function GIFDesigner() {
  const [duration, setDuration] = useState(3);
  const [loopCount, setLoopCount] = useState("infinite");
  const [isPlaying, setIsPlaying] = useState(false);

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
            <div className="w-12 h-12 bg-gradient-to-br from-vivid-violet to-deep-purple rounded-xl flex items-center justify-center shadow-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GIF Designer</h1>
              <p className="text-gray-600 dark:text-gray-400">Create engaging animated GIFs for email campaigns and social media</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Badge variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-vivid-violet/10 text-vivid-violet border-vivid-violet/20">
              Animation Tool
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <LayersIcon className="h-5 w-5 text-vivid-violet" />
                  Animation Preview
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Preview your animated GIF in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Canvas Preview */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                <div className="aspect-video">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-vivid-violet/20 to-deep-purple/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <ImageIcon className="h-10 w-10 text-vivid-violet" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Animation Canvas
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm">
                          Upload images to create your animated GIF
                        </p>
                      </div>
                      <Button className="bg-gradient-to-r from-vivid-violet to-deep-purple hover:from-deep-purple hover:to-vivid-violet text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Images
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frames Timeline */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">Frames</Label>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Frame
                  </Button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[1, 2, 3].map((frame) => (
                    <div
                      key={frame}
                      className="relative flex-shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:border-vivid-violet dark:hover:border-vivid-violet transition-colors cursor-pointer group"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="absolute top-1 left-1 bg-vivid-violet text-white text-xs px-1.5 py-0.5 rounded">
                        {frame}
                      </div>
                      <button className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-vivid-violet dark:hover:border-vivid-violet transition-colors">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-gradient-to-r from-vivid-violet to-deep-purple hover:from-deep-purple hover:to-vivid-violet text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export GIF
                </Button>
                <Button variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Preview in Browser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Animation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-vivid-violet" />
                  Animation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Animation Type</Label>
                  <Select defaultValue="fade">
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade In/Out</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                      <SelectItem value="rotate">Rotate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Duration: {duration}s</Label>
                  <Slider
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    min={1}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Frame Rate</Label>
                  <Select defaultValue="10">
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 FPS</SelectItem>
                      <SelectItem value="10">10 FPS</SelectItem>
                      <SelectItem value="15">15 FPS</SelectItem>
                      <SelectItem value="24">24 FPS</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Loop
                  </Label>
                  <Select value={loopCount} onValueChange={setLoopCount}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infinite">Infinite</SelectItem>
                      <SelectItem value="1">Once</SelectItem>
                      <SelectItem value="3">3 times</SelectItem>
                      <SelectItem value="5">5 times</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Text Overlay */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4 text-vivid-violet" />
                  Text Overlay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="overlay-text" className="text-gray-900 dark:text-white">Text</Label>
                  <Input
                    id="overlay-text"
                    type="text"
                    placeholder="Add text to your GIF..."
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Text Animation</Label>
                  <Select defaultValue="none">
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="typewriter">Typewriter</SelectItem>
                      <SelectItem value="fade">Fade In</SelectItem>
                      <SelectItem value="slide">Slide In</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Text Layer
                </Button>
              </CardContent>
            </Card>

            {/* Export Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-vivid-violet" />
                  Export Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Quality</Label>
                  <Select defaultValue="high">
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Smaller file)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Best quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Dimensions</Label>
                  <Select defaultValue="600x400">
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300x200">300x200px (Small)</SelectItem>
                      <SelectItem value="600x400">600x400px (Medium)</SelectItem>
                      <SelectItem value="800x600">800x600px (Large)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-vivid-violet" />
                  AI Enhancements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Animation
                </Button>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                  Coming soon: AI-powered animation optimization
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Templates Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Animation Templates</CardTitle>
            <CardDescription>Start with a pre-made animation style</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { name: "Product Showcase", desc: "Rotating product display" },
                { name: "Countdown Timer", desc: "Animated countdown" },
                { name: "Text Reveal", desc: "Sequential text animation" },
                { name: "Image Carousel", desc: "Smooth image transitions" },
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="group cursor-pointer border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-vivid-violet dark:hover:border-vivid-violet transition-colors"
                >
                  <div className="aspect-video bg-gradient-to-br from-vivid-violet/10 to-deep-purple/10 p-6 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-vivid-violet mx-auto animate-pulse" />
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{template.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">GIF Design Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-vivid-violet flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Keep it Short</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    2-3 seconds is ideal for email GIFs to maintain engagement
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Download className="h-5 w-5 text-vivid-violet flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">File Size</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Keep GIFs under 1MB for fast loading in emails
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Repeat className="h-5 w-5 text-vivid-violet flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Loop Wisely</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use infinite loops for subtle animations, limited loops for emphasis
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
