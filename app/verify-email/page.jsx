"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MorphingLoader from "@/app/components/ui/loading";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import Image from "next/image";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setUserName(data.user?.name || "");
      } else {
        setStatus("error");
        setMessage(data.error || "Email verification failed");
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      setStatus("error");
      setMessage("An error occurred while verifying your email. Please try again.");
    }
  };

  const handleContinue = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/wizel-logo-horizontal.svg"
              alt="Wizel.ai Logo"
              width={150}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          {status === "verifying" && (
            <div className="py-8">
              <div className="flex justify-center mb-4">
                <MorphingLoader size="medium" showThemeText={false} />
              </div>
              <p className="text-gray-900 dark:text-gray-100 text-lg font-medium">
                Verifying your email...
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Please wait while we confirm your email address
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified Successfully!
              </h3>
              {userName && (
                <p className="text-gray-900 dark:text-gray-100 mb-4">
                  Welcome to Wizel.ai, {userName}!
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Your account is now active. You can start creating AI-powered email campaigns!
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 bg-sky-50 dark:bg-sky-900/20 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>Account verified and activated</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span>Welcome email sent to your inbox</span>
                </div>
              </div>

              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {message}
              </p>

              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-left">
                  <p className="font-medium mb-2">Common reasons for failure:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Verification link has expired (24-hour limit)</li>
                    <li>Link has already been used</li>
                    <li>Invalid or corrupted verification token</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/register")}
                  className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Request New Verification Email
                </Button>
                <Button
                  onClick={() => router.push("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
