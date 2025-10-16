"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Mail, User, Building2, Phone, CheckCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RequestTrialPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    monthlyEmailVolume: "",
    currentPlatform: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Determine where logo should link to
  const logoHref = session ? "/dashboard" : "/";

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit form data to your backend
      const response = await fetch('/api/trial-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Show calendar after successful form submission
        setShowCalendar(true);
      }
    } catch (error) {
      console.error('Error submitting trial request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCalendar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Link href={logoHref} className="cursor-pointer hover:opacity-80 transition-opacity">
                <Image
                  src="/wizel-logo-horizontal.svg"
                  alt="Wizel.ai Logo"
                  width={150}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Thanks for your interest!
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Schedule a call with our team to discuss your needs and activate your free trial
            </p>
          </CardHeader>

          <CardContent>
            {/* Calendar Embed - Replace with your actual calendar booking URL */}
            <div className="w-full h-[700px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Calendly Embed */}
              <iframe
                src="https://calendly.com/your-calendly-link?embed_domain=wizel.ai&embed_type=Inline"
                width="100%"
                height="100%"
                frameBorder="0"
                className="rounded-lg"
              />

              {/* Alternative: Cal.com Embed
              <iframe
                src="https://cal.com/your-username/15min"
                width="100%"
                height="100%"
                frameBorder="0"
                className="rounded-lg"
              />
              */}

              {/* Placeholder if no calendar is set up yet */}
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <Calendar className="h-16 w-16 text-sky-blue mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Calendar Integration Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  We've received your request! Our team will contact you at <strong>{formData.email}</strong> within 24 hours to schedule your demo and activate your free trial.
                </p>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link href={logoHref} className="cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                src="/wizel-logo-horizontal.svg"
                alt="Wizel.ai Logo"
                width={150}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Request Your Free 14-Day Trial
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Tell us about your business and schedule a demo with our team
          </p>
        </CardHeader>

        <CardContent>
          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              What's included in your trial:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Full access to all features</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">AI-powered campaign builder</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Advanced analytics & reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Dedicated onboarding support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Unlimited campaigns</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Priority email support</span>
              </div>
            </div>
          </div>

          {/* Lead Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@company.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Your Company"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyEmailVolume">Monthly Email Volume</Label>
              <Input
                id="monthlyEmailVolume"
                type="text"
                value={formData.monthlyEmailVolume}
                onChange={(e) => handleInputChange('monthlyEmailVolume', e.target.value)}
                placeholder="e.g., 100,000 emails/month"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPlatform">Current Email Platform (if any)</Label>
              <Input
                id="currentPlatform"
                type="text"
                value={formData.currentPlatform}
                onChange={(e) => handleInputChange('currentPlatform', e.target.value)}
                placeholder="e.g., Klaviyo, Mailchimp, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Tell us about your needs (optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="What are you hoping to achieve with Wizel.ai?"
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white py-6 text-lg font-semibold"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  Schedule Demo & Start Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              By submitting this form, you agree to our Terms of Service and Privacy Policy.
              No credit card required.
            </p>
          </form>

          {/* Trust Signals */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Trusted by marketing teams at leading brands
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
              <span className="mx-2">•</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
              <span className="mx-2">•</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Setup in minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
