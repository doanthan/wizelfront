"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  Target,
  DollarSign,
  Mail,
  BarChart3,
  Users,
  ArrowRight,
  Check,
  Sparkles,
  Bot,
  Brain,
  TrendingUp,
  Play,
  Star,
  Quote,
  Shield,
  Rocket,
  Award
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Gradient Background - Similar to Yorby */}
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 opacity-60" />
      <div className="fixed inset-0 bg-gradient-to-tr from-sky-100 via-transparent to-violet-100 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/20" />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Navigation Header */}
        <header className="px-6 py-6 md:px-12 lg:px-20">
          <nav className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-gray dark:text-white">Wizel AI</span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="text-slate-gray dark:text-gray-200 hover:text-sky-blue dark:hover:text-sky-blue transition-colors"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="px-6 md:px-12 lg:px-20 py-12 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Text */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    <span className="text-slate-gray dark:text-white">Automate Your</span>
                    <br />
                    <span className="text-slate-gray dark:text-white">Email</span>
                    <br />
                    <span className="text-slate-gray dark:text-white">Marketing</span>
                    <br />
                    <span className="bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent">
                      with AI.
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl text-neutral-gray dark:text-gray-300 leading-relaxed max-w-xl">
                    Save 10+ hours a week by automating your email campaigns with our AI-powered platform that creates, schedules, and optimizes — 24/7. ✨
                  </p>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 text-sm text-neutral-gray dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>500+ Marketers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>1M+ Emails Sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>45% Avg Open Rate</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Feature Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-2xl font-bold text-slate-gray dark:text-white">
                      Why Choose Wizel?
                    </h2>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sky-tint to-sky-blue/20 rounded-lg flex items-center justify-center">
                        <Zap className="h-6 w-6 text-sky-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-gray dark:text-white mb-1">
                          Set up in minutes
                        </h3>
                        <p className="text-sm text-neutral-gray dark:text-gray-400">
                          Connect your store and start sending AI-optimized campaigns instantly
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-vivid-violet/20 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-vivid-violet" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-gray dark:text-white mb-1">
                          Smart targeting
                        </h3>
                        <p className="text-sm text-neutral-gray dark:text-gray-400">
                          AI segments your audience for maximum engagement and conversions
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-100 to-green-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-gray dark:text-white mb-1">
                          Save time & money
                        </h3>
                        <p className="text-sm text-neutral-gray dark:text-gray-400">
                          Reduce campaign creation time by 80% and increase ROI by 50%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="space-y-4 pt-6">
                    <p className="text-center text-sm text-neutral-gray dark:text-gray-400">
                      Join hundreds of companies already using Wizel
                    </p>

                    <Link href="/dashboard" className="block">
                      <Button
                        className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                        Start automating today
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>

                    <div className="flex items-center justify-center gap-6 text-xs text-neutral-gray dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>No credit card required</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>14-day free trial</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Video Section */}
        <section className="px-6 md:px-12 lg:px-20 py-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-gray dark:text-white mb-4">
                See Wizel AI in Action
              </h2>
              <p className="text-lg text-neutral-gray dark:text-gray-400 max-w-2xl mx-auto">
                Watch how leading marketers use Wizel to automate their email campaigns and drive incredible results
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-sky-blue to-vivid-violet p-1">
                <div className="relative bg-slate-gray rounded-xl aspect-video flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-blue/20 to-vivid-violet/20" />
                  <button className="relative z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-sky-blue ml-1" fill="currentColor" />
                  </button>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm opacity-90">Product Demo</p>
                    <p className="text-xs opacity-75">3:42</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="px-6 md:px-12 lg:px-20 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-gray dark:text-white mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-lg text-neutral-gray dark:text-gray-400">
                Powerful features designed to scale with your business
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-blue to-royal-blue rounded-xl flex items-center justify-center mb-4">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-gray dark:text-white mb-2">
                    AI Content Generation
                  </h3>
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    Create compelling email copy that converts with our advanced AI
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-vivid-violet to-deep-purple rounded-xl flex items-center justify-center mb-4">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-gray dark:text-white mb-2">
                    Smart Scheduling
                  </h3>
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    Automatically send emails at the optimal time for each recipient
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-gray dark:text-white mb-2">
                    Real-time Analytics
                  </h3>
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    Track performance and optimize campaigns with detailed insights
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                    <Rocket className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-gray dark:text-white mb-2">
                    A/B Testing
                  </h3>
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    Optimize your campaigns with built-in split testing tools
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-gray dark:text-white mb-2">
                    Enterprise Security
                  </h3>
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    Bank-level security with SOC2 compliance and encryption
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-gray dark:text-white mb-2">
                    Premium Support
                  </h3>
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    24/7 dedicated support team to help you succeed
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="px-6 md:px-12 lg:px-20 py-20 bg-gradient-to-r from-sky-tint/20 to-lilac-mist/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-gray dark:text-white mb-4">
                Loved by marketers worldwide
              </h2>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-lg text-neutral-gray dark:text-gray-400">
                4.9/5 rating from 500+ reviews
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "Wizel AI transformed our email marketing. We've seen a 3x increase in open rates and saved 15 hours per week.",
                  author: "Sarah Chen",
                  role: "Marketing Director",
                  company: "TechCorp"
                },
                {
                  quote: "The AI content generation is incredible. It understands our brand voice and creates emails that actually convert.",
                  author: "Michael Rodriguez",
                  role: "E-commerce Manager",
                  company: "StyleHub"
                },
                {
                  quote: "Best investment we've made. The ROI is outstanding and the platform is so intuitive to use.",
                  author: "Emily Watson",
                  role: "CEO",
                  company: "GrowthLabs"
                }
              ].map((testimonial, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-sky-blue/30 mb-4" />
                    <p className="text-slate-gray dark:text-gray-300 mb-6 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-full" />
                      <div>
                        <p className="font-semibold text-slate-gray dark:text-white">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-neutral-gray dark:text-gray-400">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 md:px-12 lg:px-20 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-sky-blue to-vivid-violet rounded-3xl p-12 text-white">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">10M+</div>
                  <div className="text-white/80">Emails Sent</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-white/80">Active Users</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">45%</div>
                  <div className="text-white/80">Avg Open Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">98%</div>
                  <div className="text-white/80">Customer Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section with Vibrant Card */}
        <section className="px-6 md:px-12 lg:px-20 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Vibrant Gradient Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-yellow-100 via-pink-200 to-purple-300 p-16">
              {/* Additional gradient overlay for more vibrancy */}
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-blue/20 via-transparent to-vivid-violet/30" />

              {/* Content */}
              <div className="relative z-10 text-center max-w-3xl mx-auto">
                <p className="text-sm font-semibold text-slate-gray/70 uppercase tracking-wider mb-4">
                  TRANSFORM YOUR EMAIL MARKETING
                </p>

                <h2 className="text-4xl md:text-5xl font-black text-slate-gray mb-6">
                  Ready to automate campaigns?
                </h2>
                <h3 className="text-3xl md:text-4xl font-black text-slate-gray mb-8">
                  Start your free trial today.
                </h3>

                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-slate-gray hover:bg-slate-gray/90 text-white px-10 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-12 lg:px-20 py-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-gray dark:text-white">Wizel AI</span>
              </div>
              <p className="text-sm text-neutral-gray dark:text-gray-400">
                © 2024 Wizel AI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}