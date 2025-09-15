"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Loader2, Key, Shield, Info, LogIn, RefreshCw } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function KlaviyoConnectPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const storePublicId = params.storePublicId;
    const router = useRouter();
    const { toast } = useToast();
    const hasFetched = useRef(false);

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [klaviyoApiKey, setKlaviyoApiKey] = useState("");
    const [step, setStep] = useState('auth'); // 'auth' or 'metric'
    const [authMethod, setAuthMethod] = useState('oauth'); // 'oauth' or 'api_key'
    const [accountInfo, setAccountInfo] = useState(null);
    const [metrics, setMetrics] = useState([]);
    const [selectedMetricId, setSelectedMetricId] = useState("");
    const [selectedReportingMetricId, setSelectedReportingMetricId] = useState("");
    const [testingApi, setTestingApi] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Check URL params for OAuth callback or errors
    useEffect(() => {
        const error = searchParams.get('error');
        const success = searchParams.get('success');
        const stepParam = searchParams.get('step');

        if (error) {
            toast({
                title: "Connection Error",
                description: decodeURIComponent(error),
                variant: "destructive",
            });
        }

        if (success === 'true' && stepParam === 'metric') {
            setStep('metric');
            setIsConnected(true);
            // Fetch metrics after successful OAuth
            if (store) {
                fetchMetrics();
            }
        }
    }, [searchParams, toast, store]);

    // Validate API key format
    const isValidApiKey = klaviyoApiKey.trim().startsWith("pk_");

    useEffect(() => {
        const fetchStore = async () => {
            // Prevent multiple API calls
            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                const res = await fetch(`/api/store/${storePublicId}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch store");
                }
                const data = await res.json();
                if (data.store) {
                    setStore(data.store);
                    // Check if already connected
                    if (data.store.klaviyo_integration?.status === "connected") {
                        setIsConnected(true);
                        setStep('metric');
                        setAuthMethod(data.store.klaviyo_integration?.auth_type || 'api_key');
                        if (data.store.klaviyo_integration?.auth_type === 'api_key') {
                            setKlaviyoApiKey("••••••••••••••••••••••••");
                        }
                        // Load existing metric selections
                        if (data.store.klaviyo_integration?.conversion_metric_id) {
                            setSelectedMetricId(data.store.klaviyo_integration.conversion_metric_id);
                        }
                        if (data.store.klaviyo_integration?.reporting_metric_id) {
                            setSelectedReportingMetricId(data.store.klaviyo_integration.reporting_metric_id);
                        }
                        // Auto-fetch metrics if connected
                        fetchMetrics();
                    }
                } else {
                    throw new Error("Store not found");
                }
            } catch (error) {
                console.error("Error fetching store:", error);
                toast({
                    title: "Error",
                    description: "Failed to load store information",
                    variant: "destructive",
                });
                router.push('/stores');
            } finally {
                setLoading(false);
            }
        };

        if (storePublicId && !hasFetched.current) {
            fetchStore();
        }
    }, [storePublicId, router, toast]);

    const handleOAuthConnect = async () => {
        setConnecting(true);
        try {
            const response = await fetch(`/api/store/${storePublicId}/klaviyo-oauth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.authUrl) {
                // Redirect to Klaviyo OAuth authorization page
                window.location.href = data.authUrl;
            } else {
                throw new Error(data.error || 'Failed to initiate OAuth');
            }
        } catch (error) {
            console.error('OAuth error:', error);
            toast({
                title: "Connection Error",
                description: error.message || "Failed to connect with OAuth",
                variant: "destructive",
            });
            setConnecting(false);
        }
    };

    const handleTestApi = async () => {
        if (!klaviyoApiKey.trim() || !isValidApiKey) {
            toast({
                title: "Invalid API Key",
                description: "Please enter a valid Klaviyo API key that starts with 'pk_'",
                variant: "destructive",
            });
            return;
        }

        setTestingApi(true);
        try {
            const response = await fetch(`/api/store/${storePublicId}/klaviyo-connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    apiKey: klaviyoApiKey.trim(),
                    action: 'test'
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAccountInfo(data.account);
                // Normalize metrics to ensure consistent structure
                const normalizedMetrics = (data.metrics || []).map(metric => ({
                    id: metric.id,
                    name: metric.name || metric.attributes?.name || metric.id,
                    attributes: metric.attributes || { name: metric.name },
                    isShopifyPlacedOrder: metric.isShopifyPlacedOrder || false,
                    integration: metric.integration,
                    category: metric.category || 'standard'
                }));
                setMetrics(normalizedMetrics);
                
                // Auto-select Shopify Placed Order if available for both metrics (only if not already set)
                const shopifyPlacedOrder = normalizedMetrics.find(m => m.isShopifyPlacedOrder);
                if (shopifyPlacedOrder) {
                    // Only set if not already selected or loaded from store
                    if (!selectedMetricId && !store?.klaviyo_integration?.conversion_metric_id) {
                        setSelectedMetricId(shopifyPlacedOrder.id);
                    }
                    if (!selectedReportingMetricId && !store?.klaviyo_integration?.reporting_metric_id) {
                        setSelectedReportingMetricId(shopifyPlacedOrder.id);
                    }
                }
                
                toast({
                    title: "Success",
                    description: "API key validated successfully",
                });
                setStep('metric');
                setIsConnected(true);
            } else {
                toast({
                    title: "Connection Failed",
                    description: data.error || "Invalid API key",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error testing API key:", error);
            toast({
                title: "Error",
                description: "Failed to validate API key",
                variant: "destructive",
            });
        } finally {
            setTestingApi(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            const response = await fetch(`/api/store/${storePublicId}/klaviyo-metrics`);
            if (response.ok) {
                const data = await response.json();
                // Normalize metrics to ensure consistent structure
                const normalizedMetrics = (data.metrics || []).map(metric => ({
                    id: metric.id,
                    name: metric.name || metric.attributes?.name || metric.id,
                    attributes: metric.attributes || { name: metric.name || metric.id },
                    isShopifyPlacedOrder: metric.isShopifyPlacedOrder || false,
                    integration: metric.integration,
                    category: metric.category || 'standard'
                }));
                setMetrics(normalizedMetrics);
                
                // Auto-select Shopify Placed Order if available for both metrics (only if not already set)
                const shopifyPlacedOrder = normalizedMetrics.find(m => m.isShopifyPlacedOrder);
                if (shopifyPlacedOrder) {
                    // Only set if not already selected or loaded from store
                    if (!selectedMetricId && !store?.klaviyo_integration?.conversion_metric_id) {
                        setSelectedMetricId(shopifyPlacedOrder.id);
                    }
                    if (!selectedReportingMetricId && !store?.klaviyo_integration?.reporting_metric_id) {
                        setSelectedReportingMetricId(shopifyPlacedOrder.id);
                    }
                }
                
                if (data.account) {
                    setAccountInfo(data.account);
                }
            }
        } catch (error) {
            console.error("Error fetching metrics:", error);
        }
    };

    const handleSaveConnection = async () => {
        // No validation needed - metric selection is optional

        setConnecting(true);
        try {
            const payload = {
                action: 'connect',
                conversion_metric_id: selectedMetricId || null,
                reporting_metric_id: selectedReportingMetricId || null,
                conversion_type: 'value'
            };

            // Only include API key if using API key auth
            if (authMethod === 'api_key' && klaviyoApiKey && klaviyoApiKey !== "••••••••••••••••••••••••") {
                payload.apiKey = klaviyoApiKey.trim();
            }

            const response = await fetch(`/api/store/${storePublicId}/klaviyo-connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "Connected Successfully",
                    description: "Klaviyo has been connected to your store",
                });
                
                // Start initial sync
                const syncResponse = await fetch(`/api/store/${storePublicId}/klaviyo-sync`, {
                    method: "POST",
                });

                if (syncResponse.ok) {
                    toast({
                        title: "Sync Started",
                        description: "Initial data sync has been started",
                    });
                }

                router.push(`/store/${storePublicId}`);
            } else {
                toast({
                    title: "Connection Failed",
                    description: data.error || "Failed to connect Klaviyo",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error connecting:", error);
            toast({
                title: "Error",
                description: "Failed to connect Klaviyo",
                variant: "destructive",
            });
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Klaviyo? This will stop all data syncing.")) {
            return;
        }

        try {
            const response = await fetch(`/api/store/${storePublicId}/klaviyo-connect`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast({
                    title: "Disconnected",
                    description: "Klaviyo has been disconnected from your store",
                });
                router.push(`/store/${storePublicId}`);
            } else {
                throw new Error("Failed to disconnect");
            }
        } catch (error) {
            console.error("Error disconnecting:", error);
            toast({
                title: "Error",
                description: "Failed to disconnect Klaviyo",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-blue" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/store/${storePublicId}`)}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Store
                </Button>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-gray dark:text-white">
                            Klaviyo Integration
                        </h1>
                        <p className="text-neutral-gray dark:text-gray-400 mt-1">
                            Connect your Klaviyo account to sync campaign data
                        </p>
                    </div>
                    {isConnected && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                        </Badge>
                    )}
                </div>
            </div>

            {/* Main Content */}
            {step === 'auth' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Connect to Klaviyo</CardTitle>
                        <CardDescription>
                            Choose your preferred authentication method
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={authMethod} onValueChange={setAuthMethod} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="oauth">
                                    <Shield className="h-4 w-4 mr-2" />
                                    OAuth (Recommended)
                                </TabsTrigger>
                                <TabsTrigger value="api_key">
                                    <Key className="h-4 w-4 mr-2" />
                                    API Key
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="oauth" className="space-y-4">
                                <div className="bg-sky-tint/20 dark:bg-sky-blue/10 rounded-lg p-4 border border-sky-blue/20">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-sky-blue mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-slate-gray dark:text-white">
                                                Secure OAuth Connection
                                            </h4>
                                            <p className="text-sm text-neutral-gray dark:text-gray-400 mt-1">
                                                OAuth is the most secure way to connect. You'll be redirected to Klaviyo 
                                                to authorize access, and we'll never see your password.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">What we'll access:</h3>
                                        <ul className="text-sm text-neutral-gray dark:text-gray-400 space-y-1">
                                            <li>• Campaign and flow performance data</li>
                                            <li>• Email and SMS metrics</li>
                                            <li>• Segment and form statistics</li>
                                            <li>• Account information and settings</li>
                                        </ul>
                                    </div>

                                    <Button
                                        onClick={handleOAuthConnect}
                                        disabled={connecting}
                                        className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                                    >
                                        {connecting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="h-4 w-4 mr-2" />
                                                Connect with OAuth
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="api_key" className="space-y-4">
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-amber-900 dark:text-amber-100">
                                                API Key Method
                                            </h4>
                                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                                API keys are being phased out by Klaviyo. We recommend using OAuth instead 
                                                for better security and future compatibility.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="api-key">Klaviyo Private API Key</Label>
                                    <div className="mt-1 relative">
                                        <Input
                                            id="api-key"
                                            type="password"
                                            value={klaviyoApiKey}
                                            onChange={(e) => setKlaviyoApiKey(e.target.value)}
                                            placeholder="pk_..."
                                            className={cn(
                                                "font-mono",
                                                klaviyoApiKey && !isValidApiKey && "border-red-500 focus:border-red-500"
                                            )}
                                        />
                                    </div>
                                    {klaviyoApiKey && !isValidApiKey && (
                                        <p className="text-sm text-red-600 mt-1">
                                            API key must start with "pk_"
                                        </p>
                                    )}
                                    <p className="text-xs text-neutral-gray dark:text-gray-400 mt-2">
                                        Find your API key in Klaviyo under Account → Settings → API Keys
                                    </p>
                                </div>

                                <Button
                                    onClick={handleTestApi}
                                    disabled={!isValidApiKey || testingApi}
                                    className="w-full"
                                >
                                    {testingApi ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="h-4 w-4 mr-2" />
                                            Connect with API Key
                                        </>
                                    )}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Account Info */}
                    {accountInfo && (
                        <Card className="mb-6">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Connected Account</CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {store?.klaviyo_integration?.auth_type === 'oauth' ? 'OAuth' : 'API Key'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-gray dark:text-gray-400">Account ID</p>
                                        <p className="font-mono text-slate-gray dark:text-white">{accountInfo.id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-gray dark:text-gray-400">Timezone</p>
                                        <p className="text-slate-gray dark:text-white">{accountInfo.timezone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-gray dark:text-gray-400">Currency</p>
                                        <p className="text-slate-gray dark:text-white">{accountInfo.preferred_currency || 'USD'}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-gray dark:text-gray-400">Test Account</p>
                                        <p className="text-slate-gray dark:text-white">{accountInfo.test_account ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metric Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Metrics Configuration</CardTitle>
                            <CardDescription>
                                Configure metrics for tracking conversions and reporting
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Conversion Metric - Standard metrics only */}
                            <div>
                                <Label htmlFor="metric">Conversion Metric</Label>
                                <Select
                                    value={selectedMetricId || "none"}
                                    onValueChange={(value) => setSelectedMetricId(value === "none" ? "" : value)}
                                >
                                    <SelectTrigger id="metric">
                                        <SelectValue placeholder="Select a metric (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {metrics.filter(metric => metric.category !== 'custom').map((metric) => (
                                            <SelectItem key={metric.id} value={metric.id}>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span>{metric.name || metric.attributes?.name || metric.id}</span>
                                                        {metric.integration && (
                                                            <span className="text-xs text-neutral-gray dark:text-gray-400">
                                                                ({metric.integration})
                                                            </span>
                                                        )}
                                                    </div>
                                                    {metric.isShopifyPlacedOrder && (
                                                        <Badge variant="secondary" className="ml-2 text-xs bg-sky-100 text-sky-700 border-sky-200">
                                                            Recommended
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-neutral-gray dark:text-gray-400 mt-2">
                                    This is your Placed Order event
                                </p>
                            </div>

                            {/* Reporting Metric - All metrics including custom */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Label htmlFor="reporting-metric">Reporting Metric</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                                                <Info className="h-3 w-3 text-neutral-gray" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-slate-gray dark:text-white">About Reporting Metrics</h4>
                                                <p className="text-sm text-neutral-gray dark:text-gray-400">
                                                    Some retailers track both online and in-store orders. The reporting metric allows you to track a different or custom metric for overall business reporting while keeping standard e-commerce metrics for conversion tracking.
                                                </p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <Select
                                    value={selectedReportingMetricId || "none"}
                                    onValueChange={(value) => setSelectedReportingMetricId(value === "none" ? "" : value)}
                                >
                                    <SelectTrigger id="reporting-metric">
                                        <SelectValue placeholder="Select a reporting metric (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {metrics.map((metric) => (
                                            <SelectItem key={metric.id} value={metric.id}>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span>{metric.name || metric.attributes?.name || metric.id}</span>
                                                        {metric.integration && (
                                                            <span className="text-xs text-neutral-gray dark:text-gray-400">
                                                                ({metric.integration})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {metric.category === 'custom' && (
                                                            <Badge variant="outline" className="text-xs border-vivid-violet text-vivid-violet">
                                                                Custom
                                                            </Badge>
                                                        )}
                                                        {metric.isShopifyPlacedOrder && (
                                                            <Badge variant="secondary" className="ml-2 text-xs bg-sky-100 text-sky-700 border-sky-200">
                                                                Recommended
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-neutral-gray dark:text-gray-400 mt-2">
                                    Used for overall business reporting and custom metrics tracking
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSaveConnection}
                                    disabled={connecting}
                                    className="flex-1 bg-sky-blue hover:bg-royal-blue text-white"
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save & Start Sync'
                                    )}
                                </Button>

                                {isConnected && (
                                    <Button
                                        variant="destructive"
                                        onClick={handleDisconnect}
                                    >
                                        Disconnect
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}