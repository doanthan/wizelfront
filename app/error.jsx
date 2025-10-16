"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Something went wrong!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={() => reset()}
          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
