"use client";

import { useState } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { useRouter } from "next/navigation";
import { 
    Search, 
    Store, 
    Plus, 
    ChevronUp,
    Settings,
    CreditCard,
    HelpCircle,
    LogOut,
    CheckCircle,
    Building2,
    Shield,
    User
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { useStores } from "@/app/contexts/store-context";
import { useToast } from "@/app/hooks/use-toast";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function StoreSelectorEnhanced({ collapsed = false, currentUser }) {
    const router = useRouter();
    const { toast } = useToast();
    const [menuOpen, setMenuOpen] = useState(false);
    const [storeSearch, setStoreSearch] = useState("");
    const { 
        stores, 
        selectedStoreId, 
        selectStore, 
        isLoadingStores, 
        getRecentStores 
    } = useStores();

    // Get current store
    const currentStore = stores?.find(s => 
        (s.public_id === selectedStoreId) || (s._id === selectedStoreId)
    );
    
    // Get recent stores for quick access (up to 4)
    const recentStores = getRecentStores ? getRecentStores(4) : [];
    
    // Filter stores based on search
    const filteredStores = storeSearch
        ? stores.filter((store) => 
            store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
            store.url?.toLowerCase().includes(storeSearch.toLowerCase())
          )
        : stores;

    // Handle store switching
    const handleStoreSwitch = (store) => {
        const storeId = store.public_id || store._id;
        selectStore(storeId);
        router.push(`/store/${storeId}`);
        setMenuOpen(false);
        
        // Show toast notification
        toast({
            title: "Store switched",
            description: `Now managing ${store.name}`,
        });
    };

    // Get store initials for avatar
    const getStoreInitials = (name) => {
        return name?.substring(0, 2).toUpperCase() || 'ST';
    };

    return (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex items-center w-full text-left hover:bg-sky-tint dark:hover:bg-gray-800 rounded-lg p-2 transition-all duration-200",
                    collapsed ? "justify-center" : ""
                )}>
                    {/* Store Avatar with gradient */}
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {currentStore ? getStoreInitials(currentStore.name) : <Store className="h-4 w-4" />}
                    </div>
                    
                    {!collapsed && (
                        <>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-gray dark:text-white truncate">
                                    {currentStore?.name || 'Select Store'}
                                </p>
                                <p className="text-xs text-neutral-gray dark:text-gray-400">
                                    {currentStore?.subscription_tier === 'enterprise' ? 'Enterprise' : 
                                     currentStore?.subscription_tier === 'pro' ? 'Pro Plan' : 
                                     stores?.length > 0 ? `${stores.length} stores` : 'No stores'}
                                </p>
                            </div>
                            <ChevronUp
                                className={cn(
                                    "h-4 w-4 text-neutral-gray transition-transform duration-200",
                                    menuOpen ? "rotate-0" : "rotate-180"
                                )}
                            />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                {/* User Profile Section */}
                {currentUser && (
                    <>
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center text-white font-semibold">
                                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-gray dark:text-white truncate">
                                        {currentUser.name || 'User'}
                                    </p>
                                    <p className="text-xs text-neutral-gray dark:text-gray-400 truncate">
                                        {currentUser.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Account Options */}
                        <div className="py-1">
                            <DropdownMenuItem asChild>
                                <a href="/profile" className="flex items-center w-full cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800">
                                    <User className="mr-2 h-4 w-4 text-neutral-gray" />
                                    <span className="text-sm">Profile</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/account-settings" className="flex items-center w-full cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800">
                                    <Settings className="mr-2 h-4 w-4 text-neutral-gray" />
                                    <span className="text-sm">Account Settings</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/billing" className="flex items-center w-full cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800">
                                    <CreditCard className="mr-2 h-4 w-4 text-neutral-gray" />
                                    <span className="text-sm">Billing & Plans</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/permissions" className="flex items-center w-full cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800">
                                    <Shield className="mr-2 h-4 w-4 text-neutral-gray" />
                                    <span className="text-sm">Permissions</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/help" className="flex items-center w-full cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800">
                                    <HelpCircle className="mr-2 h-4 w-4 text-neutral-gray" />
                                    <span className="text-sm">Help & Support</span>
                                </a>
                            </DropdownMenuItem>
                        </div>
                        
                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    </>
                )}
                
                {/* Quick Access Section - Recent Stores */}
                {recentStores.length > 0 && !isLoadingStores && (
                    <>
                        <DropdownMenuLabel className="px-3 py-1.5 text-xs font-semibold text-neutral-gray uppercase">
                            Quick Access
                        </DropdownMenuLabel>
                        
                        <div className="px-2 pb-2">
                            {recentStores.map((store) => {
                                const storeId = store.public_id || store._id;
                                const isSelected = selectedStoreId === storeId;
                                
                                return (
                                    <div
                                        key={storeId}
                                        className={cn(
                                            "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200",
                                            isSelected 
                                                ? "bg-gradient-to-r from-sky-tint to-lilac-mist/50 dark:from-sky-blue/20 dark:to-vivid-violet/20"
                                                : "hover:bg-sky-tint dark:hover:bg-gray-800"
                                        )}
                                        onClick={() => handleStoreSwitch(store)}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm",
                                            isSelected
                                                ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                                                : "bg-cool-gray dark:bg-gray-800 text-neutral-gray"
                                        )}>
                                            {getStoreInitials(store.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                isSelected ? "text-sky-blue" : "text-slate-gray dark:text-white"
                                            )}>
                                                {store.name}
                                            </p>
                                            <p className="text-xs text-neutral-gray dark:text-gray-400 truncate">
                                                {store.url?.replace(/^https?:\/\//, '') || 'No URL'}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <CheckCircle className="h-4 w-4 text-sky-blue flex-shrink-0" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    </>
                )}
                
                {/* All Stores Section */}
                <DropdownMenuLabel className="px-3 py-1.5 text-xs font-semibold text-neutral-gray uppercase">
                    All Stores
                </DropdownMenuLabel>
                
                {/* Search Input */}
                <div className="px-2 py-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-gray" />
                        <Input
                            placeholder="Search stores..."
                            value={storeSearch}
                            onChange={(e) => setStoreSearch(e.target.value)}
                            className="h-9 pl-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-gray dark:text-white placeholder:text-neutral-gray focus:border-sky-blue focus:ring-sky-blue"
                        />
                    </div>
                </div>
                
                {/* Store List */}
                <div className="mt-1 max-h-[200px] overflow-y-auto">
                    {isLoadingStores ? (
                        <div className="flex items-center justify-center py-4">
                            <MorphingLoader size="small" showThemeText={false} />
                            <span className="ml-2 text-sm text-neutral-gray">Loading stores...</span>
                        </div>
                    ) : filteredStores.length === 0 ? (
                        <p className="text-xs text-center text-neutral-gray py-4">
                            {storeSearch ? 'No stores found' : 'No stores available'}
                        </p>
                    ) : (
                        filteredStores.map((store) => {
                            const storeId = store.public_id || store._id;
                            const isSelected = selectedStoreId === storeId;
                            
                            return (
                                <DropdownMenuItem
                                    key={storeId}
                                    onClick={() => handleStoreSwitch(store)}
                                    className={cn(
                                        "flex items-center w-full cursor-pointer gap-3 mx-2",
                                        isSelected 
                                            ? "bg-gradient-to-r from-sky-tint to-lilac-mist/50 dark:from-sky-blue/20 dark:to-vivid-violet/20"
                                            : ""
                                    )}
                                >
                                    <div className="p-2 bg-sky-tint dark:bg-gray-800 rounded-lg">
                                        <Building2 className="h-4 w-4 text-sky-blue" />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium text-sm text-slate-gray dark:text-white truncate">
                                            {store.name}
                                        </span>
                                        <span className="text-xs text-neutral-gray dark:text-gray-400 truncate">
                                            {store.url?.replace(/^https?:\/\//, '') || 'No URL'}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="w-2 h-2 bg-gradient-to-r from-sky-blue to-vivid-violet rounded-full"></div>
                                    )}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>
                
                {/* Add Store Option */}
                <DropdownMenuItem asChild>
                    <a
                        href="/stores?action=new"
                        className="flex items-center w-full cursor-pointer mt-1 text-sky-blue hover:text-royal-blue dark:text-sky-blue dark:hover:text-sky-blue/80"
                    >
                        <div className="p-2 bg-gradient-to-r from-sky-blue/10 to-vivid-violet/10 rounded-lg mr-3">
                            <Plus className="h-4 w-4 text-sky-blue" />
                        </div>
                        <span className="font-medium">Add New Store</span>
                    </a>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                
                {/* Log Out */}
                <DropdownMenuItem 
                    className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                    onClick={() => {
                        signOut({ callbackUrl: '/' });
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}