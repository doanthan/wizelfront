"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
