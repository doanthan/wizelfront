"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Loader2, Key, Shield, Info } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function KlaviyoConnectPage() {
    const params = useParams();
    const storePublicId = params.storePublicId;
    const router = useRouter();
    const { toast } = useToast();
    const hasFetched = useRef(false);

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [klaviyoApiKey, setKlaviyoApiKey] = useState("");
    const [step, setStep] = useState('api'); // 'api' or 'metric'
    const [accountInfo, setAccountInfo] = useState(null);
    const [metrics, setMetrics] = useState([]);
    const [selectedMetricId, setSelectedMetricId] = useState("");
    const [testingApi, setTestingApi] = useState(false);

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
                        setKlaviyoApiKey("••••••••••••••••••••••••");
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
                setMetrics(data.metrics);
                
                // Auto-select Shopify Placed Order if found
                const shopifyMetric = data.metrics.find(m => m.isShopifyPlacedOrder);
                if (shopifyMetric) {
                    setSelectedMetricId(shopifyMetric.id);
                }
                
                setStep('metric');
                toast({
                    title: "API Key Validated",
                    description: `Connected to ${data.account.name}. Please select a conversion metric.`,
                });
            } else {
                throw new Error(data.error || data.message || "Failed to validate API key");
            }
        } catch (error) {
            console.error("Error testing Klaviyo API:", error);
            toast({
                title: "Validation Failed",
                description: error.message || "Failed to validate API key. Please check your credentials and try again.",
                variant: "destructive",
            });
        } finally {
            setTestingApi(false);
        }
    };

    const handleConnectKlaviyo = async () => {
        if (!selectedMetricId) {
            toast({
                title: "Metric Required",
                description: "Please select a conversion metric to track",
                variant: "destructive",
            });
            return;
        }

        setConnecting(true);
        try {
            const response = await fetch(`/api/store/${storePublicId}/klaviyo-connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    apiKey: klaviyoApiKey.trim(),
                    conversionMetricId: selectedMetricId,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "Success!",
                    description: "Klaviyo connected successfully to your store",
                });
                // Navigate back to store details
                router.push(`/store/${storePublicId}`);
            } else {
                throw new Error(data.error || "Failed to connect Klaviyo");
            }
        } catch (error) {
            console.error("Error connecting Klaviyo:", error);
            toast({
                title: "Connection Failed",
                description: error.message || "Failed to connect Klaviyo. Please check your credentials and try again.",
                variant: "destructive",
            });
        } finally {
            setConnecting(false);
        }
    };

    const handleOAuthConnect = () => {
        // Redirect to Klaviyo OAuth flow
        const state = btoa(JSON.stringify({ storePublicId, returnUrl: `/store/${storePublicId}` }));
        const klaviyoAuthUrl = `https://www.klaviyo.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KLAVIYO_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/klaviyo/callback`)}&state=${state}&scope=read-campaigns read-lists read-profiles`;

        window.location.href = klaviyoAuthUrl;
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Klaviyo? This will stop all data syncing.")) {
            return;
        }

        setConnecting(true);
        try {
            const response = await fetch(`/api/store/${storePublicId}/klaviyo-disconnect`, {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "Disconnected",
                    description: "Klaviyo has been disconnected from your store",
                });
                setKlaviyoApiKey("");
                // Refresh store data
                window.location.reload();
            } else {
                throw new Error(data.error || "Failed to disconnect Klaviyo");
            }
        } catch (error) {
            console.error("Error disconnecting Klaviyo:", error);
            toast({
                title: "Disconnection Failed",
                description: error.message || "Failed to disconnect Klaviyo.",
                variant: "destructive",
            });
        } finally {
            setConnecting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-sky-blue" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-gray mb-2">Store Not Found</h2>
                    <p className="text-neutral-gray mb-4">The store you're looking for doesn't exist or you don't have access to it.</p>
                    <Button 
                        onClick={() => router.push("/stores")}
                        className="bg-sky-blue hover:bg-royal-blue text-white"
                    >
                        Back to Stores
                    </Button>
                </div>
            </div>
        );
    }

    const isConnected = store.klaviyo_integration?.status === "connected";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => router.push(`/store/${storePublicId}`)}
                                className="hover:bg-sky-tint/20"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">
                                    {isConnected ? "Manage Klaviyo Connection" : "Connect Klaviyo"}
                                </h1>
                                <p className="text-neutral-gray dark:text-gray-400">
                                    {isConnected 
                                        ? `Klaviyo is connected to ${store.name}`
                                        : `Connect your Klaviyo account to ${store.name}`
                                    }
                                </p>
                            </div>
                        </div>
                        {isConnected && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {!isConnected ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <img src="/klaviyo-icon.png" alt="Klaviyo" className="h-12 w-12" />
                            </div>
                            <h2 className="text-lg font-medium text-slate-gray dark:text-white mb-2">Connect Your Klaviyo Account</h2>
                            <p className="text-neutral-gray dark:text-gray-400">Choose your preferred connection method</p>
                        </div>
                        
                        {/* Connection Methods Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                            {/* OAuth Connection - Primary */}
                            <div className="lg:col-span-5">
                                <Card className="h-full hover:shadow-lg transition-shadow border-sky-blue/20">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <img src="/klaviyo-icon.png" alt="Klaviyo" className="h-8 w-8" />
                                            <Badge className="bg-sky-blue/10 text-sky-blue border-sky-blue/20">Recommended</Badge>
                                        </div>
                                        <CardTitle className="text-slate-gray dark:text-white">OAuth Connection</CardTitle>
                                        <CardDescription>Secure connection through Klaviyo</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-sky-tint/20 rounded-lg border border-sky-blue/20">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="h-5 w-5 text-sky-blue mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-neutral-gray dark:text-gray-400">
                                                        <span className="font-medium text-slate-gray dark:text-white">No rate limit restrictions</span> - OAuth connections are guaranteed to work without hitting API limits
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-slate-gray dark:text-white">What you'll get access to:</h4>
                                                <ul className="text-sm text-neutral-gray dark:text-gray-400 dark:text-gray-400 space-y-1">
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Campaign performance data
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Email lists and subscribers
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Customer profiles and segments
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Real-time analytics
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleOAuthConnect}
                                            className="w-full bg-gradient-to-r from-sky-blue to-royal-blue hover:from-royal-blue hover:to-sky-blue text-white shadow-md"
                                        >
                                            <Shield className="h-4 w-4 mr-2" />
                                            Connect with Klaviyo OAuth
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* OR Separator */}
                            <div className="lg:col-span-2 flex justify-center items-center">
                                {/* Desktop vertical OR */}
                                <div className="hidden lg:flex flex-col items-center justify-center h-full">
                                    <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600"></div>
                                    <div className="my-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
                                        <span className="text-sm font-medium text-neutral-gray dark:text-gray-400">OR</span>
                                    </div>
                                    <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600"></div>
                                </div>
                                {/* Mobile horizontal OR */}
                                <div className="lg:hidden w-full flex items-center justify-center my-8">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                                    <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm mx-4">
                                        <span className="text-sm font-medium text-neutral-gray dark:text-gray-400">OR</span>
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                                </div>
                            </div>

                            {/* Manual Connection - Alternative */}
                            <div className="lg:col-span-5">
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <img src="/klaviyo-icon.png" alt="Klaviyo" className="h-8 w-8" />
                                        </div>
                                        <CardTitle className="text-slate-gray dark:text-white">API Key Connection</CardTitle>
                                        <CardDescription>Connect using your Klaviyo API key</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-slate-gray dark:text-white">What you'll get access to:</h4>
                                                <ul className="text-sm text-neutral-gray dark:text-gray-400 dark:text-gray-400 space-y-1">
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Campaign performance data
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Email lists and subscribers
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Customer profiles and segments
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full"></div>
                                                        Real-time analytics
                                                    </li>
                                                </ul>
                                            </div>
                                            <div>
                                                <Label htmlFor="apiKey" className="text-slate-gray dark:text-white font-medium">
                                                    Klaviyo API Key
                                                </Label>
                                                <Input
                                                    id="apiKey"
                                                    type="password"
                                                    placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                    value={klaviyoApiKey}
                                                    onChange={(e) => setKlaviyoApiKey(e.target.value)}
                                                    disabled={step === 'metric'}  // Disable when on metric selection step
                                                    className={cn(
                                                        "mt-1 focus:border-sky-blue focus:ring-sky-blue/20",
                                                        step === 'metric' && "bg-gray-50 cursor-not-allowed opacity-75"
                                                    )}
                                                />
                                                <p className="text-xs text-neutral-gray dark:text-gray-400 mt-2">
                                                    {step === 'api' 
                                                        ? "Find this in your Klaviyo account under Settings → API Keys"
                                                        : "API key validated. Click Back to change it."
                                                    }
                                                </p>
                                                {klaviyoApiKey && !isValidApiKey && step === 'api' && (
                                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        API key must start with "pk_"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {step === 'api' ? (
                                            <Button
                                                onClick={handleTestApi}
                                                disabled={testingApi || !klaviyoApiKey.trim() || !isValidApiKey}
                                                variant="outline"
                                                className="w-full border-neutral-gray/30 hover:bg-gray-50"
                                            >
                                                {testingApi ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Validating API Key...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Key className="h-4 w-4 mr-2" />
                                                        Validate API Key
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <p className="text-sm text-green-700">
                                                            API Key validated for <span className="font-medium">{accountInfo?.name}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="metric" className="text-slate-gray dark:text-white font-medium">
                                                        Select Conversion Metric
                                                    </Label>
                                                    <Select
                                                        value={selectedMetricId}
                                                        onValueChange={setSelectedMetricId}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Choose a metric to track conversions" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {metrics.map((metric) => (
                                                                <SelectItem key={metric.id} value={metric.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{metric.name}</span>
                                                                        {metric.isShopifyPlacedOrder && (
                                                                            <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 text-xs">
                                                                                Recommended
                                                                            </Badge>
                                                                        )}
                                                                        {metric.category === 'CUSTOM' && (
                                                                            <Badge variant="outline" className="ml-2 text-xs">
                                                                                Custom
                                                                            </Badge>
                                                                        )}
                                                                        <span className="text-xs text-neutral-gray ml-1">
                                                                            ({metric.integration})
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-neutral-gray dark:text-gray-400 mt-2">
                                                        This metric will be used to track conversions and calculate ROI
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => {
                                                            setStep('api');
                                                            setSelectedMetricId('');
                                                            setAccountInfo(null);
                                                            setMetrics([]);
                                                        }}
                                                        variant="outline"
                                                        className="flex-1"
                                                    >
                                                        Back
                                                    </Button>
                                                    <Button
                                                        onClick={handleConnectKlaviyo}
                                                        disabled={connecting || !selectedMetricId}
                                                        className="flex-1 bg-gradient-to-r from-sky-blue to-royal-blue hover:from-royal-blue hover:to-sky-blue text-white"
                                                    >
                                                        {connecting ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Connecting...
                                                            </>
                                                        ) : (
                                                            'Complete Connection'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </>
                ) : (
                    // Connected State
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-gray dark:text-white">Klaviyo Integration Status</CardTitle>
                            <CardDescription>Your Klaviyo account is successfully connected</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-neutral-gray dark:text-gray-400">Connection Status</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                            <span className="text-sm text-neutral-gray dark:text-gray-400">
                                                Connected on {new Date(store.klaviyo_integration?.connected_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label className="text-neutral-gray dark:text-gray-400">Account ID</Label>
                                        <p className="text-sm font-mono text-slate-gray mt-1">
                                            {store.klaviyo_integration?.public_id || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-neutral-gray dark:text-gray-400">Last Sync</Label>
                                        <p className="text-sm text-slate-gray dark:text-white mt-1">
                                            {store.klaviyo_integration?.last_sync 
                                                ? new Date(store.klaviyo_integration.last_sync).toLocaleString()
                                                : "Never synced"
                                            }
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <Label className="text-neutral-gray dark:text-gray-400">Sync Status</Label>
                                        <p className="text-sm text-slate-gray dark:text-white mt-1">
                                            {store.klaviyo_integration?.sync_status || "Ready"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t">
                                <Button
                                    onClick={handleDisconnect}
                                    variant="destructive"
                                    disabled={connecting}
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Disconnecting...
                                        </>
                                    ) : (
                                        "Disconnect Klaviyo"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Help Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-gray dark:text-white">
                            <Info className="h-5 w-5 text-sky-blue" />
                            Need Help?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-slate-gray dark:text-white mb-2">Finding Your API Key</h4>
                                <ol className="text-sm text-neutral-gray dark:text-gray-400 space-y-1">
                                    <li>1. Log in to your Klaviyo account</li>
                                    <li>2. Go to Settings → API Keys</li>
                                    <li>3. Copy your Public API Key (starts with "pk_")</li>
                                    <li>4. Paste it in the form above</li>
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-gray dark:text-white mb-2">OAuth Connection</h4>
                                <p className="text-sm text-neutral-gray dark:text-gray-400">
                                    The OAuth method will redirect you to Klaviyo to authorize the connection.
                                    This is the recommended approach as it's more secure and doesn't require you to handle API keys manually.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}