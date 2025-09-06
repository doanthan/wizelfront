"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Loader2, Store, Shield, Info, ShoppingCart, Package, Tag, TrendingUp } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

export default function ShopifyConnectPage() {
    const params = useParams();
    const storePublicId = params.storePublicId;
    const router = useRouter();
    const { toast } = useToast();
    const hasFetched = useRef(false);

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [shopifyDomain, setShopifyDomain] = useState("");

    // Validate Shopify domain format
    const isValidDomain = shopifyDomain.trim().includes(".myshopify.com") || 
                         shopifyDomain.trim().match(/^[a-zA-Z0-9][a-zA-Z0-9-]+\.com$/);

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
                    if (data.store.shopify_integration?.status === "connected") {
                        setShopifyDomain(data.store.shopify_domain || "");
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

    const handleConnectShopify = async () => {
        if (!shopifyDomain.trim() || !isValidDomain) {
            toast({
                title: "Invalid Domain",
                description: "Please enter a valid Shopify domain (e.g., mystore.myshopify.com)",
                variant: "destructive",
            });
            return;
        }

        setConnecting(true);
        try {
            // Format domain
            let formattedDomain = shopifyDomain.trim();
            if (!formattedDomain.includes(".myshopify.com")) {
                formattedDomain = formattedDomain.replace(".com", ".myshopify.com");
            }

            const response = await fetch(`/api/store/${storePublicId}/shopify-connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    shopifyDomain: formattedDomain,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Redirect to Shopify OAuth
                if (data.authUrl) {
                    window.location.href = data.authUrl;
                } else {
                    toast({
                        title: "Success!",
                        description: "Shopify connection initiated",
                    });
                    router.push(`/store/${storePublicId}`);
                }
            } else {
                throw new Error(data.error || "Failed to connect Shopify");
            }
        } catch (error) {
            console.error("Error connecting Shopify:", error);
            toast({
                title: "Connection Failed",
                description: error.message || "Failed to connect Shopify. Please check your domain and try again.",
                variant: "destructive",
            });
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Shopify? This will stop all product syncing.")) {
            return;
        }

        setConnecting(true);
        try {
            const response = await fetch(`/api/store/${storePublicId}/shopify-disconnect`, {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "Disconnected",
                    description: "Shopify has been disconnected from your store",
                });
                setShopifyDomain("");
                // Refresh store data
                window.location.reload();
            } else {
                throw new Error(data.error || "Failed to disconnect Shopify");
            }
        } catch (error) {
            console.error("Error disconnecting Shopify:", error);
            toast({
                title: "Disconnection Failed",
                description: error.message || "Failed to disconnect Shopify.",
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

    const isConnected = store.shopify_integration?.status === "connected";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
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
                                <h1 className="text-2xl font-bold text-slate-gray">
                                    {isConnected ? "Manage Shopify Connection" : "Connect Shopify"}
                                </h1>
                                <p className="text-neutral-gray">
                                    {isConnected 
                                        ? `Shopify is connected to ${store.name}`
                                        : `Connect your Shopify store to ${store.name}`
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
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <img src="/shopify-icon.png" alt="Shopify" className="h-12 w-12" />
                            </div>
                            <h2 className="text-lg font-medium text-slate-gray mb-2">Connect Your Shopify Store</h2>
                            <p className="text-neutral-gray">Enter your Shopify domain to start the connection process</p>
                        </div>
                        
                        {/* Connection Card */}
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle className="text-slate-gray">Shopify Store Details</CardTitle>
                                <CardDescription>We'll use OAuth to securely connect to your Shopify store</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="domain" className="text-slate-gray font-medium">
                                            Shopify Store Domain
                                        </Label>
                                        <Input
                                            id="domain"
                                            type="text"
                                            placeholder="mystore.myshopify.com"
                                            value={shopifyDomain}
                                            onChange={(e) => setShopifyDomain(e.target.value)}
                                            className="mt-1 focus:border-sky-blue focus:ring-sky-blue/20"
                                        />
                                        <p className="text-xs text-neutral-gray mt-2">
                                            Enter your .myshopify.com domain or custom domain
                                        </p>
                                        {shopifyDomain && !isValidDomain && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Please enter a valid domain
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-sky-tint/20 rounded-lg p-4 border border-sky-blue/20">
                                        <h4 className="font-medium text-slate-gray mb-2 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-sky-blue" />
                                            What happens next?
                                        </h4>
                                        <ul className="text-sm text-neutral-gray space-y-1">
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full mt-1.5"></div>
                                                <span>You'll be redirected to Shopify to approve the connection</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full mt-1.5"></div>
                                                <span>We'll sync your products, collections, and orders</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 bg-vivid-violet rounded-full mt-1.5"></div>
                                                <span>Data will be updated automatically in real-time</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleConnectShopify}
                                    disabled={connecting || !shopifyDomain.trim() || !isValidDomain}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Connect Shopify Store
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="w-10 h-10 bg-vivid-violet/10 rounded-lg flex items-center justify-center mb-3">
                                        <Package className="h-5 w-5 text-vivid-violet" />
                                    </div>
                                    <h3 className="font-medium text-slate-gray mb-1">Product Sync</h3>
                                    <p className="text-sm text-neutral-gray">
                                        Automatically import all your products and variants
                                    </p>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="w-10 h-10 bg-sky-blue/10 rounded-lg flex items-center justify-center mb-3">
                                        <Tag className="h-5 w-5 text-sky-blue" />
                                    </div>
                                    <h3 className="font-medium text-slate-gray mb-1">Collections</h3>
                                    <p className="text-sm text-neutral-gray">
                                        Sync your product collections and categories
                                    </p>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="w-10 h-10 bg-royal-blue/10 rounded-lg flex items-center justify-center mb-3">
                                        <TrendingUp className="h-5 w-5 text-royal-blue" />
                                    </div>
                                    <h3 className="font-medium text-slate-gray mb-1">Analytics</h3>
                                    <p className="text-sm text-neutral-gray">
                                        Track sales, orders, and customer data
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    // Connected State
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-gray">Shopify Integration Status</CardTitle>
                            <CardDescription>Your Shopify store is successfully connected</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-neutral-gray">Connection Status</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                            <span className="text-sm text-neutral-gray">
                                                Connected on {new Date(store.shopify_integration?.installed_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label className="text-neutral-gray">Store Domain</Label>
                                        <p className="text-sm font-mono text-slate-gray mt-1">
                                            {store.shopify_domain || store.url}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-neutral-gray">Last Sync</Label>
                                        <p className="text-sm text-slate-gray mt-1">
                                            {store.shopify_integration?.last_sync 
                                                ? new Date(store.shopify_integration.last_sync).toLocaleString()
                                                : "Never synced"
                                            }
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <Label className="text-neutral-gray">Sync Status</Label>
                                        <p className="text-sm text-slate-gray mt-1">
                                            {store.shopify_integration?.sync_status || "Ready"}
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
                                        "Disconnect Shopify"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Help Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-gray">
                            <Info className="h-5 w-5 text-sky-blue" />
                            Need Help?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-slate-gray mb-2">Finding Your Domain</h4>
                                <ol className="text-sm text-neutral-gray space-y-1">
                                    <li>1. Log in to your Shopify admin</li>
                                    <li>2. Look at your browser's URL</li>
                                    <li>3. Copy the domain (e.g., mystore.myshopify.com)</li>
                                    <li>4. Or use your custom domain if you have one</li>
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-gray mb-2">Required Permissions</h4>
                                <p className="text-sm text-neutral-gray">
                                    We'll request access to read your products, collections, orders, and customer data. 
                                    You can revoke access anytime from your Shopify admin.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}