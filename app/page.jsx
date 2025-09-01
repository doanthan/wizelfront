"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Zap, Star, Check, TrendingUp, Sparkles, BarChart3, Brain, Rocket, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-tint via-white to-lilac-mist/30" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-blue/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-vivid-violet/20 rounded-full filter blur-3xl animate-pulse delay-700" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badges */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <Badge variant="gradient" className="px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered SaaS
              </Badge>
              <Badge variant="subtle" className="px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Enterprise Ready
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-gray mb-8 leading-tight">
              Transform Your Business with
              <span className="block bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent font-black">
                Intelligent Automation
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-gray mb-12 max-w-3xl mx-auto leading-relaxed">
              Harness the power of AI to streamline workflows, boost productivity, and unlock insights 
              that drive your business forward.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="gradient"
                className="px-8 py-6 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg font-medium rounded-full"
              >
                Watch Demo
              </Button>
            </div>

            <p className="text-sm text-neutral-gray mt-8">
              ✨ 14-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-cool-gray/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-blue to-royal-blue bg-clip-text text-transparent">
                10M+
              </div>
              <div className="text-neutral-gray mt-2">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-vivid-violet to-deep-purple bg-clip-text text-transparent">
                99.9%
              </div>
              <div className="text-neutral-gray mt-2">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent">
                150+
              </div>
              <div className="text-neutral-gray mt-2">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-royal-blue to-deep-purple bg-clip-text text-transparent">
                4.9/5
              </div>
              <div className="text-neutral-gray mt-2">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="subtle" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-gray mb-6">
              Everything you need to
              <span className="block bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent font-black">
                scale your business
              </span>
            </h2>
            <p className="text-xl text-neutral-gray max-w-3xl mx-auto">
              Powerful tools and intelligent insights designed to help you work smarter, not harder.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-neutral-gray/30">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-blue to-royal-blue rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-gray mb-4">AI Intelligence</h3>
                <p className="text-neutral-gray leading-relaxed">
                  Advanced machine learning algorithms that adapt to your business needs and provide actionable insights.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-neutral-gray/30">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-vivid-violet to-deep-purple rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-gray mb-4">Real-time Analytics</h3>
                <p className="text-neutral-gray leading-relaxed">
                  Comprehensive dashboards with live data visualization to track performance and identify trends instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-neutral-gray/30">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-gray mb-4">Automation</h3>
                <p className="text-neutral-gray leading-relaxed">
                  Streamline repetitive tasks and workflows with intelligent automation that learns from your patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-sky-tint via-white to-lilac-mist/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="gradient" className="mb-4">Live Demo</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-gray mb-6">
              See the magic in action
            </h2>
            <p className="text-xl text-neutral-gray max-w-2xl mx-auto">
              Watch how our AI transforms complex data into actionable insights in real-time.
            </p>
          </div>

          <Card className="overflow-hidden shadow-2xl border-0">
            <div className="relative bg-gradient-to-br from-sky-blue to-vivid-violet p-1">
              <div className="bg-white rounded-lg p-8">
                <div className="aspect-video bg-gradient-to-br from-cool-gray to-sky-tint/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Rocket className="h-10 w-10 text-sky-blue" />
                    </div>
                    <p className="text-slate-gray font-medium">Interactive Demo Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="subtle" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-gray mb-6">
              Loved by teams worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-neutral-gray/30">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-slate-gray mb-6 leading-relaxed">
                  "This platform transformed how we handle data analytics. The AI insights have helped us increase 
                  efficiency by 40% in just three months."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-blue to-royal-blue rounded-full mr-4" />
                  <div>
                    <div className="font-bold text-slate-gray">Sarah Chen</div>
                    <div className="text-neutral-gray text-sm">CEO, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-gray/30">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-slate-gray mb-6 leading-relaxed">
                  "The automation features alone saved our team 20+ hours per week. It's like having an extra 
                  team member that never sleeps."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-vivid-violet to-deep-purple rounded-full mr-4" />
                  <div>
                    <div className="font-bold text-slate-gray">Marcus Rodriguez</div>
                    <div className="text-neutral-gray text-sm">CTO, DataFlow Inc</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-cool-gray/30">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="gradient" className="mb-4">Pricing</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-gray mb-6">
            Start growing today
          </h2>
          <p className="text-xl text-neutral-gray mb-12">
            Join thousands of companies already transforming their business with AI.
          </p>

          <Card className="max-w-md mx-auto border-2 border-sky-blue/20 shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center justify-center mb-6">
                <span className="text-5xl font-bold text-slate-gray">Free</span>
                <span className="text-xl text-neutral-gray ml-2">for 14 days</span>
              </div>

              <ul className="text-left max-w-md mx-auto mb-8 space-y-4">
                <li className="flex items-center text-slate-gray">
                  <div className="w-6 h-6 rounded-full bg-sky-blue/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-sky-blue" />
                  </div>
                  Unlimited AI-powered insights
                </li>
                <li className="flex items-center text-slate-gray">
                  <div className="w-6 h-6 rounded-full bg-sky-blue/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-sky-blue" />
                  </div>
                  Real-time analytics dashboard
                </li>
                <li className="flex items-center text-slate-gray">
                  <div className="w-6 h-6 rounded-full bg-sky-blue/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-sky-blue" />
                  </div>
                  Advanced automation workflows
                </li>
                <li className="flex items-center text-slate-gray">
                  <div className="w-6 h-6 rounded-full bg-sky-blue/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="h-4 w-4 text-sky-blue" />
                  </div>
                  24/7 Priority support
                </li>
              </ul>

              <Button
                size="lg"
                variant="gradient"
                className="w-full py-6 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Your Free Trial
              </Button>
            </CardContent>
          </Card>

          <p className="text-sm text-neutral-gray mt-8">
            No credit card required • Cancel anytime • Full access to all features
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-sky-blue to-vivid-violet">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of companies using our AI platform to drive growth and innovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-sky-blue hover:bg-gray-100 px-8 py-6 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-medium rounded-full"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent">
                AI Platform
              </h3>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Empowering businesses with intelligent automation and insights to drive growth and innovation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Features</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Pricing</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">API</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Integrations</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">About</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Blog</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Careers</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}