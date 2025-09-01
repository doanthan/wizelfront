"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Moon,
  Sun,
  Menu,
  X,
  Layers,
  MessageSquare,
  PieChart,
  Store,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/contexts/theme-context";
import { usePermissions } from "@/app/contexts/permissions-context";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
    href: "/dashboard/calendar",
    feature: FEATURES.CALENDAR,
    action: ACTIONS.VIEW,
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
    title: "Email Builder",
    icon: Mail,
    href: "/dashboard/email-builder",
    feature: FEATURES.EMAIL_BUILDER,
    action: ACTIONS.VIEW,
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
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
          "fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none transition-transform duration-300 z-40",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-vivid-violet rounded-lg shadow-sm" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                wizel.ai
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.title}>
                  <div>
                    {item.children ? (
                      <button
                        onClick={() => toggleExpanded(item.title)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isParentActive(item)
                            ? "bg-blue-50 dark:bg-sky-blue/20 text-sky-blue"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        {expandedItems[item.title] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-blue-50 dark:bg-sky-blue/20 text-sky-blue"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </div>

                  {/* Children items */}
                  {item.children && expandedItems[item.title] && (
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start mb-3"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet" />
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
                  {currentUser?.stores?.[0]?.roleId || 'Guest'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}