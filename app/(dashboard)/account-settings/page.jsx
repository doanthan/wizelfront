"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import { User, Mail, Phone, Building, CreditCard, Shield, Bell, ChevronRight, Key, Globe } from "lucide-react";

export default function AccountSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    timezone: "UTC",
    language: "en",
    notifications: {
      email: {
        marketing: true,
        security: true,
        updates: true,
        reports: true
      },
      push: {
        campaigns: true,
        alerts: true,
        reminders: true
      }
    },
    twoFactor: false
  });

  useEffect(() => {
    if (session?.user) {
      setUserData(prev => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || ""
      }));
      fetchUserSettings();
    }
  }, [session]);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          company: userData.company,
          timezone: userData.timezone,
          language: userData.language
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your profile has been updated."
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData.notifications)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your notification preferences have been updated."
        });
      } else {
        throw new Error("Failed to update notifications");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    const newValue = !userData.twoFactor;
    setUserData(prev => ({ ...prev, twoFactor: newValue }));

    try {
      const response = await fetch("/api/user/security/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: newValue ? "Two-factor authentication enabled." : "Two-factor authentication disabled."
        });
      } else {
        throw new Error("Failed to update 2FA");
      }
    } catch (error) {
      setUserData(prev => ({ ...prev, twoFactor: !newValue }));
      toast({
        title: "Error",
        description: "Failed to update two-factor authentication.",
        variant: "destructive"
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white">Account Settings</h1>
        <p className="text-neutral-gray dark:text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-sky-blue" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={userData.company}
                    onChange={(e) => setUserData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={userData.timezone} onValueChange={(value) => setUserData(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={userData.language} onValueChange={(value) => setUserData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                >
                  {saving ? <MorphingLoader size="small" showThemeText={false} /> : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-sky-blue" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose what email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-neutral-gray">News about product updates and features</p>
                  </div>
                  <Switch
                    checked={userData.notifications.email.marketing}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: { ...prev.notifications.email, marketing: checked }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-neutral-gray">Important notifications about your account security</p>
                  </div>
                  <Switch
                    checked={userData.notifications.email.security}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: { ...prev.notifications.email, security: checked }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Product Updates</p>
                    <p className="text-sm text-neutral-gray">Get notified when we launch new features</p>
                  </div>
                  <Switch
                    checked={userData.notifications.email.updates}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: { ...prev.notifications.email, updates: checked }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-neutral-gray">Receive weekly summary of your campaigns</p>
                  </div>
                  <Switch
                    checked={userData.notifications.email.reports}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: { ...prev.notifications.email, reports: checked }
                        }
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Push Notifications</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Campaign Updates</p>
                    <p className="text-sm text-neutral-gray">Get notified about campaign performance</p>
                  </div>
                  <Switch
                    checked={userData.notifications.push.campaigns}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          push: { ...prev.notifications.push, campaigns: checked }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Alerts</p>
                    <p className="text-sm text-neutral-gray">Important system notifications</p>
                  </div>
                  <Switch
                    checked={userData.notifications.push.alerts}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          push: { ...prev.notifications.push, alerts: checked }
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reminders</p>
                    <p className="text-sm text-neutral-gray">Get reminded about scheduled tasks</p>
                  </div>
                  <Switch
                    checked={userData.notifications.push.reminders}
                    onCheckedChange={(checked) =>
                      setUserData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          push: { ...prev.notifications.push, reminders: checked }
                        }
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                >
                  {saving ? <MorphingLoader size="small" showThemeText={false} /> : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-blue" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Key className="h-5 w-5 text-neutral-gray" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-neutral-gray">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Shield className="h-5 w-5 text-neutral-gray" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-neutral-gray">
                        {userData.twoFactor ? "Enabled for your account" : "Add an extra layer of security"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={userData.twoFactor}
                    onCheckedChange={handleToggle2FA}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Active Sessions</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-neutral-gray" />
                      <div>
                        <p className="font-medium text-sm">Chrome on MacOS</p>
                        <p className="text-xs text-neutral-gray">Current session • San Francisco, CA</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Active now</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Sign Out All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-blue" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Current Plan</h3>
                    <p className="text-neutral-gray">You're currently on the free plan</p>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                    onClick={() => router.push("/pricing")}
                  >
                    Upgrade Plan
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push("/billing")}
                >
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}