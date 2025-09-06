"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/contexts/theme-context";
import { usePermissions } from "@/app/contexts/permissions-context";
import { useSidebar } from "@/app/contexts/sidebar-context";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { FEATURES, ACTIONS } from "@/lib/permissions-config";

// Define permissions for each sidebar item
const sidebarItemsConfig = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    feature: FEATURES.DASHBOARD,
    action: ACTIONS.VIEW,
  },
  {
    title: "Stores",
    icon: Store,
    href: "/stores",
    feature: FEATURES.STORES,
    action: ACTIONS.VIEW,
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
    feature: FEATURES.CALENDAR,
    action: ACTIONS.VIEW,
  },
  {
    title: "Email Builder",
    icon: Mail,
    href: "/email-builder",
    feature: FEATURES.CAMPAIGNS,
    action: ACTIONS.CREATE,
  },
  {
    title: "Multi Account",
    icon: Layers,
    href: "/dashboard/accounts",
    feature: FEATURES.MULTI_ACCOUNT,
    action: ACTIONS.VIEW,
    children: [
      { 
        title: "Revenue", 
        icon: TrendingUp, 
        href: "/dashboard/accounts/revenue",
        feature: FEATURES.ANALYTICS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Campaigns", 
        icon: Mail, 
        href: "/dashboard/accounts/campaigns",
        feature: FEATURES.CAMPAIGNS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Flows", 
        icon: Zap, 
        href: "/dashboard/accounts/flows",
        feature: FEATURES.FLOWS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Deliverability", 
        icon: MessageSquare, 
        href: "/dashboard/accounts/deliverability",
        feature: FEATURES.ANALYTICS,
        action: ACTIONS.VIEW,
      },
    ],
  },
  {
    title: "Account Reports",
    icon: BarChart3,
    href: "/dashboard/reports",
    feature: FEATURES.REPORTS,
    action: ACTIONS.VIEW,
    children: [
      { 
        title: "Revenue", 
        icon: TrendingUp, 
        href: "/dashboard/reports/revenue",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Campaigns", 
        icon: Mail, 
        href: "/dashboard/reports/campaigns",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Flows", 
        icon: Zap, 
        href: "/dashboard/reports/flows",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Forms", 
        icon: FileText, 
        href: "/dashboard/reports/forms",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Segments", 
        icon: Users, 
        href: "/dashboard/reports/segments",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
      { 
        title: "Report", 
        icon: PieChart, 
        href: "/dashboard/reports/report",
        feature: FEATURES.REPORTS,
        action: ACTIONS.VIEW,
      },
    ],
  },
  {
    title: "Permissions",
    icon: Shield,
    href: "/permissions",
    feature: FEATURES.PERMISSIONS,
    action: ACTIONS.VIEW,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { checkPermission, currentUser, getUserRole, isImpersonating } = usePermissions();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isActive = (href) => pathname === href;
  const isParentActive = (item) => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some(child => pathname === child.href);
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
              isCollapsed ? "justify-center" : "space-x-2"
            )}>
              <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-vivid-violet rounded-lg shadow-sm flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  wizel.ai
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
                          isCollapsed ? "justify-center w-full" : "space-x-3"
                        )}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </div>
                        {!isCollapsed && (
                          expandedItems[item.title] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                          isActive(item.href)
                            ? "bg-blue-50 dark:bg-sky-blue/20 text-sky-blue"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                          isCollapsed ? "justify-center" : "space-x-3"
                        )}
                        title={isCollapsed ? item.title : ""}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {item.title}
                          </div>
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
                            href={child.href}
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

            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                  isCollapsed ? "justify-center" : "space-x-3"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentUser?.name || 'User'}
                      </p>
                      {isImpersonating && (
                        <Badge variant="gradient" className="text-xs">Viewing As</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentUser?.stores?.[0]?.roleId || 'owner'}
                    </p>
                  </div>
                )}
              </div>

              {/* User Menu Popup */}
              {showUserMenu && (
                <div className={cn(
                  "absolute bottom-full mb-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50",
                  isCollapsed ? "left-0 ml-14" : "left-0 right-0"
                )}>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentUser?.email || 'user@example.com'}
                    </p>
                  </div>
                  
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to profile settings
                    }}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to settings
                    }}
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut({ callbackUrl: '/' });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}