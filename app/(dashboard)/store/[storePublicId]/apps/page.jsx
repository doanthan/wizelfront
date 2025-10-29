"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import {
  ArrowLeft,
  Cloud,
  BarChart3,
  Mail,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  ExternalLink
} from "lucide-react";
import MorphingLoader from "@/app/components/ui/loading";

export default function AppsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storePublicId = params.storePublicId;

  const [store, setStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [activatingApp, setActivatingApp] = useState(null);

  // Available apps configuration
  const availableApps = [
    {
      id: "weather_app",
      name: "Weather App",
      description: "Send personalized campaigns based on local weather conditions. Target customers with weather-appropriate product recommendations.",
      icon: Cloud,
      iconColor: "text-sky-blue",
      iconBg: "bg-sky-tint/20",
      features: [
        "Real-time weather data integration",
        "Location-based targeting",
        "Automated weather-triggered campaigns",
        "Seasonal product recommendations"
      ],
      category: "Marketing Automation",
      status: "available"
    },
    {
      id: "advanced_reporting",
      name: "Advanced Reporting",
      description: "Unlock powerful analytics with custom reports, cohort analysis, and predictive insights for data-driven decisions.",
      icon: BarChart3,
      iconColor: "text-vivid-violet",
      iconBg: "bg-lilac-mist/20",
      features: [
        "Custom report builder",
        "Cohort analysis",
        "Predictive analytics",
        "Export to Excel/PDF",
        "Scheduled report delivery"
      ],
      category: "Analytics",
      status: "available"
    },
    {
      id: "wizel_deliverability",
      name: "Wizel Deliverability",
      description: "Improve email deliverability with advanced monitoring, spam score checking, and domain health insights.",
      icon: Mail,
      iconColor: "text-royal-blue",
      iconBg: "bg-sky-tint/20",
      features: [
        "Email deliverability monitoring",
        "Spam score analysis",
        "Domain health checks",
        "Sender reputation tracking",
        "Inbox placement insights"
      ],
      category: "Email Marketing",
      status: "available"
    }
  ];

  useEffect(() => {
    if (storePublicId) {
      fetchStore();
      fetchInstalledApps();
    }
  }, [storePublicId]);

  const fetchStore = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}`);
      if (!response.ok) {
        throw new Error('Store not found');
      }

      const data = await response.json();
      setStore(data.store);
    } catch (error) {
      console.error('Error fetching store:', error);
      toast({
        title: "Error",
        description: "Failed to load store details",
        variant: "destructive",
      });
      router.push('/stores');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstalledApps = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}/apps`);
      if (response.ok) {
        const data = await response.json();
        setApps(data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
      // Don't show error toast, just fail silently for now
    }
  };

  const handleActivateApp = async (appId) => {
    setActivatingApp(appId);

    try {
      const response = await fetch(`/api/store/${storePublicId}/apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appId }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate app');
      }

      const data = await response.json();
      setApps(data.apps || []);

      toast({
        title: "App Activated",
        description: `${availableApps.find(a => a.id === appId)?.name} has been activated successfully`,
      });
    } catch (error) {
      console.error('Error activating app:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActivatingApp(null);
    }
  };

  const handleDeactivateApp = async (appId) => {
    setActivatingApp(appId);

    try {
      const response = await fetch(`/api/store/${storePublicId}/apps/${appId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate app');
      }

      const data = await response.json();
      setApps(data.apps || []);

      toast({
        title: "App Deactivated",
        description: `${availableApps.find(a => a.id === appId)?.name} has been deactivated`,
      });
    } catch (error) {
      console.error('Error deactivating app:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActivatingApp(null);
    }
  };

  const isAppActive = (appId) => {
    return apps.some(app => app.appId === appId && app.status === 'active');
  };

  // Only show in development environment
  if (process.env.NEXT_PUBLIC_NODE_ENV !== 'development') {
    router.push(`/store/${storePublicId}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading apps..." />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Store Not Found</h1>
        <Button onClick={() => router.push('/stores')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stores
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stores')}
                className="p-1.5 hover:bg-sky-tint/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apps • {store.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enhance your store with powerful integrations</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={store.subscription_status === 'active' ? 'default' : 'secondary'}
                className={store.subscription_status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : ''}
              >
                {store.subscription_status}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                ID: {store.public_id}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            Store Details
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/collections`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            Collections
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/products`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            Products
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/ctas`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            CTAs
          </Button>
          <Button
            variant="ghost"
            className="rounded-none border-b-2 border-sky-blue text-sky-blue px-4 py-2"
          >
            Apps
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storePublicId}/users`)}
            className="rounded-none border-b-2 border-transparent hover:border-gray-300 px-4 py-2"
          >
            User Settings
          </Button>
        </div>

        {/* Apps Grid */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Available Apps</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Activate apps to unlock additional features for your store
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {availableApps.map((app) => {
              const Icon = app.icon;
              const isActive = isAppActive(app.id);
              const isProcessing = activatingApp === app.id;

              return (
                <Card
                  key={app.id}
                  className={`hover:shadow-lg transition-all ${
                    isActive ? 'border-sky-blue border-2' : 'border-gray-200'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${app.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${app.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base text-gray-900 dark:text-white flex items-center gap-2">
                          {app.name}
                          {isActive && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {app.category}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      {isActive ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              toast({
                                title: "Coming Soon",
                                description: "App settings will be available soon",
                              });
                            }}
                          >
                            <Settings className="mr-1 h-3 w-3" />
                            <span className="text-xs">Configure</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivateApp(app.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <MorphingLoader size="small" showThemeText={false} />
                            ) : (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                <span className="text-xs">Deactivate</span>
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          <span className="text-xs">Coming Soon</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Box */}
          <Card className="bg-sky-tint/10 border-sky-blue/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-sky-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Need a custom app?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact our team to discuss custom integrations and enterprise solutions tailored to your business needs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
