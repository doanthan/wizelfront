"use client";

import { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasCapital: false,
    hasSpecial: false,
    passwordsMatch: false,
  });

  // Email validation state
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    message: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Validate password in real-time
  useEffect(() => {
    const { password, confirmPassword } = formData;

    setPasswordValidation({
      minLength: password.length >= 8,
      hasCapital: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password.length > 0 && password === confirmPassword,
    });
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");

    // Real-time email validation
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailValidation({
          isValid: false,
          message: 'Please enter a valid email address',
        });
      } else {
        setEmailValidation({ isValid: true, message: '' });
      }
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least 1 uppercase letter");
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError("Password must contain at least 1 special character");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // Create user account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message - user needs to verify email before logging in
      setRegistrationSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });

      if (result?.error) {
        setError("Google sign-in failed. Please try again.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <MorphingLoader size="small" showThemeText={false} />
      </div>
    );
  }

  // Show success message after registration
  if (registrationSuccess) {
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
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Check Your Email!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-900 dark:text-gray-100 mb-4">
              We've sent a verification link to:
            </p>
            <p className="text-vivid-violet font-medium mb-6">
              {formData.email}
            </p>
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2">
                Next steps:
              </p>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here to log in and start using Wizel.ai</li>
              </ol>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              Go to Login
            </Button>
            <div className="mt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setRegistrationSuccess(false)}
                  className="text-vivid-violet hover:text-deep-purple font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Create Account
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Get started with wizel.ai today
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={`pl-10 ${!emailValidation.isValid && formData.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {!emailValidation.isValid && formData.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {!emailValidation.isValid && formData.email && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {emailValidation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">Password Requirements:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordValidation.minLength ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs ${passwordValidation.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasCapital ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs ${passwordValidation.hasCapital ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      At least 1 uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasSpecial ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs ${passwordValidation.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      At least 1 special character (!@#$%^&*...)
                    </span>
                  </div>
                  {formData.confirmPassword && (
                    <div className="flex items-center gap-2">
                      {passwordValidation.passwordsMatch ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={`text-xs ${passwordValidation.passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-vivid-violet hover:bg-deep-purple text-white"
              disabled={isLoading || !formData.email || !formData.password || !formData.name}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <MorphingLoader size="small" showThemeText={false} />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full mt-4 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2">
                <MorphingLoader size="small" showThemeText={false} />
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-900 dark:text-gray-100">Sign up with Google</span>
              </div>
            )}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                className="text-vivid-violet hover:text-deep-purple font-medium"
                onClick={() => router.push("/login")}
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Connect unlimited stores per contract
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              AI-powered email campaigns
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Advanced analytics and reporting
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}