"use client";

import { useState, useEffect, useRef } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  TrendingUp,
  Mail,
  Zap,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Menu,
  X,
  Layers,
  MessageSquare,
  PieChart,
  Store,
  Shield,
  LogOut,
  User,
  Settings as SettingsIcon,
  Rss,
  Lightbulb,
  CheckCircle,
  ShoppingBag,
  Palette,
  MousePointer2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/contexts/theme-context";
import { usePermissions } from "@/app/contexts/permissions-context";
import { useSidebar } from "@/app/contexts/sidebar-context";
import { useStores } from "@/app/contexts/store-context";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FEATURES, ACTIONS } from "@/lib/permissions-config";
import SidebarStoreSelector from "./sidebar-store-selector";
import StoreSelectorEnhanced from "./store-selector-enhanced";

// Define permissions for each sidebar item
const sidebarItemsConfig = [
  {
    title: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    href: "/dashboard",
    feature: FEATURES.DASHBOARD,
    action: ACTIONS.VIEW,
  },
  {
    title: "Stores",
    shortLabel: "Stores",
    icon: Store,
    href: "/stores",
    feature: FEATURES.STORES,
    action: ACTIONS.VIEW,
  },
  {
    title: "Calendar",
    shortLabel: "Calendar",
    icon: Calendar,
    href: "/calendar",
    feature: FEATURES.CALENDAR,
    action: ACTIONS.VIEW,
  },
  {
    title: "Email Builder",
    shortLabel: "Email",
    icon: Mail,
    href: "/email-builder",
    feature: FEATURES.CAMPAIGNS,
    action: ACTIONS.CREATE,
    comingSoon: true,
  },
  {
    title: "Web Feeds",
    shortLabel: "Feeds",
    icon: Rss,
    href: "/webfeeds",
    feature: FEATURES.CAMPAIGNS,
    action: ACTIONS.VIEW,
  },
  {
    title: "Idea Generator",
    shortLabel: "Ideas",
    icon: Lightbulb,
    href: "/idea-generator",
    feature: FEATURES.CAMPAIGNS,
    action: ACTIONS.CREATE,
  },
  {
    title: "Multi-Account Reporting",
    shortLabel: "Multi",
    icon: Layers,
    href: "/multi-account-reporting",
    feature: FEATURES.MULTI_ACCOUNT,
    action: ACTIONS.VIEW,
    children: [
      {
        title: "Revenue",
        icon: TrendingUp,
        href: "/multi-account-reporting?tab=revenue",
        feature: FEATURES.ANALYTICS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Campaigns",
        icon: Mail,
        href: "/multi-account-reporting?tab=campaigns",
        feature: FEATURES.CAMPAIGNS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Flows",
        icon: Zap,
        href: "/multi-account-reporting?tab=flows",
        feature: FEATURES.FLOWS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Deliverability",
        icon: MessageSquare,
        href: "/multi-account-reporting?tab=deliverability",
        feature: FEATURES.ANALYTICS,
        action: ACTIONS.VIEW,
      },
    ],
  },
  {
    title: "Account Reports",
    shortLabel: "Reports",
    icon: BarChart3,
    href: "/dashboard/reports",
    feature: FEATURES.REPORTS,
    action: ACTIONS.VIEW,
    children: [
      {
        title: "Revenue",
        icon: TrendingUp,
        href: "/account-report/revenue",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Campaigns",
        icon: Mail,
        href: "/account-report/campaigns",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Flows",
        icon: Zap,
        href: "/account-report/flows",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Forms",
        icon: FileText,
        href: "/account-report/forms",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Segments",
        icon: Users,
        href: "/account-report/segments",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Products",
        icon: ShoppingBag,
        href: "/account-report/products",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      {
        title: "Customers",
        icon: Users,
        href: "/account-report/customers",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
    ],
  },
  {
    title: "Users",
    shortLabel: "Users",
    icon: Users,
    href: "/stores/users",
    feature: FEATURES.TEAM,
    action: ACTIONS.VIEW,
  },
  {
    title: "Roles",
    shortLabel: "Roles",
    icon: Shield,
    href: "/stores/roles",
    feature: FEATURES.TEAM,
    action: ACTIONS.MANAGE,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { checkPermission, currentUser, getUserRole, isImpersonating } = usePermissions();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { 
    stores, 
    selectedStoreId,
    isLoadingStores, 
    refreshStores,
    selectStore,
    getRecentStores 
  } = useStores();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  // User menu state removed - now handled by StoreSelectorEnhanced

  useEffect(() => {
    setMounted(true);
    // Set selected store from current path if in store context
    const storeFromPath = getStoreIdFromPath();
    if (storeFromPath && selectStore) {
      selectStore(storeFromPath);
    }
    // Refresh stores on mount
    if (refreshStores) {
      refreshStores();
    }
  }, []);

  // User menu click outside handler removed - now handled by StoreSelectorEnhanced

  // Filter sidebar items based on permissions
  // TEMPORARILY DISABLED - Remove this comment block to re-enable permissions
  const sidebarItems = sidebarItemsConfig;
  
  // Original permission filtering - uncomment to re-enable
  // const sidebarItems = sidebarItemsConfig
  //   .filter(item => checkPermission(item.feature, item.action))
  //   .map(item => {
  //     if (item.children) {
  //       const filteredChildren = item.children.filter(child => 
  //         checkPermission(child.feature, child.action)
  //       );
  //       return { ...item, children: filteredChildren.length > 0 ? filteredChildren : undefined };
  //     }
  //     return item;
  //   })
  //   .filter(item => !item.children || item.children.length > 0);

  const toggleExpanded = (title) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Extract store ID from current path if present
  const getStoreIdFromPath = () => {
    if (pathname.includes('/store/')) {
      const pathParts = pathname.split('/');
      const storeIndex = pathParts.indexOf('store');
      if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        return pathParts[storeIndex + 1];
      }
    }
    return null;
  };

  // Use store from path or selected store from context
  const currentStoreId = getStoreIdFromPath() || selectedStoreId;

  // Adjust href for store context
  const getAdjustedHref = (originalHref) => {
    // For account reports, always use store-specific paths if a store is selected
    if (originalHref.startsWith('/account-report')) {
      // Use current store from path or selected store from context
      const storeId = currentStoreId;
      if (storeId) {
        return originalHref.replace('/account-report', `/store/${storeId}/report`);
      }
      // If no store selected, redirect to first store's report
      if (stores && stores.length > 0) {
        const firstStore = stores[0];
        return originalHref.replace('/account-report', `/store/${firstStore.public_id}/report`);
      }
    }

    // Handle other store-specific pages
    if (currentStoreId) {
      if (originalHref === '/email-builder') {
        return `/store/${currentStoreId}${originalHref}`;
      }
    }

    return originalHref;
  };

  const isActive = (href) => {
    const adjustedHref = getAdjustedHref(href);

    // Special handling for account reports in store context
    if (currentStoreId && href.startsWith('/account-report')) {
      // Convert /account-report paths to store-specific paths
      const reportPath = href.replace('/account-report', `/store/${currentStoreId}/report`);
      if (pathname === reportPath) return true;
    }

    return pathname === adjustedHref;
  };
  
  const isParentActive = (item) => {
    const adjustedHref = getAdjustedHref(item.href);
    if (pathname === adjustedHref) return true;

    // Special handling for Account Reports parent
    if (item.title === "Account Reports" && currentStoreId) {
      // Check if we're in any store report page
      if (pathname.includes(`/store/${currentStoreId}/report`)) {
        return true;
      }
    }

    if (item.children) {
      return item.children.some(child => {
        const childAdjustedHref = getAdjustedHref(child.href);

        // Check for store-specific report paths
        if (currentStoreId && child.href.startsWith('/account-report')) {
          const reportPath = child.href.replace('/account-report', `/store/${currentStoreId}/report`);
          if (pathname === reportPath) return true;
        }

        return pathname === childAdjustedHref;
      });
    }
    return false;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 border border-neutral-gray/20 shadow-sm"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none transition-all duration-300 z-40",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-8 items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet text-white shadow-md hover:shadow-lg transition-all hover:scale-110 z-50"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
        <div className="flex flex-col h-full">
          {/* Header with Logo and Collapse Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "gap-3"
            )}>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white" aria-hidden="true">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  wizel
                </span>
              )}
            </Link>
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.title}>
                  <div>
                    {item.children ? (
                      item.comingSoon ? (
                        <div
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative cursor-not-allowed",
                            "text-gray-400 dark:text-gray-600 opacity-60"
                          )}
                          title={isCollapsed ? `${item.title} - Coming Soon` : ""}
                        >
                          <div className={cn(
                            "flex items-center flex-1",
                            isCollapsed ? "flex-col justify-center w-full gap-0.5" : "space-x-3"
                          )}>
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && (
                              <div className="flex items-center justify-between flex-1">
                                <span>{item.title}</span>
                                <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-vivid-violet/30 text-vivid-violet dark:border-vivid-violet/50 dark:text-vivid-violet">
                                  Coming Soon
                                </Badge>
                              </div>
                            )}
                            {isCollapsed && (
                              <span className="text-[9px] font-medium leading-tight">
                                {item.shortLabel || item.title}
                              </span>
                            )}
                          </div>
                          {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {item.title} - Coming Soon
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => !isCollapsed && toggleExpanded(item.title)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                            isParentActive(item)
                              ? "bg-blue-50 dark:bg-sky-blue/20 text-sky-blue"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                          )}
                          title={isCollapsed ? item.title : ""}
                        >
                          <div className={cn(
                            "flex items-center",
                            isCollapsed ? "flex-col justify-center w-full gap-0.5" : "space-x-3"
                          )}>
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && <span>{item.title}</span>}
                            {isCollapsed && (
                              <span className="text-[9px] font-medium leading-tight">
                                {item.shortLabel || item.title}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && (
                            expandedItems[item.title] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )
                          )}
                          {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {item.title}
                            </div>
                          )}
                        </button>
                      )
                    ) : item.comingSoon ? (
                      <div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative cursor-not-allowed",
                          "text-gray-400 dark:text-gray-600 opacity-60",
                          isCollapsed ? "flex-col justify-center gap-0.5" : "space-x-3"
                        )}
                        title={isCollapsed ? `${item.title} - Coming Soon` : ""}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-vivid-violet/30 text-vivid-violet dark:border-vivid-violet/50 dark:text-vivid-violet">
                              Coming Soon
                            </Badge>
                          </div>
                        )}
                        {isCollapsed && (
                          <>
                            <span className="text-[9px] font-medium leading-tight">
                              {item.shortLabel || item.title}
                            </span>
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {item.title} - Coming Soon
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={getAdjustedHref(item.href)}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                          isActive(item.href)
                            ? "bg-blue-50 dark:bg-sky-blue/20 text-sky-blue"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                          isCollapsed ? "flex-col justify-center gap-0.5" : "space-x-3"
                        )}
                        title={isCollapsed ? item.title : ""}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                        {isCollapsed && (
                          <>
                            <span className="text-[9px] font-medium leading-tight">
                              {item.shortLabel || item.title}
                            </span>
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {item.title}
                            </div>
                          </>
                        )}
                      </Link>
                    )}
                  </div>

                  {/* Children items */}
                  {item.children && expandedItems[item.title] && !isCollapsed && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.title}>
                          <Link
                            href={getAdjustedHref(child.href)}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              isActive(child.href)
                                ? "bg-blue-50 dark:bg-sky-blue/20 text-sky-blue"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white"
                            )}
                          >
                            <child.icon className="h-3 w-3" />
                            <span>{child.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                isCollapsed ? "justify-center" : "space-x-3"
              )}
              title={isCollapsed && mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : ""}
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 flex-shrink-0" />
                )
              ) : (
                <Moon className="h-4 w-4 flex-shrink-0" />
              )}
              {!isCollapsed && mounted && (
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              )}
              {!isCollapsed && !mounted && (
                <span>Toggle Theme</span>
              )}
              {isCollapsed && mounted && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </div>
              )}
            </button>

            {/* Enhanced Store Selector - Replaces User Profile */}
            <StoreSelectorEnhanced 
              collapsed={isCollapsed} 
              currentUser={currentUser}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
