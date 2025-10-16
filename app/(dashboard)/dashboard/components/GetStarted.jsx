"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { Rocket, Store, BarChart3, Calendar, Users } from "lucide-react";

export default function GetStarted() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/stores');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Main Content */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Wizel.ai!
          </h1>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Let's get you setup.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Follow these quick steps to start your journey.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-xl mx-auto">
          {/* Connect Store Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Store className="h-8 w-8 text-sky-blue" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                1. Connect Your Store
              </h3>
              <Button
                onClick={handleGetStarted}
                className="w-full bg-sky-blue hover:bg-royal-blue text-white font-semibold shadow-md"
              >
                Connect Now
              </Button>
            </CardContent>
          </Card>

          {/* Request Trial Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Rocket className="h-8 w-8 text-vivid-violet" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                2. Request Free Trial
              </h3>
              <Button
                onClick={() => router.push('/request-trial')}
                className="w-full bg-vivid-violet hover:bg-deep-purple text-white font-semibold shadow-md"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 pb-6 px-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-sky-blue to-royal-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                Advanced Analytics
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track campaign performance with detailed insights and metrics
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 pb-6 px-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-vivid-violet to-deep-purple rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                Campaign Calendar
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plan and visualize your marketing campaigns in one place
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 pb-6 px-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                Multi-Store Management
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage multiple Klaviyo accounts from a single dashboard
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Help Text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Need help? Visit our{" "}
          <a href="/support" className="text-sky-blue hover:text-royal-blue font-medium underline">
            Support Center
          </a>
          .
        </p>
      </div>
    </div>
  );
}
