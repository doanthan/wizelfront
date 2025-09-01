"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  GradientCard,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ModernTable,
} from "@/app/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  GradientTooltip,
} from "@/app/components/ui/tooltip";
import { useToast } from "@/app/hooks/use-toast";
import { Toaster } from "@/app/components/ui/toaster";
import {
  ChartContainer,
  ChartHeader,
  ChartTitle,
  ChartDescription,
  ChartContent,
  ChartLegend,
  chartColors,
} from "@/app/components/ui/chart";

export default function ShowcasePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("buttons");

  const mockTableData = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "active", revenue: "$5,234" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "pending", revenue: "$3,721" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "inactive", revenue: "$8,943" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", status: "active", revenue: "$12,383" },
  ];

  const mockChartData = [
    { label: "User Growth", color: chartColors.primary },
    { label: "Revenue", color: chartColors.growth },
    { label: "AI Insights", color: chartColors.secondary },
    { label: "Churn Rate", color: chartColors.drop },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white p-8">
        <Toaster />
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent mb-4">
            UI Component Showcase
          </h1>
          <p className="text-slate-gray text-lg">
            Modern components built with Radix UI and your custom color palette
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8 border-b border-neutral-gray">
          {["buttons", "cards", "badges", "tables", "toasts", "tooltips", "charts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-sky-blue text-sky-blue"
                  : "text-slate-gray hover:text-sky-blue"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Buttons Section */}
          {activeTab === "buttons" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Buttons</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                  <CardDescription>Different button styles for various actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="gradient">Gradient</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">🚀</Button>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button disabled>Disabled</Button>
                    <Button variant="outline" disabled>Disabled Outline</Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Cards Section */}
          {activeTab === "cards" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Cards</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Standard Card</CardTitle>
                    <CardDescription>A basic card with header and content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-gray">
                      This is a standard card component with subtle shadow and border styling.
                      Perfect for displaying content sections.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="mr-2">Cancel</Button>
                    <Button>Confirm</Button>
                  </CardFooter>
                </Card>

                <GradientCard>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-gray mb-2">Gradient Card</h3>
                    <p className="text-neutral-gray mb-4">
                      This card features a gradient border effect using your brand colors.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="gradient">Premium</Badge>
                      <Badge variant="subtle">AI Powered</Badge>
                    </div>
                  </div>
                </GradientCard>

                <Card className="border-sky-blue/20 bg-sky-tint/30">
                  <CardHeader>
                    <CardTitle>Highlighted Card</CardTitle>
                    <CardDescription>Card with custom background</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-gray">
                      Cards can be customized with different background colors and borders.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>Hover to see the effect</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-gray">
                      This card has enhanced hover effects for interactive elements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* Badges Section */}
          {activeTab === "badges" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Badges</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Badge Variants</CardTitle>
                  <CardDescription>Different badge styles for status and labels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="gradient">Gradient</Badge>
                    <Badge variant="subtle">Subtle</Badge>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-slate-gray mb-3">Use Cases</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-gray">User Status:</span>
                        <Badge variant="success">Active</Badge>
                        <Badge variant="warning">Pending</Badge>
                        <Badge variant="destructive">Suspended</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-gray">Features:</span>
                        <Badge variant="gradient">Pro</Badge>
                        <Badge variant="secondary">AI Enhanced</Badge>
                        <Badge variant="subtle">Beta</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Tables Section */}
          {activeTab === "tables" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Tables</h2>
              
              <ModernTable>
                <TableCaption>A list of recent users and their revenue</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTableData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "active"
                              ? "success"
                              : row.status === "pending"
                              ? "warning"
                              : "outline"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ModernTable>
            </section>
          )}

          {/* Toasts Section */}
          {activeTab === "toasts" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Toast Notifications</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Toast Examples</CardTitle>
                  <CardDescription>Click buttons to trigger different toast notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        toast({
                          title: "Default Toast",
                          description: "This is a default toast notification.",
                        });
                      }}
                    >
                      Default Toast
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => {
                        toast({
                          variant: "destructive",
                          title: "Error!",
                          description: "Something went wrong. Please try again.",
                        });
                      }}
                    >
                      Error Toast
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={() => {
                        toast({
                          variant: "success",
                          title: "Success!",
                          description: "Your changes have been saved.",
                        });
                      }}
                    >
                      Success Toast
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          variant: "info",
                          title: "Info",
                          description: "New features are now available.",
                        });
                      }}
                    >
                      Info Toast
                    </Button>
                    
                    <Button
                      variant="gradient"
                      onClick={() => {
                        toast({
                          variant: "gradient",
                          title: "AI Insights Ready",
                          description: "Your AI analysis has been completed.",
                        });
                      }}
                    >
                      Gradient Toast
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Tooltips Section */}
          {activeTab === "tooltips" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Tooltips</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tooltip Examples</CardTitle>
                  <CardDescription>Hover over elements to see tooltips</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">Standard Tooltip</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a standard tooltip</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="gradient">Gradient Tooltip</Button>
                      </TooltipTrigger>
                      <GradientTooltip>
                        <p>This tooltip has a gradient background</p>
                      </GradientTooltip>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary">Hover me</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tooltips work with any component</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon">📊</Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>View Analytics</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="outline">⚙️</Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Settings</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">❓</Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Get Help</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Charts Section */}
          {activeTab === "charts" && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-gray mb-6">Charts</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer>
                  <ChartHeader>
                    <ChartTitle>User Growth</ChartTitle>
                    <Badge variant="success">+12.5%</Badge>
                  </ChartHeader>
                  <ChartDescription>Monthly active users over time</ChartDescription>
                  <ChartContent>
                    <div className="h-48 bg-gradient-to-r from-sky-blue/10 to-vivid-violet/10 rounded-lg flex items-center justify-center">
                      <p className="text-slate-gray">Chart visualization area</p>
                    </div>
                  </ChartContent>
                  <ChartLegend items={mockChartData.slice(0, 2)} />
                </ChartContainer>

                <ChartContainer>
                  <ChartHeader>
                    <ChartTitle>AI Insights</ChartTitle>
                    <Badge variant="gradient">AI Powered</Badge>
                  </ChartHeader>
                  <ChartDescription>Performance metrics analysis</ChartDescription>
                  <ChartContent>
                    <div className="h-48 bg-gradient-to-br from-[#8B5CF6]/10 to-deep-purple/10 rounded-lg flex items-center justify-center">
                      <p className="text-slate-gray">Chart visualization area</p>
                    </div>
                  </ChartContent>
                  <ChartLegend items={mockChartData} />
                </ChartContainer>
              </div>
            </section>
          )}
        </div>

        {/* Color Palette Reference */}
        <div className="mt-16 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Your custom color scheme reference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="w-full h-20 bg-sky-blue rounded-lg mb-2"></div>
                  <p className="text-xs font-medium">Sky Blue</p>
                  <p className="text-xs text-neutral-gray">#60A5FA</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-royal-blue rounded-lg mb-2"></div>
                  <p className="text-xs font-medium">Royal Blue</p>
                  <p className="text-xs text-neutral-gray">#2563EB</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-vivid-violet rounded-lg mb-2"></div>
                  <p className="text-xs font-medium">Vivid Violet</p>
                  <p className="text-xs text-neutral-gray">#8B5CF6</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-deep-purple rounded-lg mb-2"></div>
                  <p className="text-xs font-medium">Deep Purple</p>
                  <p className="text-xs text-neutral-gray">#7C3AED</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-gradient-to-r from-sky-blue to-vivid-violet rounded-lg mb-2"></div>
                  <p className="text-xs font-medium">Gradient</p>
                  <p className="text-xs text-neutral-gray">Blue→Violet</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-cool-gray rounded-lg mb-2 border"></div>
                  <p className="text-xs font-medium">Cool Gray</p>
                  <p className="text-xs text-neutral-gray">#F1F5F9</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}